import { useState } from 'react'
import QRCode from 'react-qr-code'

export default function Admin() {
  // I pre-filled your URL here!
  const [baseUrl, setBaseUrl] = useState('https://paperplay-nu.vercel.app') 
  const [count, setCount] = useState(12) // 12 fits nicely on a page
  const [codes, setCodes] = useState([])

  function generateCodes() {
    if (!baseUrl) return alert('URL is required')
    
    // We create a "Batch ID" based on the time (e.g. 948302)
    const batchId = Date.now().toString().slice(-6)
    
    const newCodes = Array.from({ length: count }).map((_, i) => ({
      id: `tag-${batchId}-${i + 1}`,
      link: `${baseUrl}/#/${batchId}-${i + 1}`
    }))
    setCodes(newCodes)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      {/* CONTROL PANEL (Hidden when printing) */}
      <div className="no-print" style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
        <h1>🖨️ Sticker Factory</h1>
        <p>1. Check URL. 2. Click Generate. 3. Click Print.</p>
        
        <input 
          type="text" 
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          style={{ padding: '10px', width: '300px', marginRight: '10px' }}
        />
        <input 
          type="number" 
          value={count} 
          onChange={(e) => setCount(Number(e.target.value))}
          style={{ padding: '10px', width: '60px', marginRight: '10px' }}
        />
        <button onClick={generateCodes} style={{ padding: '10px 20px', background: 'black', color: 'white', border: 'none', cursor: 'pointer' }}>Generate</button>
        <button onClick={() => window.print()} style={{ marginLeft: '10px', padding: '10px 20px', cursor: 'pointer' }}>🖨️ Print Page</button>
      </div>

      {/* THE STICKERS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', textAlign: 'center' }}>
        {codes.map((item) => (
          <div key={item.id} style={{ border: '2px dashed #333', padding: '15px', borderRadius: '10px' }}>
            {/* The QR Code */}
            <QRCode value={item.link} size={100} />
            
            {/* Branding */}
            <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', fontSize: '12px' }}>SCAN ME 📸</p>
            <p style={{ margin: '0', fontSize: '10px', color: '#666' }}>PaperPlay</p>
            <p style={{ fontSize: '8px', color: '#ccc', marginTop: '2px' }}>{item.id}</p>
          </div>
        ))}
      </div>

      {/* CSS to hide buttons when printing */}
      <style>{`@media print { .no-print { display: none; } }`}</style>
    </div>
  )
}