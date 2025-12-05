import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { supabase } from './supabaseClient'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [activeTab, setActiveTab] = useState('factory') // 'factory' or 'inbox'

  // --- STICKER FACTORY STATES ---
  const [baseUrl, setBaseUrl] = useState('https://paperplay-nu.vercel.app') 
  const [count, setCount] = useState(5)
  const [generatedCodes, setGeneratedCodes] = useState([]) 
  const [dbCodes, setDbCodes] = useState([]) 
  const [previewVideo, setPreviewVideo] = useState(null)
  const [viewQr, setViewQr] = useState(null)
  const [showCleanupMenu, setShowCleanupMenu] = useState(false)

  // --- ORDER INBOX STATES ---
  const [requests, setRequests] = useState([])

  // 1. INITIAL LOAD
  useEffect(() => {
    const session = sessionStorage.getItem('paperplay_admin_session')
    if (session === 'true') {
      setIsAuthenticated(true)
      fetchCodes()
      fetchRequests()
    }
  }, [])

  // --- AUTH ---
  function handleLogin(e) {
    e.preventDefault()
    const secret = import.meta.env.VITE_ADMIN_PASSWORD || '1234'
    if (passwordInput === secret) {
      setIsAuthenticated(true)
      sessionStorage.setItem('paperplay_admin_session', 'true')
      fetchCodes()
      fetchRequests()
    } else {
      alert('Wrong Password 🔒')
    }
  }

  function handleLogout() {
    setIsAuthenticated(false)
    sessionStorage.removeItem('paperplay_admin_session')
  }

  // --- DATA FETCHING ---
  async function fetchCodes() {
    const { data } = await supabase.from('qr_codes').select('*').order('created_at', { ascending: false })
    if (data) setDbCodes(data)
  }

  async function fetchRequests() {
    const { data } = await supabase.from('letter_requests').select('*').order('created_at', { ascending: false })
    if (data) setRequests(data)
  }

  // --- STICKER LOGIC ---
  async function generateAndSave() {
    if (!baseUrl) return alert('URL is required')
    if (!confirm(`Generate ${count} new QR codes?`)) return

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
    if (!confirm('Delete this sticker?')) return
    const { error } = await supabase.from('qr_codes').delete().eq('id', id)
    if (!error) fetchCodes()
  }

  function copyToClipboard(link) {
    navigator.clipboard.writeText(link)
    alert('Copied!')
  }

  async function deleteUsed() {
    setShowCleanupMenu(false)
    if (!confirm(`Delete used stickers?`)) return
    const { error } = await supabase.from('qr_codes').delete().not('video_url', 'is', null)
    if (!error) fetchCodes()
  }

  async function deleteUnused() {
    setShowCleanupMenu(false)
    if (!confirm(`Delete UNUSED stickers?`)) return
    const { error } = await supabase.from('qr_codes').delete().is('video_url', null)
    if (!error) fetchCodes()
  }

  async function deleteAll() {
    setShowCleanupMenu(false)
    const input = prompt("Type 'DELETE' to wipe database.")
    if (input !== 'DELETE') return
    const { error } = await supabase.from('qr_codes').delete().neq('id', '0')
    if (!error) fetchCodes()
  }

  // --- ORDER LOGIC ---
  async function markRequestDone(id) {
    const { error } = await supabase.from('letter_requests').update({ status: 'Done' }).eq('id', id)
    if (!error) fetchRequests()
  }

  async function deleteRequest(id) {
    if (!confirm('Delete this order permanently?')) return
    const { error } = await supabase.from('letter_requests').delete().eq('id', id)
    if (!error) fetchRequests()
  }

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5', fontFamily: 'sans-serif' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center', maxWidth: '350px', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Admin Access 🔒</h2>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '8px' }} />
            <button type="submit" style={{ width: '100%', background: 'black', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Unlock</button>
          </form>
        </div>
      </div>
    )
  }

  // --- MAIN DASHBOARD ---
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '30px', fontFamily: 'sans-serif' }} onClick={() => setShowCleanupMenu(false)}>
      
      {/* HEADER & TABS */}
      <div className="no-print" style={{ maxWidth: '1100px', margin: '0 auto 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#333' }}>🖨️ Admin</h2>
        
        {/* TAB SWITCHER */}
        <div style={{ background: '#e0e0e0', padding: '5px', borderRadius: '10px', display: 'flex', gap: '5px' }}>
          <button 
            onClick={() => setActiveTab('factory')}
            style={{ 
              background: activeTab === 'factory' ? 'white' : 'transparent', 
              color: activeTab === 'factory' ? 'black' : '#666',
              boxShadow: activeTab === 'factory' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
              padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' 
            }}
          >
            Sticker Factory
          </button>
          <button 
            onClick={() => setActiveTab('inbox')}
            style={{ 
              background: activeTab === 'inbox' ? 'white' : 'transparent', 
              color: activeTab === 'inbox' ? 'black' : '#666',
              boxShadow: activeTab === 'inbox' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
              padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' 
            }}
          >
            Inbox ({requests.filter(r => r.status === 'Pending').length})
          </button>
        </div>

        <button onClick={handleLogout} style={{ background: '#ff7675', color: 'white', padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* =======================
          TAB 1: STICKER FACTORY 
         ======================= */}
      {activeTab === 'factory' && (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Controls & Preview Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '25px', marginBottom: '30px' }}>
            <div className="no-print" style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', height: 'fit-content' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#555' }}>Generate</h4>
              <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #eee', borderRadius: '8px' }} />
              <input type="number" value={count} onChange={e => setCount(Number(e.target.value))} style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #eee', borderRadius: '8px' }} />
              <button onClick={generateAndSave} style={{ background: '#2d3436', width: '100%', padding: '10px', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Generate</button>
              {generatedCodes.length > 0 && <button onClick={() => window.print()} style={{ background: '#0984e3', width: '100%', marginTop: '10px', padding: '10px', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>🖨️ Print Batch</button>}
            </div>

            <div className={viewQr ? "no-print" : "printable-area"} style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h4 className="no-print" style={{ margin: '0 0 15px 0', color: '#555' }}>Preview</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
                {generatedCodes.map(item => (
                  <div key={item.id} style={{ border: '1px dashed #ddd', padding: '10px', textAlign: 'center', borderRadius: '8px' }}>
                    <QRCode value={item.link} size={60} style={{ width: '100%', height: 'auto' }} />
                    <p style={{ fontSize: '9px', margin: '5px 0', color: '#999' }}>{item.id}</p>
                  </div>
                ))}
                {generatedCodes.length === 0 && <p style={{ fontSize: '13px', color: '#ccc' }}>Ready to generate.</p>}
              </div>
            </div>
          </div>

          {/* Database Table */}
          <div className="no-print" style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: '#555' }}>Sticker Database</h4>
              <div style={{ position: 'relative' }}>
                <button onClick={(e) => { e.stopPropagation(); setShowCleanupMenu(!showCleanupMenu); }} style={{ background: '#fff', border: '1px solid #ccc', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>⚠️ Manage Data ▼</button>
                {showCleanupMenu && (
                  <div style={{ position: 'absolute', top: '40px', right: 0, background: 'white', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: '160px', zIndex: 100, overflow: 'hidden' }}>
                    <button onClick={deleteUsed} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: 'white', border: 'none', cursor: 'pointer', color: '#d35400' }}>Cleanup Used</button>
                    <button onClick={deleteUnused} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: 'white', border: 'none', cursor: 'pointer', color: '#555' }}>Cleanup Unused</button>
                    <button onClick={deleteAll} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px', background: '#fff0f0', border: 'none', cursor: 'pointer', color: '#c0392b', fontWeight: 'bold' }}>Delete ALL</button>
                  </div>
                )}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee', color: '#999' }}>
                    <th style={{ padding: '10px' }}>ID</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px' }}>Content</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dbCodes.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '10px', fontWeight: '600', color: '#555' }}>{row.id}</td>
                      <td style={{ padding: '10px' }}>{row.video_url ? <span style={{ background: '#fff0f0', color: '#e17055', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>🔴 Used</span> : <span style={{ background: '#e3fafc', color: '#00cec9', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>🟢 Empty</span>}</td>
                      <td style={{ padding: '10px' }}>{row.video_url ? (row.allow_admin_view !== false ? <button onClick={() => setPreviewVideo(row.video_url)} style={{ background: '#74b9ff', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>🎥 Watch</button> : <span style={{ fontSize: '11px', color: '#999' }}>🔒 Private</span>) : <span style={{ color: '#eee' }}>—</span>}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <button onClick={() => setViewQr({link: `${baseUrl}/${row.id}`, id: row.id})} style={{ background: '#a29bfe', padding: '6px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>👁️</button>
                        <button onClick={() => deleteCode(row.id)} style={{ background: '#ff7675', padding: '6px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================
          TAB 2: ORDER INBOX
         ======================= */}
      {activeTab === 'inbox' && (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>📩 Incoming Requests</h3>
              <button onClick={fetchRequests} style={{ background: 'white', border: '1px solid #ccc', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>Refresh</button>
            </div>

            <div style={{ display: 'grid', gap: '15px' }}>
              {requests.map(req => (
                <div key={req.id} style={{ border: '1px solid #eee', padding: '20px', borderRadius: '12px', background: req.status === 'Done' ? '#f9f9f9' : 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  {/* Order Details */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#2d3436' }}>{req.letter_type}</span>
                      <span style={{ fontSize: '12px', background: '#dfe6e9', padding: '2px 8px', borderRadius: '10px' }}>{req.category}</span>
                      <span style={{ fontSize: '12px', background: '#ffeaa7', padding: '2px 8px', borderRadius: '10px', fontFamily: 'monospace' }}>Ticket: {req.ticket_code}</span>
                    </div>
                    <p style={{ margin: '0 0 5px 0', color: '#636e72', fontSize: '14px' }}>
                      Customer: <strong>{req.customer_name}</strong> ({req.customer_age} y/o)
                    </p>
                    <p style={{ margin: 0, color: '#0984e3', fontSize: '14px', cursor: 'pointer' }} onClick={() => window.open(req.contact_link.includes('http') ? req.contact_link : `https://${req.contact_link}`, '_blank')}>
                      🔗 {req.contact_link}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '10px' }}>
                      {req.status === 'Pending' ? (
                        <span style={{ background: '#ffeaa7', color: '#d35400', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>⏳ Pending</span>
                      ) : (
                        <span style={{ background: '#55efc4', color: '#00b894', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>✅ Done</span>
                      )}
                    </div>
                    
                    {req.status === 'Pending' && (
                      <button onClick={() => markRequestDone(req.id)} style={{ background: '#00b894', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' }}>Mark Done</button>
                    )}
                    <button onClick={() => deleteRequest(req.id)} style={{ background: '#ff7675', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                  </div>

                </div>
              ))}
              {requests.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No requests yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* --- MODALS (Video & QR) --- */}
      {previewVideo && (
        <div className="modal-overlay no-print" onClick={() => setPreviewVideo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'transparent', boxShadow: 'none' }}>
             <button onClick={() => setPreviewVideo(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', color: 'white', fontSize: '24px', padding: 0 }}>✕</button>
            <video src={previewVideo} controls autoPlay />
          </div>
        </div>
      )}

      {viewQr && (
        <div className="modal-overlay" onClick={() => setViewQr(null)}>
          <div className="modal-content printable-modal" onClick={e => e.stopPropagation()} style={{ position: 'relative', padding: '40px 30px 30px' }}>
            <button className="no-print" onClick={() => setViewQr(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', color: '#999', fontSize: '20px', width: '30px', height: '30px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={(e) => e.currentTarget.style.background = '#f1f1f1'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>✕</button>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Scan Code</h3>
            <div style={{ padding: '20px', background: 'white', borderRadius: '12px', display: 'inline-block', border: '1px dashed #ccc' }}>
              <QRCode value={viewQr.link} size={180} />
            </div>
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '20px', marginTop: '10px' }}>{viewQr.id}</p>
            <button className="no-print" onClick={() => window.print()} style={{ background: '#2d3436', color: 'white', width: '100%', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>🖨️ Print Sticker</button>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-modal, .printable-modal * { visibility: visible; }
          .printable-modal { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: auto; height: auto; box-shadow: none; border: none; overflow: visible; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
          .printable-area > div { display: grid; grid-template-columns: repeat(4, 1fr) !important; gap: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}