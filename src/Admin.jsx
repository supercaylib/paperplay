import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { supabase } from './supabaseClient'

export default function Admin() {
  // CONFIG
  const [baseUrl, setBaseUrl] = useState('https://paperplay-nu.vercel.app') 
  const [count, setCount] = useState(5)
  
  // DATA
  const [generatedCodes, setGeneratedCodes] = useState([]) 
  const [dbCodes, setDbCodes] = useState([]) 
  const [loading, setLoading] = useState(false)
  
  // MODALS
  const [previewVideo, setPreviewVideo] = useState(null)
  const [viewQr, setViewQr] = useState(null) // New: For viewing a specific QR

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

  async function deleteAllUnavailable() {
    const unavailableCount = dbCodes.filter(c => c.video_url).length
    if (unavailableCount === 0) return alert('No stickers to delete.')
    if (!confirm(`Permanently delete ${unavailableCount} used stickers?`)) return

    const { error } = await supabase.from('qr_codes').delete().not('video_url', 'is', null)
    if (!error) {
      alert('Cleanup complete!')
      fetchCodes()
    }
  }

  function copyToClipboard(link) {
    navigator.clipboard.writeText(link)
    alert('Copied!')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f2f6', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* HEADER */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#2d3436' }}>🖨️ PaperPlay Admin</h1>
        <button onClick={() => window.location.reload()} style={{ background: 'white', border: '1px solid #ccc', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
          🔄 Refresh
        </button>
      </div>

      {/* CONTROLS & PREVIEW */}
      <div className="no-print" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
        
        {/* Generator */}
        <div style={{ flex: '0 0 320px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0 }}>⚙️ Controls</h3>
          
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Base URL</label>
          <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} style={{ padding: '8px', width: '100%', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }} />
          
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Quantity</label>
          <input type="number" value={count} onChange={e => setCount(Number(e.target.value))} style={{ padding: '8px', width: '100%', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px' }} />
          
          <button onClick={generateAndSave} style={{ background: 'black', width: '100%', padding: '10px', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Generate
          </button>
          
          {generatedCodes.length > 0 && (
             <button onClick={() => window.print()} style={{ background: '#0984e3', width: '100%', marginTop: '10px', padding: '10px', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
               🖨️ Print Preview
             </button>
          )}
        </div>

        {/* Print Preview Grid */}
        <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', minHeight: '280px' }}>
          <h3 style={{ marginTop: 0 }}>📄 Ready to Print</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
            {generatedCodes.map(item => (
              <div key={item.id} style={{ border: '1px dashed #333', padding: '10px', textAlign: 'center', borderRadius: '8px' }}>
                <QRCode value={item.link} size={80} style={{ width: '100%', height: 'auto' }} />
                <p style={{ fontSize: '10px', margin: '5px 0' }}>{item.id}</p>
                <p style={{ fontSize: '9px', fontWeight: 'bold' }}>SCAN ME</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DATABASE TABLE */}
      <div className="no-print" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>📂 Database ({dbCodes.length})</h3>
          
          {/* SMALLER CLEANUP BUTTON */}
          {dbCodes.some(c => c.video_url) && (
            <button 
              onClick={deleteAllUnavailable}
              style={{ background: '#ff7675', color: 'white', border: 'none', borderRadius: '5px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🗑️ Cleanup Used
            </button>
          )}
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #eee' }}>
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
                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#555' }}>
                      {row.id}
                      <div style={{ fontSize: '10px', color: '#aaa' }}>{new Date(row.created_at).toLocaleDateString()}</div>
                    </td>
                    
                    <td style={{ padding: '10px' }}>
                      {hasVideo ? (
                        <span style={{ background: '#ffeaa7', color: '#d35400', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>🔴 Used</span>
                      ) : (
                        <span style={{ background: '#55efc4', color: '#00b894', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>🟢 Empty</span>
                      )}
                    </td>

                    <td style={{ padding: '10px' }}>
                      {hasVideo ? (
                        <button onClick={() => setPreviewVideo(row.video_url)} style={{ background: '#74b9ff', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>🎥 Watch</button>
                      ) : <span style={{ color: '#ccc' }}>—</span>}
                    </td>

                    <td style={{ padding: '10px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                      {/* NEW: VIEW QR BUTTON */}
                      <button onClick={() => setViewQr({link: `${baseUrl}/${row.id}`, id: row.id})} style={{ background: '#a29bfe', color: 'white', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer' }} title="Show QR">
                        👁️
                      </button>
                      <button onClick={() => copyToClipboard(`${baseUrl}/${row.id}`)} style={{ background: '#dfe6e9', color: '#333', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer' }} title="Copy Link">
                        🔗
                      </button>
                      <button onClick={() => deleteCode(row.id)} style={{ background: '#ff7675', color: 'white', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer' }} title="Delete">
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

      {/* --- MODALS --- */}

      {/* 1. VIDEO MODAL */}
      {previewVideo && (
        <div className="modal-overlay" onClick={() => setPreviewVideo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPreviewVideo(null)}>✕</button>
            <video src={previewVideo} controls autoPlay />
          </div>
        </div>
      )}

      {/* 2. QR CODE MODAL (The New Feature) */}
      {viewQr && (
        <div className="modal-overlay" onClick={() => setViewQr(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', padding: '30px', borderRadius: '15px', maxWidth: '300px' }}>
            <button className="modal-close" onClick={() => setViewQr(null)} style={{ color: '#333', top: '-35px', right: '-10px' }}>✕</button>
            <h3 style={{ margin: '0 0 20px 0' }}>{viewQr.id}</h3>
            <div style={{ background: 'white', padding: '10px', border: '2px dashed #333', borderRadius: '10px' }}>
              <QRCode value={viewQr.link} size={200} style={{ width: '100%', height: 'auto' }} />
            </div>
            <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>Scan to test this link.</p>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, div { background: white !important; margin: 0 !important; padding: 0 !important; height: auto !important; }
        }
      `}</style>
    </div>
  )
}