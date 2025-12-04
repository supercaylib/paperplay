import { useState } from 'react'
import QRCode from 'react-qr-code'

export default function Admin() {
  const [baseUrl, setBaseUrl] = useState('https://paperplay-nu.vercel.app') 
  const [count, setCount] = useState(1)
  const [codes, setCodes] = useState([])

  function generateCodes() {
    if (!baseUrl) return alert('URL is required')
    
    const batchId = Date.now().toString().slice(-6)
    
    const newCodes = Array.from({ length: count }).map((_, i) => ({
      id: `tag-${batchId}-${i + 1}`,
      // Remember: Clean URL because we are using BrowserRouter
      link: `${baseUrl}/${`tag-${batchId}-${i + 1}`}`
    }))
    setCodes(newCodes)
  }

  // New Feature: Copy to Clipboard
  function copyToClipboard(link) {
    navigator.clipboard.writeText(link)
    alert('Link copied to clipboard! 📋')
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* --- CONTROL PANEL (Hidden when printing) --- */}
      <div className="no-print" style={{ 
        marginBottom: '30px', 
        border: '1px solid #ddd', 
        padding: '25px',
        borderRadius: '15px',
        background: '#fff',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
      }}>
        <h1 style={{ marginTop: 0 }}>🖨️ Sticker Factory</h1>
        <p style={{ fontSize: '14px', color: '#666' }}>1. Check URL. 2. Generate. 3. Print.</p>
        
        {/* ALIGNMENT FIX: Using Flexbox to stack inputs neatly with a gap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Input Group */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Website URL</label>
            <input 
              type="text" 
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              style={{ padding: '12px', width: '100%', borderRadius: '8px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Quantity</label>
            <input 
              type="number" 
              value={count} 
              onChange={(e) => setCount(Number(e.target.value))}
              style={{ padding: '12px', width: '100%', borderRadius: '8px', border: '1px solid #ccc' }}
            />
          </div>

          {/* Buttons Side-by-Side Group */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              onClick={generateCodes} 
              style={{ flex: 1, background: 'black', color: 'white', padding: '15px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}
            >
              Generate
            </button>
            
            <button 
              onClick={() => window.print()} 
              style={{ flex: 1, background: '#0984e3', color: 'white', padding: '15px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}
            >
              🖨️ Print Page
            </button>
          </div>

        </div>
      </div>

      {/* --- THE STICKERS GRID --- */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '20px', 
        textAlign: 'center',
        width: '100%' 
      }}>
        {codes.map((item) => (
          <div key={item.id} style={{ border: '2px dashed #333', padding: '15px', borderRadius: '10px', background: 'white' }}>
            <QRCode value={item.link} size={100} style={{ maxWidth: '100%', height: 'auto' }} />
            
            <p style={{ margin: '10px 0 0 0', fontWeight: 'bold', fontSize: '12px' }}>SCAN ME 📸</p>
            <p style={{ margin: '0', fontSize: '10px', color: '#666' }}>PaperPlay</p>
            <p style={{ fontSize: '9px', color: '#ccc', margin: '5px 0' }}>{item.id}</p>

            {/* NEW FEATURE: Copy Link Button (Hidden when printing) */}
            <button 
              className="no-print"
              onClick={() => copyToClipboard(item.link)}
              style={{ 
                background: '#dfe6e9', 
                color: '#2d3436', 
                fontSize: '10px', 
                padding: '5px 10px', 
                marginTop: '5px',
                width: 'auto',
                boxShadow: 'none'
              }}
            >
              Copy Link 🔗
            </button>
          </div>
        ))}
      </div>

      <style>{`@media print { .no-print { display: none; } }`}</style>
    </div>
  )
}