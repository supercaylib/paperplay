import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { supabase } from './supabaseClient'

export default function Admin() {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')

  // --- DASHBOARD STATE ---
  const [baseUrl, setBaseUrl] = useState('https://paperplay-nu.vercel.app') 
  const [count, setCount] = useState(5)
  const [generatedCodes, setGeneratedCodes] = useState([]) 
  const [dbCodes, setDbCodes] = useState([]) 
  const [loading, setLoading] = useState(false)
  const [previewVideo, setPreviewVideo] = useState(null)
  const [viewQr, setViewQr] = useState(null)

  // 1. CHECK LOGIN
  useEffect(() => {
    const session = sessionStorage.getItem('paperplay_admin_session')
    if (session === 'true') {
      setIsAuthenticated(true)
      fetchCodes()
    }
  }, [])

  function handleLogin(e) {
    e.preventDefault()
    const secret = import.meta.env.VITE_ADMIN_PASSWORD || '1234'
    if (passwordInput === secret) {
      setIsAuthenticated(true)
      sessionStorage.setItem('paperplay_admin_session', 'true')
      fetchCodes()
    } else {
      alert('Wrong Password 🔒')
    }
  }

  function handleLogout() {
    setIsAuthenticated(false)
    sessionStorage.removeItem('paperplay_admin_session')
  }

  // --- DATA FUNCTIONS ---
  async function fetchCodes() {
    setLoading(true)
    const { data } = await supabase.from('qr_codes').select('*').order('created_at', { ascending: false })
    if (data) setDbCodes(data)
    setLoading(false)
  }

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
    if (!confirm('Delete this sticker?')) return
    const { error } = await supabase.from('qr_codes').delete().eq('id', id)
    if (!error) fetchCodes()
  }

  async function deleteAllUnavailable() {
    const unavailableCount = dbCodes.filter(c => c.video_url).length
    if (unavailableCount === 0) return
    if (!confirm(`Delete ${unavailableCount} used stickers?`)) return
    const { error } = await supabase.from('qr_codes').delete().not('video_url', 'is', null)
    if (!error) fetchCodes()
  }

  function copyToClipboard(link) {
    navigator.clipboard.writeText(link)
    alert('Copied!')
  }

  // --- RENDER: LOGIN ---
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '350px', width: '100%' }}>
          <div style={{ fontSize: '40px', marginBottom: '20px' }}>🔒</div>
          <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>Admin Access</h2>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', fontSize: '16px' }} />
            <button type="submit" style={{ width: '100%', background: 'black', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>Unlock</button>
          </form>
        </div>
      </div>
    )
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '30px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER (Hidden on print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', maxWidth: '1100px', margin: '0 auto 30px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>🖨️ Admin</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.location.reload()} style={{ background: 'white', color: '#333', border: '1px solid #ddd' }}>🔄 Refresh</button>
          <button onClick={handleLogout} style={{ background: '#ff7675', color: 'white' }}>Logout</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '25px', maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* LEFT: CONTROLS (Hidden on print) */}
        <div className="no-print" style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', height: 'fit-content' }}>
          <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#555' }}>Generate</h4>
          
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#777' }}>Base URL</label>
          <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} style={{ padding: '10px', width: '100%', marginBottom: '15px', border: '1px solid #eee', borderRadius: '8px', fontSize: '13px' }} />
          
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#777' }}>Quantity</label>
          <input type="number" value={count} onChange={e => setCount(Number(e.target.value))} style={{ padding: '10px', width: '100%', marginBottom: '20px', border: '1px solid #eee', borderRadius: '8px', fontSize: '13px' }} />
          
          <button onClick={generateAndSave} style={{ background: '#2d3436', width: '100%' }}>Generate</button>
          
          {generatedCodes.length > 0 && (
             <button onClick={() => window.print()} style={{ background: '#0984e3', width: '100%', marginTop: '10px' }}>🖨️ Print</button>
          )}
        </div>

        {/* RIGHT: PREVIEW (THIS IS WHAT PRINTS) */}
        <div className="printable-area" style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <h4 className="no-print" style={{ marginTop: 0, marginBottom: '15px', color: '#555' }}>Preview</h4>
          
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

      {/* DATABASE TABLE (Hidden on print) */}
      <div className="no-print" style={{ maxWidth: '1100px', margin: '30px auto', background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4 style={{ margin: 0, color: '#555' }}>Database ({dbCodes.length})</h4>
          {dbCodes.some(c => c.video_url) && (
            <button onClick={deleteAllUnavailable} style={{ background: '#ff7675', fontSize: '12px', padding: '6px 12px' }}>🗑️ Cleanup Used</button>
          )}
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
              {dbCodes.map(row => {
                const hasVideo = !!row.video_url
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '12px 10px', fontWeight: '600', color: '#555' }}>{row.id}</td>
                    <td style={{ padding: '12px 10px' }}>
                      {hasVideo ? <span style={{ background: '#fff0f0', color: '#e17055', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>🔴 Used</span> : <span style={{ background: '#e3fafc', color: '#00cec9', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>🟢 Empty</span>}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      {hasVideo ? <button onClick={() => setPreviewVideo(row.video_url)} style={{ background: '#74b9ff', fontSize: '11px', padding: '6px 12px' }}>🎥 Watch</button> : <span style={{ color: '#eee' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => setViewQr({link: `${baseUrl}/${row.id}`, id: row.id})} style={{ background: '#a29bfe', padding: '6px 10px' }}>👁️</button>
                      <button onClick={() => copyToClipboard(`${baseUrl}/${row.id}`)} style={{ background: '#dfe6e9', color: '#555', padding: '6px 10px' }}>🔗</button>
                      <button onClick={() => deleteCode(row.id)} style={{ background: '#ff7675', padding: '6px 10px' }}>🗑️</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS (Hidden on print) */}
      {previewVideo && (
        <div className="modal-overlay no-print" onClick={() => setPreviewVideo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'transparent', boxShadow: 'none' }}>
             <button onClick={() => setPreviewVideo(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', color: 'white', fontSize: '24px', padding: 0 }}>✕</button>
            <video src={previewVideo} controls autoPlay />
          </div>
        </div>
      )}

      {viewQr && (
        <div className="modal-overlay no-print" onClick={() => setViewQr(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: '#333' }}>Scan Code</h3>
            <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '12px', display: 'inline-block' }}>
              <QRCode value={viewQr.link} size={180} />
            </div>
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '20px' }}>{viewQr.id}</p>
            <button onClick={() => setViewQr(null)} style={{ background: '#eee', color: '#333', width: '100%' }}>Close</button>
          </div>
        </div>
      )}

      {/* PRINT STYLES - THIS IS THE CRITICAL FIX */}
      <style>{`
        @media print {
          /* Hide EVERYTHING first */
          body * {
            visibility: hidden;
          }
          
          /* Show ONLY the printable-area and its children */
          .printable-area, .printable-area * {
            visibility: visible;
          }

          /* Position the printable area at the top left of the paper */
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
            box-shadow: none !important;
          }

          /* Ensure the grid looks good on paper */
          .printable-area > div {
            display: grid;
            grid-template-columns: repeat(4, 1fr) !important; /* Force 4 columns on paper */
            gap: 20px;
          }

          /* Hide elements explicitly marked no-print */
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}