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
  async function deleteAllStickers() { if(confirm('⚠️ DANGER: Are you sure you want to DELETE ALL QR CODES? This will break printed stickers.')) { await supabase.from('qr_codes').delete().neq('id', '0'); fetchCodes(); } }

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
    if(confirm('⚠️ DANGER: This will delete ALL ORDERS (History & Active). Continue?')) { await supabase.from('letter_requests').delete().neq('id', 0); fetchRequests(); } 
  }

  // --- DIGITAL LETTER ACTIONS ---
  async function deleteDigitalLetter(id) { if(confirm('Delete letter?')) { await supabase.from('digital_letters').delete().eq('id', id); fetchDigitalLetters(); } }
  async function deleteAllDigitalLetters() { if(confirm('⚠️ DANGER: Delete ALL digital letters?')) { await supabase.from('digital_letters').delete().neq('id', 0); fetchDigitalLetters(); } }

  // --- HELPER ---
  function copyContact(text) {
    navigator.clipboard.writeText(text)
    alert(`Copied "${text}" to clipboard. Paste it in search.`)
  }

  // --- LOGIN VIEW ---
  if (!isAuthenticated) return (
    <div style={styles.loginPage}>
      <div style={styles.loginContainer}>
        <div style={styles.loginHeader}>
          <div style={styles.logoSquare}>P</div>
          <h1 style={styles.loginTitle}>Admin Portal</h1>
        </div>
        <form onSubmit={handleLogin}>
          <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} style={styles.loginInput} autoFocus placeholder="Enter Security PIN" />
          <button type="submit" style={styles.loginBtn}>Unlock System</button>
        </form>
      </div>
    </div>
  )

  // FILTER REQUESTS FOR SPLIT VIEW
  const activeOrders = requests.filter(r => r.status !== 'Done')
  const historyOrders = requests.filter(r => r.status === 'Done')

  return (
    <div style={styles.layout}>
      
      {/* --- FIXED SIDEBAR --- */}
      <div className="no-print" style={styles.sidebar}>
        <div>
          <div style={styles.brandContainer}>
             <div style={styles.brandIcon}>P</div>
             <span style={styles.brandName}>PAPERPLAY</span>
          </div>

          <nav style={styles.navMenu}>
             <div style={styles.navLabel}>DASHBOARD</div>
             <button onClick={() => setActiveTab('inbox')} style={activeTab === 'inbox' ? styles.navItemActive : styles.navItem}>
               📦 Orders
               {activeOrders.length > 0 && <span style={styles.navBadge}>{activeOrders.length}</span>}
             </button>
             <button onClick={() => setActiveTab('digital')} style={activeTab === 'digital' ? styles.navItemActive : styles.navItem}>
               💌 Archive
             </button>

             <div style={styles.navLabel}>PRODUCTION</div>
             <button onClick={() => setActiveTab('factory')} style={activeTab === 'factory' ? styles.navItemActive : styles.navItem}>
               🏭 Factory
             </button>
          </nav>
        </div>

        <button onClick={handleLogout} style={styles.logoutItem}>Logout</button>
      </div>

      {/* --- SCROLLABLE CONTENT --- */}
      <div style={styles.mainContent}>
        
        {/* --- TAB 1: INBOX (ORDERS) --- */}
        {activeTab === 'inbox' && (
          <div className="fade-in">
            <div style={styles.pageHeader}>
              <h2 style={styles.pageTitle}>Order Management</h2>
              <button onClick={deleteAllRequests} style={styles.dangerHeaderBtn}>🗑️ Delete All Data</button>
            </div>

            {/* ACTIVE ORDERS TABLE */}
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}>🔥 Active Queue ({activeOrders.length})</h3>
                <button onClick={fetchRequests} style={styles.outlineBtn}>Refresh</button>
              </div>
              <OrderTable 
                data={activeOrders} 
                updateStatus={updateStatus} 
                deleteRequest={deleteRequest} 
                copyContact={copyContact} 
                emptyMsg="No active orders. Good job!"
              />
            </div>

            {/* COMPLETED HISTORY TABLE */}
            <div style={{...styles.panel, marginTop: '40px', opacity: 0.9}}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}>✅ Order History ({historyOrders.length})</h3>
              </div>
              <OrderTable 
                data={historyOrders} 
                updateStatus={updateStatus} 
                deleteRequest={deleteRequest} 
                copyContact={copyContact}
                emptyMsg="No completed orders yet."
              />
            </div>
          </div>
        )}

        {/* --- TAB 2: FACTORY --- */}
        {activeTab === 'factory' && (
          <div className="fade-in">
             <div style={styles.pageHeader}>
                <h2 style={styles.pageTitle}>QR Production</h2>
             </div>

             <div style={styles.splitLayout}>
               
               {/* GENERATOR */}
               <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                 <div style={styles.panel}>
                    <div style={styles.panelHeader}>
                      <h3 style={styles.panelTitle}>Generate QR Batch</h3>
                    </div>
                    <div style={styles.panelBody}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Base Application URL</label>
                        <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} style={styles.input} />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Quantity</label>
                        <input type="number" value={count} onChange={e => setCount(Number(e.target.value))} style={styles.input} />
                      </div>
                      <button onClick={generateAndSave} style={styles.primaryBtn}>Generate Batch</button>
                    </div>
                 </div>

                 {/* MAINTENANCE BOX */}
                 <div style={styles.maintenanceBox}>
                    <h4 style={{fontSize:'12px', fontWeight:'800', color:'#b91c1c', marginBottom:'15px', letterSpacing:'1px'}}>DATABASE MAINTENANCE</h4>
                    <div style={{display:'grid', gap:'10px'}}>
                       <button onClick={deleteUsed} style={styles.maintenanceBtn}>🧹 Cleanup Used QRs</button>
                       <button onClick={deleteUnused} style={styles.maintenanceBtn}>🧹 Cleanup Unused QRs</button>
                       <button onClick={deleteAllStickers} style={styles.maintenanceBtnDanger}>⚠️ DELETE ALL QRs</button>
                    </div>
                 </div>
               </div>

               {/* DATABASE LIST */}
               <div style={styles.panel}>
                  <div style={styles.panelHeader}>
                    <h3 style={styles.panelTitle}>Sticker Database ({dbCodes.length})</h3>
                    <button onClick={fetchCodes} style={styles.outlineBtn}>Refresh</button>
                  </div>
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead style={styles.thead}>
                        <tr>
                          <th style={styles.th}>ID</th>
                          <th style={styles.th}>STATUS</th>
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
             
             {/* PRINT AREA */}
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
            <div style={styles.pageHeader}>
              <h2 style={styles.pageTitle}>Digital Archive</h2>
              <button onClick={deleteAllDigitalLetters} style={styles.dangerHeaderBtn}>🗑️ Delete All Data</button>
            </div>

            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}>Letters Database</h3>
                <button onClick={fetchDigitalLetters} style={styles.outlineBtn}>Refresh</button>
              </div>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead style={styles.thead}>
                    <tr>
                       <th style={styles.th}>TICKET</th>
                       <th style={styles.th}>SENDER</th>
                       <th style={styles.th}>THEME</th>
                       <th style={styles.th}>UNLOCK</th>
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
      {previewVideo && (
        <Modal onClose={() => setPreviewVideo(null)} wide={true}>
          <div style={{width:'100%', background:'black', borderRadius:'8px', overflow:'hidden', display:'flex', justifyContent:'center'}}>
            <video 
              src={previewVideo} 
              controls 
              autoPlay 
              style={{ width: '100%', maxHeight: '80vh', aspectRatio: 'auto', objectFit: 'contain' }} 
            />
          </div>
        </Modal>
      )}

      {viewQr && <Modal onClose={() => setViewQr(null)}><QRCode value={viewQr.link} size={150} /><p style={{marginTop:'15px', fontWeight:'bold', fontFamily:'monospace'}}>{viewQr.id}</p></Modal>}
      
      {viewLetter && <Modal onClose={() => setViewLetter(null)}>
        <h3 style={{marginTop:0}}>Letter Content</h3>
        <div style={{background: '#f8fafc', padding:'20px', borderRadius:'8px', textAlign:'left', whiteSpace:'pre-wrap', maxHeight:'400px', overflowY:'auto', border:'1px solid #e2e8f0', fontFamily:'serif'}}>
          {viewLetter.message_body}
        </div>
      </Modal>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { margin: 0; padding: 0; background: #f1f5f9; }
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

// --- SUB COMPONENTS ---

const OrderTable = ({ data, updateStatus, deleteRequest, copyContact, emptyMsg }) => (
  <div style={styles.tableContainer}>
    <table style={styles.table}>
      <thead style={styles.thead}>
        <tr>
          <th style={styles.th}>TICKET ID</th>
          <th style={styles.th}>DETAILS</th>
          <th style={styles.th}>CONTACT</th>
          <th style={styles.th}>STATUS</th>
          <th style={styles.th}>ACTION</th>
        </tr>
      </thead>
      <tbody>
        {data.map(req => (
          <tr key={req.id} style={styles.tr}>
            <td style={styles.td}><span style={styles.monoBadge}>{req.ticket_code}</span></td>
            <td style={styles.td}>
               <div style={{fontWeight:'700', color:'#1e293b'}}>{req.letter_type}</div>
               <div style={{fontSize:'12px', color:'#64748b'}}>{req.customer_name} • {req.category}</div>
            </td>
            <td style={styles.td}>
               <button onClick={() => copyContact(req.contact_link)} style={styles.copyBtn}>
                 📋 Copy Username
               </button>
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
        {data.length === 0 && <tr><td colSpan="5" style={styles.emptyState}>{emptyMsg}</td></tr>}
      </tbody>
    </table>
  </div>
)

const Badge = ({ type, children }) => {
  const c = type === 'used' ? {bg:'#dcfce7', t:'#15803d'} : {bg:'#f1f5f9', t:'#64748b'}
  return <span style={{background:c.bg, color:c.t, padding:'2px 8px', borderRadius:'12px', fontSize:'11px', fontWeight:'700'}}>{children}</span>
}

const Modal = ({ onClose, children, wide }) => (
  <div className="no-print" onClick={onClose} style={styles.modalOverlay}>
    <div onClick={e => e.stopPropagation()} style={{...styles.modalContent, maxWidth: wide ? '900px' : '500px'}}>
      {children}
    </div>
  </div>
)

// --- PROFESSIONAL ENTERPRISE STYLES ---
const styles = {
  // LAYOUT
  layout: { display: 'flex', minHeight: '100vh', fontFamily: '"Inter", sans-serif', background: '#f1f5f9' },
  
  // FIXED SIDEBAR (Does not move)
  sidebar: { width: '280px', minWidth: '280px', height: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px', position: 'fixed', left: 0, top: 0, zIndex: 50 },
  
  // MAIN CONTENT (Scrolls independently)
  mainContent: { marginLeft: '280px', flex: 1, padding: '40px', overflowY: 'auto' },

  // BRANDING
  brandContainer: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingLeft: '8px' },
  brandIcon: { width: '36px', height: '36px', background: 'white', color: 'black', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '20px' },
  brandName: { fontWeight: '800', fontSize: '16px', letterSpacing: '1px', color: '#f8fafc' },
  
  navMenu: { display: 'flex', flexDirection: 'column', gap: '8px' },
  navLabel: { fontSize: '11px', fontWeight: '700', color: '#64748b', marginTop: '24px', marginBottom: '8px', paddingLeft: '12px', letterSpacing: '0.5px' },
  navItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', background: 'transparent', color: '#cbd5e1', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '500', transition: '0.2s' },
  navItemActive: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', background: '#1e293b', color: 'white', border: '1px solid #334155', cursor: 'default', textAlign: 'left', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  navBadge: { background: '#ef4444', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' },
  logoutItem: { background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '12px', borderRadius: '8px', cursor: 'pointer', width: '100%', textAlign: 'center', fontSize: '13px', fontWeight: '600', transition: '0.2s' },

  // HEADER & PAGE
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  pageTitle: { margin: 0, fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' },
  dangerHeaderBtn: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' },

  // PANELS
  panel: { background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', border: '1px solid #e2e8f0', overflow: 'hidden' },
  panelHeader: { padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' },
  panelBody: { padding: '32px' },
  panelTitle: { margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' },

  // TABLES
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' },
  thead: { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '16px 32px', fontWeight: '600', fontSize: '11px', letterSpacing: '0.5px', color: '#64748b', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' },
  td: { padding: '16px 32px', color: '#334155', verticalAlign: 'middle' },
  emptyState: { padding: '60px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' },

  // ELEMENTS
  copyBtn: { background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#475569', transition: '0.2s' },
  outlineBtn: { background: 'white', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  primaryBtn: { background: '#0f172a', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', width: '100%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  
  maintenanceBox: { marginTop: '20px', padding: '24px', background: '#fff1f2', borderRadius: '12px', border: '1px dashed #fda4af' },
  maintenanceBtn: { width: '100%', padding: '10px', background: 'white', border: '1px solid #fecdd3', borderRadius: '6px', color: '#be123c', fontWeight: '600', fontSize: '12px', cursor: 'pointer' },
  maintenanceBtnDanger: { width: '100%', padding: '10px', background: '#be123c', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },

  // BADGES & STATUS
  monoBadge: { fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#334155', fontWeight: '600', border: '1px solid #e2e8f0' },
  categoryBadge: { background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' },
  
  statusSelect: { padding: '6px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid transparent', cursor: 'pointer', outline: 'none' },
  statusPending: { background: '#fef9c3', color: '#b45309' },
  statusProcessing: { background: '#e0f2fe', color: '#0369a1' },
  statusDone: { background: '#dcfce7', color: '#15803d' },

  iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '8px', borderRadius: '4px', transition: '0.2s' },
  iconBtnDanger: { background: '#fee2e2', border: 'none', cursor: 'pointer', fontSize: '14px', width:'32px', height:'32px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color: '#b91c1c' },

  // FORM
  splitLayout: { display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', transition: 'border 0.2s', fontSize: '14px' },

  // LOGIN SCREEN
  loginPage: { height: '100vh', width: '100vw', background: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  loginContainer: { width: '400px', background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', padding: '48px', borderRadius: '24px', textAlign: 'center' },
  loginHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' },
  logoSquare: { width: '64px', height: '64px', background: 'white', color: 'black', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '800', marginBottom: '24px', boxShadow: '0 0 40px rgba(255,255,255,0.1)' },
  loginTitle: { color: 'white', fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-1px' },
  loginInput: { width: '100%', padding: '16px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '12px', outline: 'none', fontSize: '18px', textAlign: 'center', letterSpacing: '4px', marginBottom: '20px' },
  loginBtn: { width: '100%', padding: '16px', background: 'white', color: 'black', fontWeight: '800', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '16px' },

  // PRINT / PREVIEW
  previewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '20px', padding: '20px' },
  qrItem: { border: '1px solid #eee', padding: '15px', borderRadius: '8px', textAlign: 'center' },
  qrText: { fontSize: '10px', marginTop: '10px', fontFamily: 'monospace' },
  
  // MODAL
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '40px', borderRadius: '24px', maxWidth: '500px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }
}