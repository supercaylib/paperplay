import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { supabase } from './supabaseClient'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [activeTab, setActiveTab] = useState('factory') 

  // --- STATES ---
  const [baseUrl, setBaseUrl] = useState('https://paperplay-nu.vercel.app') 
  const [count, setCount] = useState(5)
  const [generatedCodes, setGeneratedCodes] = useState([]) 
  const [dbCodes, setDbCodes] = useState([]) 
  const [requests, setRequests] = useState([])
  const [digitalLetters, setDigitalLetters] = useState([])
  
  // MODALS & MENUS
  const [previewVideo, setPreviewVideo] = useState(null)
  const [viewQr, setViewQr] = useState(null)
  const [viewLetter, setViewLetter] = useState(null)
  const [showCleanupMenu, setShowCleanupMenu] = useState(false)

  useEffect(() => {
    const session = sessionStorage.getItem('paperplay_admin_session')
    if (session === 'true') {
      setIsAuthenticated(true)
      fetchAllData()
    }
  }, [])

  // --- AUTH & DATA ---
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

  function fetchAllData() {
    fetchCodes()
    fetchRequests()
    fetchDigitalLetters()
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

  // --- ACTIONS ---
  async function generateAndSave() {
    if (!baseUrl) return alert('URL required')
    const batchId = Date.now().toString().slice(-6)
    const newItems = [], dbRows = []
    for (let i = 0; i < count; i++) {
      const id = `tag-${batchId}-${i + 1}`
      const link = `${baseUrl}/${id}`
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

  // CLEANUP
  async function deleteUsed() { if(confirm('Delete all USED?')) { await supabase.from('qr_codes').delete().not('video_url', 'is', null); fetchCodes(); setShowCleanupMenu(false) } }
  async function deleteUnused() { if(confirm('Delete all UNUSED?')) { await supabase.from('qr_codes').delete().is('video_url', null); fetchCodes(); setShowCleanupMenu(false) } }
  async function deleteAllStickers() { if(confirm('Delete EVERYTHING?')) { await supabase.from('qr_codes').delete().neq('id', '0'); fetchCodes(); setShowCleanupMenu(false) } }

  // INBOX ACTIONS
  async function markRequestDone(id) { await supabase.from('letter_requests').update({ status: 'Done' }).eq('id', id); fetchRequests(); }
  async function deleteRequest(id) { if(confirm('Delete order?')) { await supabase.from('letter_requests').delete().eq('id', id); fetchRequests(); } }
  async function deleteAllRequests() { if(confirm('Clear Inbox?')) { await supabase.from('letter_requests').delete().neq('id', 0); fetchRequests(); } }

  // DIGITAL LETTER ACTIONS
  async function deleteDigitalLetter(id) { if(confirm('Delete letter?')) { await supabase.from('digital_letters').delete().eq('id', id); fetchDigitalLetters(); } }
  async function deleteAllDigitalLetters() { if(confirm('Clear All Letters?')) { await supabase.from('digital_letters').delete().neq('id', 0); fetchDigitalLetters(); } }

  function copyToClipboard(link) { navigator.clipboard.writeText(link); alert('Copied'); }

  // --- LOGIN VIEW ---
  if (!isAuthenticated) return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <div style={styles.logoCircle}>🔒</div>
        <h2 style={styles.loginTitle}>Admin Portal</h2>
        <form onSubmit={handleLogin}>
          <input type="password" placeholder="Passcode" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} style={styles.input} />
          <button type="submit" style={styles.primaryBtn}>Enter</button>
        </form>
      </div>
    </div>
  )

  // --- DASHBOARD VIEW ---
  return (
    <div style={styles.dashboard} onClick={() => setShowCleanupMenu(false)}>
      
      {/* HEADER */}
      <div className="no-print" style={styles.header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={styles.brandIcon}>P</div>
          <h2 style={styles.brandText}>PaperPlay Admin</h2>
        </div>
        
        {/* TAB SWITCHER */}
        <div style={styles.tabs}>
          <button onClick={() => setActiveTab('factory')} style={activeTab === 'factory' ? styles.tabActive : styles.tab}>Factory</button>
          <button onClick={() => setActiveTab('inbox')} style={activeTab === 'inbox' ? styles.tabActive : styles.tab}>Inbox <span style={styles.badge}>{requests.filter(r => r.status === 'Pending').length}</span></button>
          <button onClick={() => setActiveTab('digital')} style={activeTab === 'digital' ? styles.tabActive : styles.tab}>Letters</button>
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* === TAB 1: FACTORY === */}
      {activeTab === 'factory' && (
        <div style={styles.content}>
          
          {/* TOP ROW */}
          <div style={styles.grid2}>
            {/* GENERATOR */}
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

            {/* PREVIEW */}
            <div className={viewQr ? "no-print" : "printable-area"} style={styles.card}>
              <h3 className="no-print" style={styles.cardTitle}>Print Preview</h3>
              <div style={styles.previewGrid}>
                {generatedCodes.map(item => (
                  <div key={item.id} style={styles.qrItem}>
                    <QRCode value={item.link} size={50} style={{ width: '100%', height: 'auto' }} />
                    <p style={styles.qrText}>{item.id}</p>
                  </div>
                ))}
                {generatedCodes.length === 0 && <p style={styles.emptyText}>No stickers generated yet.</p>}
              </div>
            </div>
          </div>

          {/* DATABASE TABLE */}
          <div className="no-print" style={styles.card}>
            <div style={styles.tableHeader}>
              <h3 style={styles.cardTitle}>Database ({dbCodes.length})</h3>
              <div style={{position:'relative'}}>
                <button onClick={(e) => { e.stopPropagation(); setShowCleanupMenu(!showCleanupMenu); }} style={styles.cleanupBtn}>Cleanup ▼</button>
                {showCleanupMenu && (
                  <div style={styles.popover}>
                    <button onClick={deleteUsed} style={styles.popoverItem}>Clear Used</button>
                    <button onClick={deleteUnused} style={styles.popoverItem}>Clear Unused</button>
                    <button onClick={deleteAllStickers} style={{...styles.popoverItem, color:'#e05d5d'}}>Delete ALL</button>
                  </div>
                )}
              </div>
            </div>
            
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Content</th>
                    <th style={styles.thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dbCodes.map(row => (
                    <tr key={row.id}>
                      <td style={styles.td}><b>{row.id}</b></td>
                      <td style={styles.td}>{row.video_url ? <Badge type="used">Used</Badge> : <Badge type="empty">Empty</Badge>}</td>
                      <td style={styles.td}>{row.video_url ? <button onClick={() => setPreviewVideo(row.video_url)} style={styles.textBtn}>▶ Watch</button> : <span style={{color:'#ccc'}}>—</span>}</td>
                      <td style={styles.tdRight}>
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
      )}

      {/* === TAB 2: INBOX === */}
      {activeTab === 'inbox' && (
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={styles.tableHeader}>
              <h3 style={styles.cardTitle}>Order Inbox</h3>
              <div style={{display:'flex', gap:'10px'}}>
                <button onClick={fetchRequests} style={styles.secondaryBtn}>Refresh</button>
                <button onClick={deleteAllRequests} style={styles.cleanupBtn}>Delete All</button>
              </div>
            </div>
            <div style={{display:'grid', gap:'15px'}}>
              {requests.map(req => (
                <div key={req.id} style={styles.requestRow}>
                  <div>
                    <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px'}}>
                      <span style={{fontWeight:'700', fontSize:'16px', color:'#1a1a1a'}}>{req.letter_type}</span>
                      <span style={styles.tag}>{req.category}</span>
                      <span style={styles.ticketTag}>{req.ticket_code}</span>
                    </div>
                    <p style={{margin:0, fontSize:'13px', color:'#666'}}>
                      <span style={{fontWeight:'600'}}>{req.customer_name}</span> • {req.customer_age} y/o
                    </p>
                    <a href={req.contact_link.includes('http') ? req.contact_link : `https://${req.contact_link}`} target="_blank" style={styles.link}>
                      🔗 Open Contact Link
                    </a>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{marginBottom:'10px'}}>{req.status === 'Pending' ? <Badge type="pending">Pending</Badge> : <Badge type="done">Done</Badge>}</div>
                    {req.status === 'Pending' && <button onClick={() => markRequestDone(req.id)} style={{...styles.successBtn, marginRight:'8px'}}>✔ Done</button>}
                    <button onClick={() => deleteRequest(req.id)} style={styles.iconBtnDanger}>🗑️</button>
                  </div>
                </div>
              ))}
              {requests.length === 0 && <p style={styles.emptyText}>Inbox is empty.</p>}
            </div>
          </div>
        </div>
      )}

      {/* === TAB 3: DIGITAL LETTERS === */}
      {activeTab === 'digital' && (
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={styles.tableHeader}>
              <h3 style={styles.cardTitle}>Digital Letters</h3>
              <div style={{display:'flex', gap:'10px'}}>
                <button onClick={fetchDigitalLetters} style={styles.secondaryBtn}>Refresh</button>
                <button onClick={deleteAllDigitalLetters} style={styles.cleanupBtn}>Delete All</button>
              </div>
            </div>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Sender</th>
                    <th style={styles.th}>Theme</th>
                    <th style={styles.th}>Ticket</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {digitalLetters.map(l => (
                    <tr key={l.id}>
                      <td style={styles.td}><b>{l.sender_name}</b></td>
                      <td style={styles.td}><span style={styles.tag}>{l.theme}</span></td>
                      <td style={styles.td}><span style={{fontFamily:'monospace', color:'#d63031'}}>{l.ticket_code}</span></td>
                      <td style={styles.td}>{new Date(l.created_at).toLocaleDateString()}</td>
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
      {viewQr && <Modal onClose={() => setViewQr(null)}><QRCode value={viewQr.link} size={150} /><p style={{marginTop:'10px', color: '#333'}}>{viewQr.id}</p></Modal>}
      {viewLetter && <Modal onClose={() => setViewLetter(null)}>
        <h3 style={{marginTop:0, color: '#333'}}>Letter</h3>
        <div style={{background: '#f9f9f9', padding:'20px', borderRadius:'10px', textAlign:'left', whiteSpace:'pre-wrap', maxHeight:'300px', overflowY:'auto', border:'1px solid #eee', color: '#333', fontSize:'14px'}}>
          {viewLetter.message_body}
        </div>
      </Modal>}

      <style>{`@media print { .no-print { display: none !important; } .printable-area { display: block !important; } }`}</style>
    </div>
  )
}

// --- PROFESSIONAL STYLES (Clean, Black/White/Gray) ---
const styles = {
  // LAYOUT
  dashboard: { minHeight: '100vh', background: '#f5f5f7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1a1a1a' },
  content: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  grid2: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', marginBottom: '20px' },
  
  // LOGIN
  loginPage: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f7' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center', width: '320px' },
  logoCircle: { width: '50px', height: '50px', background: '#1a1a1a', borderRadius: '50%', color: 'white', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' },
  loginTitle: { margin: '0 0 20px 0', fontSize: '20px', fontWeight: '700', color: '#1a1a1a' },

  // HEADER
  header: { background: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 10 },
  brandIcon: { width: '30px', height: '30px', background: '#1a1a1a', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  brandText: { margin: '0', fontSize: '18px', fontWeight: '700', color: '#1a1a1a' },
  
  // TABS (Segmented Control)
  tabs: { background: '#f0f0f0', padding: '4px', borderRadius: '10px', display: 'flex', gap: '4px' },
  tab: { background: 'transparent', border: 'none', padding: '6px 16px', borderRadius: '7px', fontSize: '13px', fontWeight: '600', color: '#666', cursor: 'pointer' },
  tabActive: { background: 'white', border: 'none', padding: '6px 16px', borderRadius: '7px', fontSize: '13px', fontWeight: '600', color: '#1a1a1a', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'default' },
  badge: { background: '#1a1a1a', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', marginLeft: '5px' },

  // CARDS
  card: { background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.02)' },
  cardTitle: { margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#1a1a1a' },
  
  // INPUTS & BUTTONS
  inputGroup: { marginBottom: '15px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '5px' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e0e0e0', background: '#fcfcfc', fontSize: '14px', outline: 'none', color: '#333' },
  primaryBtn: { width: '100%', background: '#1a1a1a', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  secondaryBtn: { background: '#f0f0f0', color: '#333', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' },
  logoutBtn: { background: 'transparent', color: '#e05d5d', border: '1px solid #ffe5e5', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  cleanupBtn: { background: '#fff0f0', color: '#e05d5d', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  successBtn: { background: '#e3fafc', color: '#007b85', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  textBtn: { background: 'transparent', color: '#0984e3', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: '5px' },
  iconBtn: { background: '#f5f5f7', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '5px' },
  iconBtnDanger: { background: '#fff0f0', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },

  // TABLES & LISTS
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '1px solid #eee', color: '#888', fontWeight: '600' },
  thRight: { textAlign: 'right', padding: '12px', borderBottom: '1px solid #eee', color: '#888', fontWeight: '600' },
  td: { padding: '12px', borderBottom: '1px solid #f9f9f9', color: '#333' },
  tdRight: { padding: '12px', borderBottom: '1px solid #f9f9f9', textAlign: 'right' },
  requestRow: { border: '1px solid #f0f0f0', borderRadius: '12px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  
  // MISC
  previewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' },
  qrItem: { border: '1px solid #eee', borderRadius: '10px', padding: '10px', textAlign: 'center' },
  qrText: { margin: '5px 0 0', fontSize: '10px', color: '#888' },
  emptyText: { color: '#ccc', fontSize: '13px', textAlign: 'center', padding: '20px' },
  tag: { background: '#f0f0f0', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', color: '#555', marginLeft: '8px' },
  ticketTag: { background: '#fff3cd', color: '#d35400', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', marginLeft: '8px' },
  link: { fontSize: '12px', color: '#0984e3', textDecoration: 'none', display: 'inline-block', marginTop: '5px' },
  
  // POPOVER
  popover: { position: 'absolute', top: '100%', right: 0, marginTop: '5px', background: 'white', border: '1px solid #eee', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', width: '140px', zIndex: 50, overflow: 'hidden' },
  popoverItem: { display: 'block', width: '100%', textAlign: 'left', padding: '10px 15px', background: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#555', borderBottom: '1px solid #f9f9f9' }
}

const Badge = ({ type, children }) => {
  const colors = {
    used: { bg: '#fff0f0', text: '#e05d5d' },
    empty: { bg: '#e3fafc', text: '#007b85' },
    pending: { bg: '#fff3cd', text: '#d35400' },
    done: { bg: '#e3fafc', text: '#007b85' }
  }
  return <span style={{ background: colors[type].bg, color: colors[type].text, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{children}</span>
}

const Modal = ({ onClose, children }) => (
  <div className="modal-overlay no-print" onClick={onClose} style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:999}}>
    <div className="modal-content" onClick={e => e.stopPropagation()} style={{background:'white', padding:'30px', borderRadius:'20px', maxWidth:'500px', width:'90%', textAlign:'center', position:'relative', boxShadow:'0 20px 60px rgba(0,0,0,0.1)'}}>
      <button onClick={onClose} style={{position:'absolute', top:'15px', right:'15px', background:'#f0f0f0', width:'30px', height:'30px', borderRadius:'50%', border:'none', fontSize:'14px', cursor:'pointer', color: '#333'}}>✕</button>
      {children}
    </div>
  </div>
)