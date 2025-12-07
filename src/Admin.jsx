import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { supabase } from './supabaseClient'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [activeTab, setActiveTab] = useState('inbox') // Default to Inbox to see orders first

  // --- DATA STATES ---
  const [baseUrl, setBaseUrl] = useState('https://paperplay-nu.vercel.app') 
  const [count, setCount] = useState(5)
  const [generatedCodes, setGeneratedCodes] = useState([]) 
  const [dbCodes, setDbCodes] = useState([]) 
  const [requests, setRequests] = useState([])
  const [digitalLetters, setDigitalLetters] = useState([])
  const [loading, setLoading] = useState(false)
  
  // MODALS
  const [previewVideo, setPreviewVideo] = useState(null)
  const [viewQr, setViewQr] = useState(null)
  const [viewLetter, setViewLetter] = useState(null)

  useEffect(() => {
    const session = sessionStorage.getItem('paperplay_admin_session')
    if (session === 'true') {
      setIsAuthenticated(true)
      fetchAllData()
    }
  }, [])

  // --- AUTH ---
  function handleLogin(e) {
    e.preventDefault()
    const secret = import.meta.env.VITE_ADMIN_PASSWORD || '1234'
    if (passwordInput === secret) {
      setIsAuthenticated(true)
      sessionStorage.setItem('paperplay_admin_session', 'true')
      fetchAllData()
    } else {
      alert('Access Denied 🔒')
    }
  }

  function handleLogout() {
    setIsAuthenticated(false)
    sessionStorage.removeItem('paperplay_admin_session')
  }

  // --- FETCHING ---
  function fetchAllData() {
    setLoading(true)
    Promise.all([fetchCodes(), fetchRequests(), fetchDigitalLetters()])
      .finally(() => setLoading(false))
  }

  async function fetchCodes() {
    const { data } = await supabase.from('qr_codes').select('*').order('created_at', { ascending: false })
    if (data) setDbCodes(data)
  }
  async function fetchRequests() {
    const { data } = await supabase.from('letter_requests').select('*').order('created_at', { ascending: false })
    if (data) setRequests(data)
  }
  async function fetchDigitalLetters() {
    const { data } = await supabase.from('digital_letters').select('*').order('created_at', { ascending: false })
    if (data) setDigitalLetters(data)
  }

  // --- FACTORY ACTIONS ---
  async function generateAndSave() {
    if (!baseUrl) return alert('URL required')
    const batchId = Date.now().toString().slice(-6)
    const newItems = [], dbRows = []
    for (let i = 0; i < count; i++) {
      const id = `tag-${batchId}-${i + 1}`
      // Ensure we don't double slash if user adds trailing slash
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
      const link = `${cleanBase}/${id}`
      newItems.push({ id, link })
      dbRows.push({ id, video_url: null, unlock_at: null })
    }
    const { error } = await supabase.from('qr_codes').insert(dbRows)
    if (error) alert(error.message)
    else { setGeneratedCodes(newItems); fetchCodes(); }
  }

  async function deleteCode(id) {
    if (!confirm('Delete sticker?')) return
    await supabase.from('qr_codes').delete().eq('id', id)
    fetchCodes()
  }

  // --- CLEANUP ACTIONS ---
  async function deleteUsed() { if(confirm('Delete all USED codes?')) { await supabase.from('qr_codes').delete().not('video_url', 'is', null); fetchCodes(); } }
  async function deleteUnused() { if(confirm('Delete all UNUSED codes?')) { await supabase.from('qr_codes').delete().is('video_url', null); fetchCodes(); } }
  async function deleteAllStickers() { if(confirm('DANGER: Delete ALL stickers?')) { await supabase.from('qr_codes').delete().neq('id', '0'); fetchCodes(); } }

  // --- INBOX ACTIONS (THE STATUS UPDATE LOGIC) ---
  async function updateStatus(id, newStatus) {
    // 1. Update Database
    const { error } = await supabase
      .from('letter_requests')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      // 2. Optimistic Update (Update UI instantly without fetch)
      setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r))
    }
  }

  async function deleteRequest(id) { 
    if(confirm('Delete order?')) { 
      await supabase.from('letter_requests').delete().eq('id', id); 
      fetchRequests(); 
    } 
  }
  
  async function deleteAllRequests() { 
    if(confirm('Clear Inbox?')) { 
      await supabase.from('letter_requests').delete().neq('id', 0); 
      fetchRequests(); 
    } 
  }

  // --- DIGITAL LETTER ACTIONS ---
  async function deleteDigitalLetter(id) { if(confirm('Delete letter?')) { await supabase.from('digital_letters').delete().eq('id', id); fetchDigitalLetters(); } }
  async function deleteAllDigitalLetters() { if(confirm('Clear All Letters?')) { await supabase.from('digital_letters').delete().neq('id', 0); fetchDigitalLetters(); } }

  // --- LOGIN VIEW ---
  if (!isAuthenticated) return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <div style={styles.logoCircle}>🔒</div>
        <h2 style={styles.loginTitle}>Command Center</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            placeholder="Enter PIN" 
            value={passwordInput} 
            onChange={e => setPasswordInput(e.target.value)} 
            style={styles.input} 
            autoFocus
          />
          <button type="submit" style={styles.primaryBtn}>Unlock System</button>
        </form>
      </div>
    </div>
  )

  // --- DASHBOARD VIEW ---
  return (
    <div style={styles.dashboard}>
      
      {/* HEADER */}
      <div className="no-print" style={styles.header}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <div style={styles.brandIcon}>P</div>
          <div>
            <h2 style={styles.brandText}>PaperPlay Admin</h2>
            <p style={{margin:0, fontSize:'11px', color:'#888'}}>Control Panel</p>
          </div>
        </div>
        
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* STATS STRIP */}
      <div className="no-print" style={styles.statsContainer}>
        <div style={styles.statBox}>
           <span style={styles.statNum}>{requests.filter(r => r.status === 'Pending').length}</span>
           <span style={styles.statLabel}>PENDING</span>
        </div>
        <div style={styles.statBox}>
           <span style={styles.statNum}>{requests.filter(r => r.status === 'Processing').length}</span>
           <span style={styles.statLabel}>CRAFTING</span>
        </div>
        <div style={styles.statBox}>
           <span style={styles.statNum}>{dbCodes.length}</span>
           <span style={styles.statLabel}>QR CODES</span>
        </div>
      </div>

      {/* TABS */}
      <div className="no-print" style={styles.content}>
        <div style={styles.tabs}>
          <button onClick={() => setActiveTab('inbox')} style={activeTab === 'inbox' ? styles.tabActive : styles.tab}>
            📦 Orders <span style={styles.badge}>{requests.length}</span>
          </button>
          <button onClick={() => setActiveTab('factory')} style={activeTab === 'factory' ? styles.tabActive : styles.tab}>
            🏭 Factory
          </button>
          <button onClick={() => setActiveTab('digital')} style={activeTab === 'digital' ? styles.tabActive : styles.tab}>
            💌 Archive
          </button>
        </div>
      </div>

      {/* === TAB 1: INBOX (ORDERS) === */}
      {activeTab === 'inbox' && (
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={styles.tableHeader}>
              <h3 style={styles.cardTitle}>Order Management</h3>
              <div style={{display:'flex', gap:'10px'}}>
                <button onClick={fetchRequests} style={styles.secondaryBtn}>Refresh</button>
                <button onClick={deleteAllRequests} style={styles.cleanupBtn}>Clear All</button>
              </div>
            </div>

            <div className="admin-grid">
              {/* HEADER ROW (Desktop Only) */}
              <div className="desktop-header" style={styles.gridHeaderRow}>
                <span style={{flex:1}}>TICKET / TYPE</span>
                <span style={{flex:1.5}}>CUSTOMER</span>
                <span style={{flex:1}}>STATUS</span>
                <span style={{flex:0.5, textAlign:'right'}}>ACTION</span>
              </div>

              {requests.map(req => (
                <div key={req.id} style={styles.orderRow}>
                  
                  {/* COL 1: Ticket Info */}
                  <div style={{flex:1}}>
                    <div style={styles.ticketTag}>{req.ticket_code}</div>
                    <div style={{marginTop:'5px', fontWeight:'700', fontSize:'15px'}}>{req.letter_type}</div>
                    <div style={styles.microTag}>{req.category}</div>
                  </div>

                  {/* COL 2: Customer */}
                  <div style={{flex:1.5}}>
                    <div style={{fontWeight:'600'}}>{req.customer_name}</div>
                    <a href={req.contact_link.includes('http') ? req.contact_link : `https://${req.contact_link}`} target="_blank" style={styles.link}>
                      🔗 Contact Link
                    </a>
                  </div>

                  {/* COL 3: STATUS DROPDOWN */}
                  <div style={{flex:1}}>
                    <label style={{fontSize:'10px', color:'#999', fontWeight:'700', display:'block', marginBottom:'4px'}}>CURRENT STAGE</label>
                    <select 
                      value={req.status} 
                      onChange={(e) => updateStatus(req.id, e.target.value)}
                      style={{...styles.statusSelect, ...styles[`status${req.status}`]}}
                    >
                      <option value="Pending">🕒 Pending</option>
                      <option value="Processing">🔨 Crafting</option>
                      <option value="Done">✅ Ready/Done</option>
                    </select>
                  </div>

                  {/* COL 4: Actions */}
                  <div style={{flex:0.5, textAlign:'right'}}>
                    <button onClick={() => deleteRequest(req.id)} style={styles.iconBtnDanger}>🗑️</button>
                  </div>
                </div>
              ))}
              {requests.length === 0 && <p style={styles.emptyText}>No active orders.</p>}
            </div>
          </div>
        </div>
      )}

      {/* === TAB 2: FACTORY (QR CODES) === */}
      {activeTab === 'factory' && (
        <div style={styles.content}>
          
          <div style={styles.grid2}>
            {/* LEFT: GENERATOR & MAINTENANCE */}
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Generate Stickers</h3>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Base URL</label>
                  <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} style={styles.input} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Quantity</label>
                  <input type="number" value={count} onChange={e => setCount(Number(e.target.value))} style={styles.input} />
                </div>
                <button onClick={generateAndSave} style={styles.primaryBtn}>Create Batch</button>
                {generatedCodes.length > 0 && <button onClick={() => window.print()} style={{...styles.secondaryBtn, marginTop:'10px', width:'100%'}}>🖨️ Print Preview</button>}
              </div>

              {/* MAINTENANCE CONSOLE (Fixed the cleanup button issue) */}
              <div style={styles.card}>
                 <h3 style={{...styles.cardTitle, color:'#c0392b'}}>Maintenance Console</h3>
                 <p style={{fontSize:'12px', color:'#666', marginBottom:'15px'}}>Clean up the database.</p>
                 <div style={{display:'grid', gap:'10px'}}>
                    <button onClick={deleteUsed} style={styles.consoleBtn}>🧹 Clear Used QRs</button>
                    <button onClick={deleteUnused} style={styles.consoleBtn}>🧹 Clear Unused QRs</button>
                    <button onClick={deleteAllStickers} style={{...styles.consoleBtn, color:'#c0392b', borderColor:'#ffcccc'}}>⚠️ Delete EVERYTHING</button>
                 </div>
              </div>

            </div>

            {/* RIGHT: DATABASE LIST */}
            <div style={styles.card}>
              <div style={styles.tableHeader}>
                <h3 style={styles.cardTitle}>Database ({dbCodes.length})</h3>
                <button onClick={fetchCodes} style={styles.secondaryBtn}>Refresh</button>
              </div>
              
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.thRight}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbCodes.map(row => (
                      <tr key={row.id}>
                        <td style={styles.td}><span style={{fontFamily:'monospace'}}>{row.id}</span></td>
                        <td style={styles.td}>{row.video_url ? <Badge type="used">Used</Badge> : <Badge type="empty">Empty</Badge>}</td>
                        <td style={styles.tdRight}>
                          {row.video_url && <button onClick={() => setPreviewVideo(row.video_url)} style={styles.textBtn}>▶ Watch</button>}
                          <button onClick={() => setViewQr({link: `${baseUrl}/${row.id}`, id: row.id})} style={styles.iconBtn}>👁️</button>
                          <button onClick={() => deleteCode(row.id)} style={styles.iconBtnDanger}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PRINT AREA (Hidden unless printing) */}
          <div className="printable-area" style={{display:'none'}}>
            <h2 style={{textAlign:'center', marginBottom:'20px'}}>PaperPlay Stickers</h2>
            <div style={styles.previewGrid}>
              {generatedCodes.map(item => (
                <div key={item.id} style={styles.qrItem}>
                  <QRCode value={item.link} size={60} />
                  <p style={styles.qrText}>{item.id}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === TAB 3: DIGITAL ARCHIVE === */}
      {activeTab === 'digital' && (
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={styles.tableHeader}>
              <h3 style={styles.cardTitle}>Digital Letters</h3>
              <div style={{display:'flex', gap:'10px'}}>
                <button onClick={fetchDigitalLetters} style={styles.secondaryBtn}>Refresh</button>
                <button onClick={deleteAllDigitalLetters} style={styles.cleanupBtn}>Clear All</button>
              </div>
            </div>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Sender</th>
                    <th style={styles.th}>Theme</th>
                    <th style={styles.th}>Ticket</th>
                    <th style={styles.th}>Unlock</th>
                    <th style={styles.thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {digitalLetters.map(l => (
                    <tr key={l.id}>
                      <td style={styles.td}><b>{l.sender_name}</b></td>
                      <td style={styles.td}><span style={styles.tag}>{l.theme}</span></td>
                      <td style={styles.td}><span style={styles.ticketTag}>{l.ticket_code}</span></td>
                      <td style={styles.td}>{l.unlock_at ? new Date(l.unlock_at).toLocaleDateString() : 'Instant'}</td>
                      <td style={styles.tdRight}>
                        <button onClick={() => setViewLetter(l)} style={{...styles.textBtn, marginRight:'10px'}}>Read</button>
                        <button onClick={() => deleteDigitalLetter(l.id)} style={styles.iconBtnDanger}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {digitalLetters.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:'20px', color:'#999'}}>No letters yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {previewVideo && <Modal onClose={() => setPreviewVideo(null)}><video src={previewVideo} controls autoPlay style={{ width: '100%', borderRadius: '10px' }} /></Modal>}
      {viewQr && <Modal onClose={() => setViewQr(null)}><QRCode value={viewQr.link} size={150} /><p style={{marginTop:'10px', color: '#333', fontWeight:'bold'}}>{viewQr.id}</p></Modal>}
      {viewLetter && <Modal onClose={() => setViewLetter(null)}>
        <h3 style={{marginTop:0, color: '#333'}}>Letter Content</h3>
        <div style={{background: '#f9f9f9', padding:'20px', borderRadius:'10px', textAlign:'left', whiteSpace:'pre-wrap', maxHeight:'300px', overflowY:'auto', border:'1px solid #eee', color: '#333', fontSize:'14px', fontFamily: 'serif'}}>
          {viewLetter.message_body}
        </div>
      </Modal>}

      <style>{`
        @media print { 
          .no-print { display: none !important; } 
          .printable-area { display: block !important; } 
          body { background: white; }
        }
        @media (max-width: 768px) {
          .desktop-header { display: none !important; }
          .order-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .order-row > div { width: 100%; text-align: left !important; }
          .grid2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

// --- PROFESSIONAL STYLES ---
const styles = {
  // LAYOUT
  dashboard: { minHeight: '100vh', background: '#f5f5f7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1a1a1a', paddingBottom: '40px' },
  content: { maxWidth: '1000px', margin: '0 auto', padding: '0 20px', marginBottom: '20px' },
  grid2: { display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px' },

  // HEADER & STATS
  header: { background: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 100, marginBottom: '20px' },
  brandIcon: { width: '36px', height: '36px', background: '#1a1a1a', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' },
  brandText: { margin: '0', fontSize: '18px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.5px' },
  
  statsContainer: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', maxWidth: '1000px', margin: '0 auto 20px', padding: '0 20px' },
  statBox: { background: 'white', padding: '15px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' },
  statNum: { display: 'block', fontSize: '24px', fontWeight: '800', color: '#1a1a1a' },
  statLabel: { fontSize: '10px', fontWeight: '700', color: '#aaa', letterSpacing: '1px' },

  // LOGIN
  loginPage: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f7' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', textAlign: 'center', width: '320px' },
  logoCircle: { width: '60px', height: '60px', background: '#1a1a1a', borderRadius: '50%', color: 'white', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' },
  loginTitle: { margin: '0 0 25px 0', fontSize: '22px', fontWeight: '800', color: '#1a1a1a' },

  // TABS
  tabs: { background: '#e0e0e0', padding: '4px', borderRadius: '12px', display: 'inline-flex', gap: '4px', marginBottom: '10px' },
  tab: { background: 'transparent', border: 'none', padding: '8px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: '600', color: '#666', cursor: 'pointer', transition: '0.2s' },
  tabActive: { background: 'white', border: 'none', padding: '8px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: '700', color: '#1a1a1a', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'default' },
  badge: { background: '#1a1a1a', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', marginLeft: '5px' },

  // CARDS & GRID
  card: { background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' },
  cardTitle: { margin: '0 0 20px 0', fontSize: '15px', fontWeight: '800', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.5px' },
  
  // INBOX SPECIFIC
  gridHeaderRow: { display: 'flex', padding: '0 15px 10px', borderBottom: '2px solid #f5f5f7', marginBottom: '10px', color: '#aaa', fontSize: '11px', fontWeight: '700', letterSpacing: '1px' },
  orderRow: { display: 'flex', alignItems: 'center', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #f0f0f0', marginBottom: '10px', transition: 'transform 0.1s' },
  ticketTag: { fontFamily: 'monospace', fontWeight: '700', background: '#f0f0f0', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', color: '#333', display: 'inline-block' },
  microTag: { fontSize: '10px', fontWeight: '700', background: '#eee', padding: '2px 6px', borderRadius: '4px', color: '#666', marginTop: '4px', display: 'inline-block' },
  
  // STATUS SELECT
  statusSelect: { padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', border: '1px solid transparent', cursor: 'pointer', width: '100%', outline: 'none' },
  statusPending: { background: '#fff9db', color: '#e67e22' },
  statusProcessing: { background: '#e3fafc', color: '#0984e3' },
  statusDone: { background: '#d4edda', color: '#27ae60' },

  // FORM ELEMENTS
  inputGroup: { marginBottom: '15px' },
  label: { display: 'block', fontSize: '11px', fontWeight: '700', color: '#aaa', marginBottom: '6px', textTransform: 'uppercase' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e0e0e0', background: '#f9f9f9', fontSize: '14px', outline: 'none', color: '#333', transition: 'border 0.2s' },
  
  // BUTTONS
  primaryBtn: { width: '100%', background: '#1a1a1a', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  secondaryBtn: { background: '#f0f0f0', color: '#333', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' },
  logoutBtn: { background: 'white', color: '#c0392b', border: '1px solid #ffe3e3', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  cleanupBtn: { background: '#fff0f0', color: '#c0392b', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  consoleBtn: { width: '100%', textAlign: 'left', padding: '12px', background: 'white', border: '1px solid #eee', borderRadius: '8px', fontSize: '13px', color: '#555', cursor: 'pointer', marginBottom: '0' },
  
  textBtn: { background: 'transparent', color: '#0984e3', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', padding: '5px' },
  iconBtn: { background: '#f5f5f7', border: 'none', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '5px', color: '#333' },
  iconBtnDanger: { background: '#fff0f0', border: 'none', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#c0392b' },

  // TABLES
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '15px', borderBottom: '2px solid #f5f5f7', color: '#aaa', fontWeight: '700', fontSize: '11px', letterSpacing: '0.5px' },
  thRight: { textAlign: 'right', padding: '15px', borderBottom: '2px solid #f5f5f7', color: '#aaa', fontWeight: '700', fontSize: '11px', letterSpacing: '0.5px' },
  td: { padding: '15px', borderBottom: '1px solid #f9f9f9', color: '#333' },
  tdRight: { padding: '15px', borderBottom: '1px solid #f9f9f9', textAlign: 'right' },
  
  // MISC
  previewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' },
  qrItem: { border: '1px solid #eee', borderRadius: '10px', padding: '10px', textAlign: 'center' },
  qrText: { margin: '5px 0 0', fontSize: '10px', color: '#888', fontFamily: 'monospace' },
  emptyText: { color: '#ccc', fontSize: '14px', textAlign: 'center', padding: '40px' },
  tag: { background: '#f0f0f0', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#555', fontWeight: '600' },
  link: { fontSize: '12px', color: '#0984e3', textDecoration: 'none', display: 'inline-block', marginTop: '5px', fontWeight: '500' },
}

const Badge = ({ type, children }) => {
  const colors = {
    used: { bg: '#fff0f0', text: '#e05d5d' },
    empty: { bg: '#e3fafc', text: '#007b85' },
  }
  return <span style={{ background: colors[type].bg, color: colors[type].text, padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>{children}</span>
}

const Modal = ({ onClose, children }) => (
  <div className="modal-overlay no-print" onClick={onClose} style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:999}}>
    <div className="modal-content" onClick={e => e.stopPropagation()} style={{background:'white', padding:'30px', borderRadius:'24px', maxWidth:'500px', width:'90%', textAlign:'center', position:'relative', boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}}>
      <button onClick={onClose} style={{position:'absolute', top:'15px', right:'15px', background:'#f0f0f0', width:'30px', height:'30px', borderRadius:'50%', border:'none', fontSize:'14px', cursor:'pointer', color: '#333'}}>✕</button>
      {children}
    </div>
  </div>
)