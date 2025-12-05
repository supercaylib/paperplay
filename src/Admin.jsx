import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { supabase } from './supabaseClient'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [activeTab, setActiveTab] = useState('factory') 

  // --- STICKER FACTORY STATES ---
  const [baseUrl, setBaseUrl] = useState('https://paperplay-nu.vercel.app') 
  const [count, setCount] = useState(5)
  const [generatedCodes, setGeneratedCodes] = useState([]) 
  const [dbCodes, setDbCodes] = useState([]) 
  const [previewVideo, setPreviewVideo] = useState(null)
  const [viewQr, setViewQr] = useState(null)
  const [showCleanupMenu, setShowCleanupMenu] = useState(false)

  // --- ORDER INBOX & DIGITAL LETTER STATES ---
  const [requests, setRequests] = useState([])
  const [digitalLetters, setDigitalLetters] = useState([])
  const [viewLetter, setViewLetter] = useState(null)

  useEffect(() => {
    const session = sessionStorage.getItem('paperplay_admin_session')
    if (session === 'true') {
      setIsAuthenticated(true)
      fetchAllData()
    }
  }, [])

  function handleLogin(e) {
    e.preventDefault()
    const secret = import.meta.env.VITE_ADMIN_PASSWORD || '1234'
    if (passwordInput === secret) {
      setIsAuthenticated(true)
      sessionStorage.setItem('paperplay_admin_session', 'true')
      fetchAllData()
    } else {
      alert('Wrong Password 🔒')
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

  // --- FETCHING ---
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

  // --- ACTIONS: FACTORY ---
  async function generateAndSave() {
    if (!baseUrl) return alert('URL is required')
    const batchId = Date.now().toString().slice(-6)
    const newItems = []
    const dbRows = []
    for (let i = 0; i < count; i++) {
      const id = `tag-${batchId}-${i + 1}`
      const link = `${baseUrl}/${id}`
      newItems.push({ id, link })
      dbRows.push({ id: id, video_url: null, unlock_at: null })
    }
    const { error } = await supabase.from('qr_codes').insert(dbRows)
    if (error) alert('Error: ' + error.message)
    else {
      setGeneratedCodes(newItems)
      fetchCodes()
    }
  }

  async function deleteCode(id) {
    if (!confirm('Delete sticker?')) return
    const { error } = await supabase.from('qr_codes').delete().eq('id', id)
    if (error) alert(error.message)
    else fetchCodes()
  }

  // --- ACTIONS: CLEANUP FACTORY ---
  async function deleteUsed() {
    if (!confirm(`Delete used stickers?`)) return
    await supabase.from('qr_codes').delete().not('video_url', 'is', null)
    fetchCodes()
    setShowCleanupMenu(false)
  }
  async function deleteUnused() {
    if (!confirm(`Delete UNUSED stickers?`)) return
    await supabase.from('qr_codes').delete().is('video_url', null)
    fetchCodes()
    setShowCleanupMenu(false)
  }
  async function deleteAllStickers() {
    if (!confirm("WARNING: Delete ALL stickers?")) return
    await supabase.from('qr_codes').delete().neq('id', '0')
    fetchCodes()
    setShowCleanupMenu(false)
  }

  // --- ACTIONS: INBOX ---
  async function markRequestDone(id) {
    await supabase.from('letter_requests').update({ status: 'Done' }).eq('id', id)
    fetchRequests()
  }
  async function deleteRequest(id) {
    if (!confirm('Delete order?')) return
    const { error } = await supabase.from('letter_requests').delete().eq('id', id)
    if (error) alert(error.message)
    else fetchRequests()
  }
  async function deleteAllRequests() {
    if (!confirm("⚠️ Delete ALL Inbox messages?")) return
    await supabase.from('letter_requests').delete().neq('id', 0)
    fetchRequests()
  }

  // --- ACTIONS: DIGITAL LETTERS ---
  async function deleteDigitalLetter(id) {
    if (!confirm('Delete letter?')) return
    const { error } = await supabase.from('digital_letters').delete().eq('id', id)
    if (error) alert(error.message)
    else fetchDigitalLetters()
  }
  async function deleteAllDigitalLetters() {
    if (!confirm("⚠️ Delete ALL Digital Letters?")) return
    await supabase.from('digital_letters').delete().neq('id', 0)
    fetchDigitalLetters()
  }

  // --- RENDER ---
  if (!isAuthenticated) return <LoginScreen onSubmit={handleLogin} input={passwordInput} setInput={setPasswordInput} />

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '30px', fontFamily: 'sans-serif', color: '#333' }} onClick={() => setShowCleanupMenu(false)}>
      
      {/* HEADER */}
      <div className="no-print" style={{ maxWidth: '1100px', margin: '0 auto 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#2d3436' }}>🖨️ Admin</h2>
        <div style={{ background: '#e0e0e0', padding: '5px', borderRadius: '10px', display: 'flex', gap: '5px' }}>
          {['factory', 'inbox', 'digital'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ 
              background: activeTab === tab ? 'white' : 'transparent', 
              color: '#333',
              boxShadow: activeTab === tab ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
              padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', textTransform: 'capitalize' 
            }}>
              {tab === 'inbox' ? `Inbox (${requests.filter(r => r.status === 'Pending').length})` : tab === 'digital' ? `Letters (${digitalLetters.length})` : tab}
            </button>
          ))}
        </div>
        <button onClick={handleLogout} style={{ background: '#ff7675', color: 'white', padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* --- FACTORY TAB --- */}
      {activeTab === 'factory' && (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '25px', marginBottom: '30px' }}>
            <div className="no-print" style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', height: 'fit-content' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Generate</h4>
              <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '8px', color: '#333' }} />
              <input type="number" value={count} onChange={e => setCount(Number(e.target.value))} style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '8px', color: '#333' }} />
              <button onClick={generateAndSave} style={{ background: '#2d3436', width: '100%', padding: '10px', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Generate</button>
              {generatedCodes.length > 0 && <button onClick={() => window.print()} style={{ background: '#0984e3', width: '100%', marginTop: '10px', padding: '10px', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>🖨️ Print Batch</button>}
            </div>

            <div className={viewQr ? "no-print" : "printable-area"} style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h4 className="no-print" style={{ margin: '0 0 15px 0', color: '#333' }}>Preview</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
                {generatedCodes.map(item => (
                  <div key={item.id} style={{ border: '1px dashed #ddd', padding: '10px', textAlign: 'center', borderRadius: '8px' }}>
                    <QRCode value={item.link} size={60} style={{ width: '100%', height: 'auto' }} />
                    <p style={{ fontSize: '9px', margin: '5px 0', color: '#333' }}>{item.id}</p>
                  </div>
                ))}
                {generatedCodes.length === 0 && <p style={{ fontSize: '13px', color: '#999' }}>Ready to generate.</p>}
              </div>
            </div>
          </div>

          <div className="no-print" style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: '#333' }}>Sticker Database</h4>
              <div style={{ position: 'relative' }}>
                <button onClick={(e) => { e.stopPropagation(); setShowCleanupMenu(!showCleanupMenu); }} style={{ background: '#fff', border: '1px solid #ccc', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', color: '#333' }}>⚠️ Cleanup ▼</button>
                {showCleanupMenu && (
                  <div style={{ position: 'absolute', top: '40px', right: 0, background: 'white', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: '160px', zIndex: 100 }}>
                    <button onClick={deleteUsed} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: 'white', border: 'none', cursor: 'pointer', color: '#d35400' }}>Delete Used</button>
                    <button onClick={deleteUnused} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: 'white', border: 'none', cursor: 'pointer', color: '#555' }}>Delete Unused</button>
                    <button onClick={deleteAllStickers} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: '#fff0f0', border: 'none', cursor: 'pointer', color: '#c0392b', fontWeight: 'bold' }}>Delete ALL</button>
                  </div>
                )}
              </div>
            </div>
            <Table 
              headers={['ID', 'Status', 'Content', 'Actions']}
              rows={dbCodes.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                  <td style={{ padding: '10px', fontWeight: '600', color: '#333' }}>{row.id}</td>
                  <td style={{ padding: '10px' }}>{row.video_url ? <Badge color="#e17055" bg="#fff0f0">🔴 Used</Badge> : <Badge color="#00cec9" bg="#e3fafc">🟢 Empty</Badge>}</td>
                  <td style={{ padding: '10px' }}>{row.video_url ? <button onClick={() => setPreviewVideo(row.video_url)} style={btnStyle('#74b9ff')}>🎥 Watch</button> : <span style={{ color: '#eee' }}>—</span>}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <button onClick={() => setViewQr({link: `${baseUrl}/${row.id}`, id: row.id})} style={{...btnStyle('#a29bfe'), marginRight: '5px'}}>👁️</button>
                    <button onClick={() => deleteCode(row.id)} style={btnStyle('#ff7675')}>🗑️</button>
                  </td>
                </tr>
              ))}
            />
          </div>
        </div>
      )}

      {/* --- INBOX TAB --- */}
      {activeTab === 'inbox' && (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>📩 Inbox</h3>
              <div style={{display:'flex', gap:'10px'}}>
                <button onClick={fetchRequests} style={btnStyle('white', '#333', '1px solid #ccc')}>Refresh</button>
                <button onClick={deleteAllRequests} style={btnStyle('#ff7675')}>⚠️ Delete All</button>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '15px' }}>
              {requests.map(req => (
                <div key={req.id} style={{ border: '1px solid #eee', padding: '20px', borderRadius: '12px', background: req.status === 'Done' ? '#f9f9f9' : 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#333' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#2d3436' }}>{req.letter_type}</span>
                      <Badge bg="#dfe6e9" color="#2d3436">{req.category}</Badge>
                      <Badge bg="#ffeaa7" color="#d35400">Ticket: {req.ticket_code}</Badge>
                    </div>
                    <p style={{ margin: '0 0 5px 0', color: '#636e72', fontSize: '14px' }}>Customer: <strong>{req.customer_name}</strong> ({req.customer_age} y/o)</p>
                    <p style={{ margin: 0, color: '#0984e3', fontSize: '14px', cursor: 'pointer' }} onClick={() => window.open(req.contact_link.includes('http') ? req.contact_link : `https://${req.contact_link}`, '_blank')}>🔗 {req.contact_link}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '10px' }}>
                      {req.status === 'Pending' ? <Badge bg="#ffeaa7" color="#d35400">⏳ Pending</Badge> : <Badge bg="#55efc4" color="#006266">✅ Done</Badge>}
                    </div>
                    {req.status === 'Pending' && <button onClick={() => markRequestDone(req.id)} style={{...btnStyle('#00b894'), marginRight: '5px'}}>Mark Done</button>}
                    <button onClick={() => deleteRequest(req.id)} style={btnStyle('#ff7675')}>Delete</button>
                  </div>
                </div>
              ))}
              {requests.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No requests yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* --- DIGITAL LETTERS TAB --- */}
      {activeTab === 'digital' && (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>💌 Digital Letters</h3>
              <div style={{display:'flex', gap:'10px'}}>
                <button onClick={fetchDigitalLetters} style={btnStyle('white', '#333', '1px solid #ccc')}>Refresh</button>
                <button onClick={deleteAllDigitalLetters} style={btnStyle('#ff7675')}>⚠️ Delete All</button>
              </div>
            </div>
            <Table 
              headers={['Sender', 'Theme', 'Ticket', 'Date', 'Actions']}
              rows={digitalLetters.map(letter => (
                <tr key={letter.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#333' }}>{letter.sender_name}</td>
                  <td style={{ padding: '10px' }}><Badge bg="#eee" color="#555">{letter.theme}</Badge></td>
                  <td style={{ padding: '10px', fontFamily: 'monospace', color: '#d63031' }}>{letter.ticket_code}</td>
                  <td style={{ padding: '10px', color: '#888' }}>{new Date(letter.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <button onClick={() => setViewLetter(letter)} style={{...btnStyle('#74b9ff'), marginRight: '5px'}}>Read</button>
                    <button onClick={() => deleteDigitalLetter(letter.id)} style={btnStyle('#ff7675')}>🗑️</button>
                  </td>
                </tr>
              ))}
            />
            {digitalLetters.length === 0 && <p style={{textAlign:'center', padding:'20px', color:'#999'}}>No digital letters.</p>}
          </div>
        </div>
      )}

      {/* MODALS */}
      {previewVideo && <Modal onClose={() => setPreviewVideo(null)}><video src={previewVideo} controls autoPlay style={{ width: '100%', borderRadius: '10px' }} /></Modal>}
      {viewQr && <Modal onClose={() => setViewQr(null)}><QRCode value={viewQr.link} size={200} /><p style={{marginTop:'10px', color: '#333'}}>{viewQr.id}</p></Modal>}
      {viewLetter && <Modal onClose={() => setViewLetter(null)}>
        <h3 style={{marginTop:0, color: '#333'}}>Content</h3>
        <div style={{background: '#f9f9f9', padding:'15px', borderRadius:'8px', textAlign:'left', whiteSpace:'pre-wrap', maxHeight:'300px', overflowY:'auto', border:'1px solid #eee', color: '#333'}}>
          {viewLetter.message_body}
        </div>
      </Modal>}

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  )
}

// --- HELPER COMPONENTS FOR STYLING ---
const LoginScreen = ({ onSubmit, input, setInput }) => (
  <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
    <div style={{ background: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center', width: '300px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>Admin Login 🔒</h2>
      <form onSubmit={onSubmit}>
        <input type="password" placeholder="Password" value={input} onChange={e => setInput(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '8px', color: '#333' }} />
        <button type="submit" style={{ width: '100%', background: 'black', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Unlock</button>
      </form>
    </div>
  </div>
)

const Table = ({ headers, rows }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee', color: '#999' }}>
          {headers.map(h => <th key={h} style={{ padding: '10px' }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  </div>
)

const Badge = ({ bg, color, children }) => (
  <span style={{ background: bg, color: color, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>{children}</span>
)

const Modal = ({ onClose, children }) => (
  <div className="modal-overlay no-print" onClick={onClose} style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:999}}>
    <div className="modal-content" onClick={e => e.stopPropagation()} style={{background:'white', padding:'30px', borderRadius:'15px', maxWidth:'500px', width:'90%', textAlign:'center', position:'relative'}}>
      <button onClick={onClose} style={{position:'absolute', top:'10px', right:'10px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color: '#333'}}>✕</button>
      {children}
    </div>
  </div>
)

const btnStyle = (bg, color='white', border='none') => ({
  background: bg, color: color, border: border, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
})