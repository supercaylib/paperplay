import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { supabase } from './supabaseClient'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [activeTab, setActiveTab] = useState('inbox') 

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
      alert('Unauthorized Access.')
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

  // --- INBOX ACTIONS ---
  async function updateStatus(id, newStatus) {
    const { error } = await supabase.from('letter_requests').update({ status: newStatus }).eq('id', id)
    if (error) alert('Error: ' + error.message)
    else setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r))
  }

  async function deleteRequest(id) { 
    if(confirm('Delete order?')) { await supabase.from('letter_requests').delete().eq('id', id); fetchRequests(); } 
  }
  
  async function deleteAllRequests() { 
    if(confirm('Clear Inbox?')) { await supabase.from('letter_requests').delete().neq('id', 0); fetchRequests(); } 
  }

  // --- DIGITAL LETTER ACTIONS ---
  async function deleteDigitalLetter(id) { if(confirm('Delete letter?')) { await supabase.from('digital_letters').delete().eq('id', id); fetchDigitalLetters(); } }
  async function deleteAllDigitalLetters() { if(confirm('Clear All Letters?')) { await supabase.from('digital_letters').delete().neq('id', 0); fetchDigitalLetters(); } }

  // --- LOGIN VIEW (Professional Dark Mode) ---
  if (!isAuthenticated) return (
    <div style={styles.loginPage}>
      <div style={styles.loginContainer}>
        <div style={styles.loginHeader}>
          <div style={styles.logoSquare}>P</div>
          <h1 style={styles.loginTitle}>Admin Portal</h1>
        </div>
        <p style={{color:'#6b7280', fontSize:'14px', marginBottom:'30px'}}>Please authenticate to access the system.</p>
        
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:'20px'}}>
             <label style={styles.loginLabel}>SECURITY PIN</label>
             <input 
              type="password" 
              value={passwordInput} 
              onChange={e => setPasswordInput(e.target.value)} 
              style={styles.loginInput} 
              autoFocus
              placeholder="••••"
            />
          </div>
          <button type="submit" style={styles.loginBtn}>Access Dashboard →</button>
        </form>
        <div style={{marginTop:'30px', fontSize:'12px', color:'#9ca3af'}}>
          PaperPlay Systems v2.0
        </div>
      </div>
    </div>
  )

  // --- DASHBOARD VIEW (Sidebar Layout) ---
  return (
    <div style={styles.dashboard}>
      
      {/* SIDEBAR NAVIGATION */}
      <div className="no-print" style={styles.sidebar}>
        <div>
          <div style={styles.brandContainer}>
             <div style={styles.brandIcon}>P</div>
             <span style={styles.brandName}>PAPERPLAY</span>
          </div>

          <nav style={styles.navMenu}>
             <div style={styles.navLabel}>MAIN</div>
             <button onClick={() => setActiveTab('inbox')} style={activeTab === 'inbox' ? styles.navItemActive : styles.navItem}>
               📦 Orders
               {requests.filter(r => r.status === 'Pending').length > 0 && <span style={styles.navBadge}>{requests.filter(r => r.status === 'Pending').length}</span>}
             </button>
             <button onClick={() => setActiveTab('digital')} style={activeTab === 'digital' ? styles.navItemActive : styles.navItem}>
               💌 Archive
             </button>

             <div style={styles.navLabel}>TOOLS</div>
             <button onClick={() => setActiveTab('factory')} style={activeTab === 'factory' ? styles.navItemActive : styles.navItem}>
               🏭 Factory
             </button>
          </nav>
        </div>

        <button onClick={handleLogout} style={styles.logoutItem}>
          Logout
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={styles.mainContent}>
        
        {/* TOP BAR */}
        <div className="no-print" style={styles.topBar}>
          <h2 style={styles.pageTitle}>
            {activeTab === 'inbox' && 'Order Management'}
            {activeTab === 'factory' && 'QR Production Factory'}
            {activeTab === 'digital' && 'Digital Letter Archive'}
          </h2>
          <div style={styles.userProfile}>
             <div style={styles.statusDot}></div>
             <span>Admin Online</span>
          </div>
        </div>

        {/* --- TAB 1: INBOX (ORDERS) --- */}
        {activeTab === 'inbox' && (
          <div className="fade-in">
            {/* STATS CARDS */}
            <div style={styles.statsGrid}>
              <StatCard title="Total Orders" value={requests.length} icon="📦" />
              <StatCard title="Pending" value={requests.filter(r => r.status === 'Pending').length} icon="⏳" color="#f59e0b" />
              <StatCard title="Completed" value={requests.filter(r => r.status === 'Done').length} icon="✅" color="#10b981" />
            </div>

            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <h3>Recent Orders</h3>
                <div style={{display:'flex', gap:'10px'}}>
                   <button onClick={fetchRequests} style={styles.outlineBtn}>Refresh Data</button>
                </div>
              </div>
              
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead style={styles.thead}>
                    <tr>
                      <th style={styles.th}>TICKET ID</th>
                      <th style={styles.th}>CUSTOMER</th>
                      <th style={styles.th}>TYPE</th>
                      <th style={styles.th}>STATUS</th>
                      <th style={styles.th}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req.id} style={styles.tr}>
                        <td style={styles.td}><span style={styles.monoBadge}>{req.ticket_code}</span></td>
                        <td style={styles.td}>
                          <div style={{fontWeight:'600'}}>{req.customer_name}</div>
                          <a href={req.contact_link.includes('http') ? req.contact_link : `https://${req.contact_link}`} target="_blank" style={styles.link}>
                            View Contact
                          </a>
                        </td>
                        <td style={styles.td}>
                           <span style={styles.categoryBadge}>{req.category}</span>
                           <div style={{fontSize:'12px', marginTop:'4px'}}>{req.letter_type}</div>
                        </td>
                        <td style={styles.td}>
                          <select 
                            value={req.status} 
                            onChange={(e) => updateStatus(req.id, e.target.value)}
                            style={{...styles.statusSelect, ...styles[`status${req.status}`]}}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Done">Completed</option>
                          </select>
                        </td>
                        <td style={styles.td}>
                          <button onClick={() => deleteRequest(req.id)} style={styles.iconBtnDanger}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {requests.length === 0 && <tr><td colSpan="5" style={styles.emptyState}>No orders found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: FACTORY --- */}
        {activeTab === 'factory' && (
          <div className="fade-in">
             <div style={styles.splitLayout}>
               
               {/* GENERATOR */}
               <div style={styles.panel}>
                  <h3 style={styles.panelTitle}>Generate QR Batch</h3>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Base Application URL</label>
                    <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} style={styles.input} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Quantity to Generate</label>
                    <input type="number" value={count} onChange={e => setCount(Number(e.target.value))} style={styles.input} />
                  </div>
                  <button onClick={generateAndSave} style={styles.primaryBtn}>Generate Batch</button>

                  <div style={styles.maintenanceBox}>
                     <h4 style={{fontSize:'12px', color:'#ef4444', marginBottom:'10px'}}>SYSTEM MAINTENANCE</h4>
                     <div style={{display:'grid', gap:'10px'}}>
                        <button onClick={deleteUsed} style={styles.dangerOutlineBtn}>Clean Used QRs</button>
                        <button onClick={deleteUnused} style={styles.dangerOutlineBtn}>Clean Unused QRs</button>
                     </div>
                  </div>
               </div>

               {/* DATABASE LIST */}
               <div style={styles.panel}>
                  <div style={styles.panelHeader}>
                    <h3>Database ({dbCodes.length})</h3>
                    <button onClick={fetchCodes} style={styles.outlineBtn}>Refresh</button>
                  </div>
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead style={styles.thead}>
                        <tr>
                          <th style={styles.th}>ID</th>
                          <th style={styles.th}>STATE</th>
                          <th style={styles.th}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbCodes.map(row => (
                           <tr key={row.id} style={styles.tr}>
                             <td style={styles.td}><span style={styles.monoBadge}>{row.id}</span></td>
                             <td style={styles.td}>{row.video_url ? <Badge type="used">Active</Badge> : <Badge type="empty">Empty</Badge>}</td>
                             <td style={styles.td}>
                                <div style={{display:'flex', gap:'5px'}}>
                                  {row.video_url && <button onClick={() => setPreviewVideo(row.video_url)} style={styles.iconBtn}>▶</button>}
                                  <button onClick={() => setViewQr({link: `${baseUrl}/${row.id}`, id: row.id})} style={styles.iconBtn}>👁️</button>
                                  <button onClick={() => deleteCode(row.id)} style={styles.iconBtnDanger}>🗑️</button>
                                </div>
                             </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
             </div>
             
             {/* PRINT AREA (Hidden) */}
             <div className="printable-area" style={{display:'none'}}>
               {generatedCodes.length > 0 && (
                 <div style={styles.printHeader}>
                   <button onClick={() => window.print()} style={styles.primaryBtn}>🖨️ Print Now</button>
                 </div>
               )}
                <div style={styles.previewGrid}>
                  {generatedCodes.map(item => (
                    <div key={item.id} style={styles.qrItem}>
                      <QRCode value={item.link} size={80} />
                      <p style={styles.qrText}>{item.id}</p>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* --- TAB 3: DIGITAL ARCHIVE --- */}
        {activeTab === 'digital' && (
          <div className="fade-in">
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <h3>Digital Letters</h3>
                <button onClick={fetchDigitalLetters} style={styles.outlineBtn}>Refresh</button>
              </div>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead style={styles.thead}>
                    <tr>
                       <th style={styles.th}>TICKET</th>
                       <th style={styles.th}>SENDER</th>
                       <th style={styles.th}>THEME</th>
                       <th style={styles.th}>UNLOCK DATE</th>
                       <th style={styles.th}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {digitalLetters.map(l => (
                      <tr key={l.id} style={styles.tr}>
                         <td style={styles.td}><span style={styles.monoBadge}>{l.ticket_code}</span></td>
                         <td style={styles.td}><b>{l.sender_name}</b></td>
                         <td style={styles.td}><span style={styles.categoryBadge}>{l.theme}</span></td>
                         <td style={styles.td}>{l.unlock_at ? new Date(l.unlock_at).toLocaleDateString() : 'Instant'}</td>
                         <td style={styles.td}>
                           <button onClick={() => setViewLetter(l)} style={styles.iconBtn}>👁️</button>
                           <button onClick={() => deleteDigitalLetter(l.id)} style={styles.iconBtnDanger}>🗑️</button>
                         </td>
                      </tr>
                    ))}
                    {digitalLetters.length === 0 && <tr><td colSpan="5" style={styles.emptyState}>Archive is empty.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODALS */}
      {previewVideo && <Modal onClose={() => setPreviewVideo(null)}><video src={previewVideo} controls autoPlay style={{ width: '100%', borderRadius: '10px' }} /></Modal>}
      {viewQr && <Modal onClose={() => setViewQr(null)}><QRCode value={viewQr.link} size={150} /><p style={{marginTop:'15px', fontWeight:'bold', fontFamily:'monospace'}}>{viewQr.id}</p></Modal>}
      {viewLetter && <Modal onClose={() => setViewLetter(null)}>
        <h3 style={{marginTop:0}}>Letter Preview</h3>
        <div style={{background: '#f8fafc', padding:'20px', borderRadius:'8px', textAlign:'left', whiteSpace:'pre-wrap', maxHeight:'400px', overflowY:'auto', border:'1px solid #e2e8f0', fontFamily:'serif'}}>
          {viewLetter.message_body}
        </div>
      </Modal>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body { margin: 0; padding: 0; }
        * { box-sizing: border-box; }
        
        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        @media print { 
          .no-print { display: none !important; } 
          .printable-area { display: block !important; position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}

// --- SUB-COMPONENTS ---
const StatCard = ({ title, value, icon, color = '#3b82f6' }) => (
  <div style={styles.statCard}>
    <div>
      <div style={styles.statTitle}>{title}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
    <div style={{...styles.statIcon, background: `${color}20`, color: color}}>{icon}</div>
  </div>
)

const Badge = ({ type, children }) => {
  const c = type === 'used' ? {bg:'#dcfce7', t:'#15803d'} : {bg:'#f3f4f6', t:'#6b7280'}
  return <span style={{background:c.bg, color:c.t, padding:'2px 8px', borderRadius:'12px', fontSize:'11px', fontWeight:'700'}}>{children}</span>
}

const Modal = ({ onClose, children }) => (
  <div className="no-print" onClick={onClose} style={styles.modalOverlay}>
    <div onClick={e => e.stopPropagation()} style={styles.modalContent}>
      {children}
    </div>
  </div>
)

// --- PROFESSIONAL CSS-IN-JS ---
const styles = {
  // LOGIN SCREEN
  loginPage: { height: '100vh', width: '100vw', background: '#111827', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: '"Inter", sans-serif' },
  loginContainer: { width: '400px', background: 'rgba(31, 41, 55, 0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', padding: '40px', borderRadius: '24px', textAlign: 'center' },
  loginHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' },
  logoSquare: { width: '50px', height: '50px', background: 'white', color: 'black', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' },
  loginTitle: { color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 },
  loginLabel: { display: 'block', textAlign: 'left', color: '#9ca3af', fontSize: '11px', fontWeight: '700', marginBottom: '8px', letterSpacing: '1px' },
  loginInput: { width: '100%', padding: '12px 16px', background: '#1f2937', border: '1px solid #374151', color: 'white', borderRadius: '8px', outline: 'none', fontSize: '16px', textAlign: 'center', letterSpacing: '5px' },
  loginBtn: { width: '100%', padding: '14px', background: 'white', color: 'black', fontWeight: '700', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' },

  // DASHBOARD LAYOUT
  dashboard: { display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh', fontFamily: '"Inter", sans-serif', background: '#f3f4f6' },
  
  // SIDEBAR
  sidebar: { background: '#111827', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', height: '100vh', position: 'sticky', top: 0 },
  brandContainer: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 10px 30px 10px', borderBottom: '1px solid #374151', marginBottom: '20px' },
  brandIcon: { width: '32px', height: '32px', background: 'white', color: 'black', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  brandName: { fontWeight: '700', fontSize: '14px', letterSpacing: '1px' },
  
  navMenu: { display: 'flex', flexDirection: 'column', gap: '5px' },
  navLabel: { fontSize: '11px', fontWeight: '700', color: '#6b7280', marginTop: '20px', marginBottom: '10px', paddingLeft: '10px' },
  navItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: 'transparent', color: '#d1d5db', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '500', transition: '0.2s' },
  navItemActive: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: '#374151', color: 'white', border: 'none', cursor: 'default', textAlign: 'left', fontSize: '14px', fontWeight: '600' },
  navBadge: { background: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px' },
  logoutItem: { background: 'transparent', border: '1px solid #374151', color: '#9ca3af', padding: '12px', borderRadius: '8px', cursor: 'pointer', width: '100%', textAlign: 'center', fontSize: '13px' },

  // MAIN CONTENT
  mainContent: { padding: '40px', overflowY: 'auto', height: '100vh' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  pageTitle: { margin: 0, fontSize: '24px', fontWeight: '800', color: '#111827' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#4b5563', background: 'white', padding: '8px 16px', borderRadius: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' },
  statusDot: { width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' },

  // STATS
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' },
  statCard: { background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statTitle: { fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '5px' },
  statValue: { fontSize: '28px', fontWeight: '800', color: '#111827' },
  statIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },

  // PANELS & TABLES
  panel: { background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden', marginBottom: '20px' },
  panelHeader: { padding: '20px 30px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { margin: 0, fontSize: '16px', fontWeight: '700' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' },
  thead: { background: '#f9fafb', color: '#6b7280' },
  th: { padding: '16px 30px', fontWeight: '600', fontSize: '11px', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' },
  td: { padding: '16px 30px', color: '#374151' },
  emptyState: { padding: '40px', textAlign: 'center', color: '#9ca3af' },

  // FORM ELEMENTS
  splitLayout: { display: 'grid', gridTemplateColumns: '350px 1fr', gap: '25px' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' },
  primaryBtn: { background: '#111827', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', width: '100%' },
  outlineBtn: { background: 'white', color: '#374151', border: '1px solid #d1d5db', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  dangerOutlineBtn: { background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', width: '100%' },
  
  // BADGES & BUTTONS
  monoBadge: { fontFamily: 'monospace', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#111827' },
  categoryBadge: { background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' },
  link: { fontSize: '12px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' },
  
  statusSelect: { padding: '6px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: '1px solid transparent', cursor: 'pointer' },
  statusPending: { background: '#fef3c7', color: '#d97706' },
  statusProcessing: { background: '#e0f2fe', color: '#0284c7' },
  statusDone: { background: '#dcfce7', color: '#16a34a' },

  iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '5px' },
  iconBtnDanger: { background: '#fee2e2', border: 'none', cursor: 'pointer', fontSize: '14px', width:'28px', height:'28px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center' },

  // PRINT & MAINTENANCE
  maintenanceBox: { marginTop: '30px', padding: '20px', background: '#fef2f2', borderRadius: '12px', border: '1px dashed #fca5a5' },
  previewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '20px', padding: '20px' },
  qrItem: { border: '1px solid #eee', padding: '15px', borderRadius: '8px', textAlign: 'center' },
  qrText: { fontSize: '10px', marginTop: '10px', fontFamily: 'monospace' },

  // MODAL
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '16px', maxWidth: '500px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }
}