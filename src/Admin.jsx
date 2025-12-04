import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { supabase } from './supabaseClient'

export default function Admin() {
  // CONFIG
  const [baseUrl, setBaseUrl] = useState('https://paperplay-nu.vercel.app') 
  const [count, setCount] = useState(6)
  
  // DATA
  const [generatedCodes, setGeneratedCodes] = useState([]) 
  const [dbCodes, setDbCodes] = useState([]) 
  const [loading, setLoading] = useState(false)
  const [previewVideo, setPreviewVideo] = useState(null)

  // Load Data
  useEffect(() => { fetchCodes() }, [])

  async function fetchCodes() {
    setLoading(true)
    const { data } = await supabase
      .from('qr_codes')
      .select('*')
      .order('created_at', { ascending: false })
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
      // Clean URL (BrowserRouter)
      const link = `${baseUrl}/${id}`
      newItems.push({ id, link })
      dbRows.push({ id: id, video_url: null, unlock_at: null })
    }

    const { error } = await supabase.from('qr_codes').insert(dbRows)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      setGeneratedCodes(newItems)
      fetchCodes()
    }
  }

  async function deleteCode(id) {
    if (!confirm('Delete this sticker permanently?')) return
    const { error } = await supabase.from('qr_codes').delete().eq('id', id)
    if (!error) fetchCodes()
  }

  function copyToClipboard(link) {
    navigator.clipboard.writeText(link)
    alert('Copied!')
  }

  return (
    // 1. MAIN WRAPPER: Full Screen, Light Gray Background
    <div style={{ minHeight: '100vh', background: '#f1f2f6', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* HEADER ROW */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 10px' }}>
        <h1 style={{ margin: 0, color: '#2d3436' }}>🖨️ PaperPlay Admin</h1>
        <button onClick={() => window.location.reload()} style={{ width: 'auto', background: 'white', color: '#333', border: '1px solid #ccc', padding: '8px 15px' }}>
          🔄 Refresh Data
        </button>
      </div>

      {/* 2. SPLIT VIEW ROW (Controls Left, Preview Right) */}
      <div className="no-print" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
        
        {/* LEFT CARD: Generator Controls */}
        <div style={{ flex: '0 0 350px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0 }}>⚙️ Controls</h3>
          
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', fontSize: '14px' }}>Base URL</label>
          <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} style={{ padding: '10px', width: '100%', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px' }} />
          
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', fontSize: '14px' }}>Quantity</label>
          <input type="number" value={count} onChange={e => setCount(Number(e.target.value))} style={{ padding: '10px', width: '100%', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '6px' }} />
          
          <button onClick={generateAndSave} style={{ background: 'black', width: '100%', padding: '12px' }}>
            Generate Stickers
          </button>

          {generatedCodes.length > 0 && (
             <button onClick={() => window.print()} style={{ background: '#0984e3', width: '100%', marginTop: '10px', padding: '12px' }}>
               🖨️ Print Preview
             </button>
          )}
        </div>

        {/* RIGHT CARD: Print Preview (The Grid) */}
        <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', minHeight: '300px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>📄 Print Preview</h3>
          
          {generatedCodes.length === 0 ? (
            <div style={{ color: '#ccc', textAlign: 'center', marginTop: '80px' }}>
              <p>Stickers will appear here after clicking Generate.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
              {generatedCodes.map(item => (
                <div key={item.id} style={{ border: '1px dashed #333', padding: '10px', textAlign: 'center', borderRadius: '8px' }}>
                  <QRCode value={item.link} size={80} style={{ width: '100%', height: 'auto' }} />
                  <p style={{ fontSize: '10px', margin: '5px 0' }}>{item.id}</p>
                  <p style={{ fontSize: '10px', fontWeight: 'bold' }}>SCAN ME</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM ROW: Full Width Database Table */}
      <div className="no-print" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0 }}>📂 Sticker Database ({dbCodes.length})</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px' }}>ID</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Content</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dbCodes.map(row => {
                const hasVideo = !!row.video_url
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#555' }}>
                      {row.id}
                      <div style={{ fontSize: '10px', color: '#aaa' }}>{new Date(row.created_at).toLocaleDateString()}</div>
                    </td>
                    
                    <td style={{ padding: '12px' }}>
                      {hasVideo ? (
                        <span style={{ background: '#ffeaa7', color: '#d35400', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                          🔴 Unavailable
                        </span>
                      ) : (
                        <span style={{ background: '#55efc4', color: '#00b894', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                          🟢 Available
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '12px' }}>
                      {hasVideo ? (
                        <button onClick={() => setPreviewVideo(row.video_url)} style={{ background: '#74b9ff', fontSize: '11px', padding: '5px 10px', width: 'auto', marginTop: 0 }}>
                          🎥 Watch
                        </button>
                      ) : (
                        <span style={{ color: '#ccc' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button onClick={() => copyToClipboard(`${baseUrl}/${row.id}`)} style={{ background: 'transparent', border: '1px solid #ddd', color: '#555', padding: '5px 10px', width: 'auto', marginRight: '5px', marginTop: 0 }}>
                        🔗
                      </button>
                      <button onClick={() => deleteCode(row.id)} style={{ background: '#ff7675', padding: '5px 10px', width: 'auto', marginTop: 0 }}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIDEO MODAL */}
      {previewVideo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '10px', borderRadius: '10px', width: '90%', maxWidth: '600px', position: 'relative' }}>
            <button onClick={() => setPreviewVideo(null)} style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', color: 'white', fontSize: '30px', width: 'auto', border: 'none' }}>✖</button>
            <video src={previewVideo} controls style={{ width: '100%', borderRadius: '5px' }} />
          </div>
        </div>
      )}

      {/* PRINT STYLES (Hides the dashboard, shows only the grid) */}
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