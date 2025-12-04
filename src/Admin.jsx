import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { supabase } from './supabaseClient'

export default function Admin() {
  // CONFIG
  const [baseUrl, setBaseUrl] = useState('https://paperplay-nu.vercel.app') 
  const [count, setCount] = useState(1)
  
  // DATA
  const [generatedCodes, setGeneratedCodes] = useState([]) // Codes currently on screen to print
  const [dbCodes, setDbCodes] = useState([]) // All codes from database
  const [loading, setLoading] = useState(false)

  // PREVIEW MODAL
  const [previewVideo, setPreviewVideo] = useState(null)

  // 1. Fetch data on load
  useEffect(() => {
    fetchCodes()
  }, [])

  async function fetchCodes() {
    setLoading(true)
    const { data } = await supabase
      .from('qr_codes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setDbCodes(data)
    setLoading(false)
  }

  // 2. Generate AND Save to DB (So we know they are "Available")
  async function generateAndSave() {
    if (!baseUrl) return alert('URL is required')
    
    const batchId = Date.now().toString().slice(-6)
    const newItems = []
    const dbRows = []

    for (let i = 0; i < count; i++) {
      const id = `tag-${batchId}-${i + 1}`
      const link = `${baseUrl}/${id}`
      
      // For the UI (Printing)
      newItems.push({ id, link })
      
      // For the Database (Tracking)
      dbRows.push({ 
        id: id, 
        video_url: null, // Null means "Available"
        unlock_at: null 
      })
    }

    // Save to Supabase
    const { error } = await supabase.from('qr_codes').insert(dbRows)
    
    if (error) {
      alert('Error saving to database! ' + error.message)
    } else {
      setGeneratedCodes(newItems)
      fetchCodes() // Refresh the list
    }
  }

  // 3. Delete Function
  async function deleteCode(id) {
    if (!confirm('Are you sure you want to delete this sticker?')) return

    const { error } = await supabase.from('qr_codes').delete().eq('id', id)
    if (!error) fetchCodes()
  }

  // 4. Copy Link Helper
  function copyToClipboard(link) {
    navigator.clipboard.writeText(link)
    alert('Copied!')
  }

  return (
    // We use a custom full-width container for Admin, ignoring the mobile css
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '40px' }}>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#2d3436' }}>🖨️ Admin Dashboard</h1>
            <p style={{ margin: '5px 0 0 0', color: '#636e72' }}>Manage your stickers and monitor usage.</p>
          </div>
          <button onClick={() => window.location.reload()} style={{ width: 'auto', background: 'white', color: '#333', border: '1px solid #ccc' }}>
            🔄 Refresh List
          </button>
        </div>

        {/* --- SECTION 1: GENERATOR (Top) --- */}
        <div className="no-print" style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
          <h2 style={{ marginTop: 0 }}>✨ Generate New Stickers</h2>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Base URL</label>
              <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} style={{ padding: '12px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Quantity</label>
              <input type="number" value={count} onChange={e => setCount(Number(e.target.value))} style={{ padding: '12px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <button onClick={generateAndSave} style={{ marginTop: 0, background: 'black', height: '44px' }}>Generate</button>
            </div>
          </div>

          {/* PRINT AREA (Only shows if generated) */}
          {generatedCodes.length > 0 && (
            <div style={{ marginTop: '20px', padding: '20px', background: '#f1f2f6', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>🖨️ Ready to Print ({generatedCodes.length})</h3>
                <button onClick={() => window.print()} style={{ width: 'auto', background: '#0984e3' }}>Print</button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
                {generatedCodes.map(item => (
                  <div key={item.id} style={{ background: 'white', padding: '10px', textAlign: 'center', borderRadius: '8px', border: '1px dashed #ccc' }}>
                    <QRCode value={item.link} size={80} style={{ width: '100%', height: 'auto' }} />
                    <p style={{ fontSize: '10px', margin: '5px 0' }}>{item.id}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- SECTION 2: DATABASE LIST (Bottom) --- */}
        <div className="no-print" style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginTop: 0 }}>📂 Sticker Database</h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ background: '#f1f2f6', textAlign: 'left' }}>
                <th style={{ padding: '15px', borderRadius: '8px 0 0 8px' }}>ID</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px' }}>Content</th>
                <th style={{ padding: '15px', borderRadius: '0 8px 8px 0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dbCodes.map(row => {
                const hasVideo = !!row.video_url
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#555' }}>
                      {row.id} <br/>
                      <span style={{ fontSize: '10px', color: '#999' }}>{new Date(row.created_at).toLocaleDateString()}</span>
                    </td>
                    
                    <td style={{ padding: '15px' }}>
                      {hasVideo ? (
                        <span style={{ background: '#ffeaa7', color: '#d35400', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                          🔴 Unavailable (Used)
                        </span>
                      ) : (
                        <span style={{ background: '#55efc4', color: '#00b894', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                          🟢 Available
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '15px' }}>
                      {hasVideo ? (
                        <button 
                          onClick={() => setPreviewVideo(row.video_url)}
                          style={{ width: 'auto', padding: '8px 15px', fontSize: '12px', background: '#74b9ff', marginTop: 0 }}
                        >
                          🎥 Watch Video
                        </button>
                      ) : (
                        <span style={{ color: '#b2bec3', fontSize: '12px' }}>Empty</span>
                      )}
                    </td>

                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => copyToClipboard(`${baseUrl}/${row.id}`)}
                          style={{ width: 'auto', padding: '8px', fontSize: '12px', background: '#dfe6e9', color: '#333', marginTop: 0 }}
                          title="Copy Link"
                        >
                          🔗
                        </button>
                        <button 
                          onClick={() => deleteCode(row.id)}
                          style={{ width: 'auto', padding: '8px', fontSize: '12px', background: '#ff7675', marginTop: 0 }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {dbCodes.length === 0 && <p style={{ textAlign: 'center', padding: '20px' }}>No stickers found.</p>}
        </div>

      </div>

      {/* VIDEO PREVIEW MODAL */}
      {previewVideo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '15px', width: '90%', maxWidth: '500px', position: 'relative' }}>
            <button 
              onClick={() => setPreviewVideo(null)}
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', color: 'black', fontSize: '20px', width: 'auto', boxShadow: 'none', padding: 0 }}
            >
              ✖
            </button>
            <h3 style={{ marginTop: 0 }}>Sticker Content</h3>
            <video src={previewVideo} controls style={{ width: '100%', borderRadius: '10px' }} />
          </div>
        </div>
      )}

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, div { background: white !important; margin: 0 !important; padding: 0 !important; height: auto !important; }
          .app-container { width: 100% !important; max-width: none !important; }
        }
      `}</style>
    </div>
  )
}