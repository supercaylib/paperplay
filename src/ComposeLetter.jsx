import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import QRCode from 'react-qr-code'

export default function ComposeLetter() {
  const navigate = useNavigate()
  
  // STATE
  const [step, setStep] = useState(1) 
  const [loading, setLoading] = useState(false)

  // DATA
  const [theme, setTheme] = useState('classic')
  const [subTheme, setSubTheme] = useState(null) 
  
  const [sender, setSender] = useState('')
  const [receiver, setReceiver] = useState('')
  const [unlockDate, setUnlockDate] = useState('')
  const [message, setMessage] = useState('')
  const [ticket, setTicket] = useState(null)
  
  // PHOTO STATE
  const [photoFile, setPhotoFile] = useState(null)

  // THEME CONFIG
  const themes = [
    { id: 'holiday', label: 'Holiday & Seasonal', bg: '#f0f9ff', color: '#2c3e50', font: 'Georgia, serif', colSpan: 2 },
    { id: 'love', label: 'Romance', bg: '#fff0f3', color: '#c0392b', font: 'Brush Script MT, cursive', colSpan: 2 },
    { id: 'classic', label: 'Classic', bg: '#fdf6e3', color: '#5b4636', font: '"Times New Roman", serif', colSpan: 1 },
    { id: 'simple', label: 'Minimal', bg: '#ffffff', color: '#2d3436', font: 'Arial, sans-serif', colSpan: 1 }
  ]

  const holidayOptions = [
    { id: 'christmas', label: 'Christmas', bg: '#d1f2eb', color: '#006266', icon: '🎄' },
    { id: 'newyear', label: 'New Year', bg: '#fff3cd', color: '#d35400', icon: '🎆' },
    { id: 'valentines', label: 'Valentine\'s', bg: '#ffe3e3', color: '#c0392b', icon: '💘' },
    { id: 'thanksgiving', label: 'Thanksgiving', bg: '#ffeaa7', color: '#e67e22', icon: '🦃' },
    { id: 'easter', label: 'Easter', bg: '#e0f7fa', color: '#00bcd4', icon: '🐰' },
    { id: 'halloween', label: 'Halloween', bg: '#2d3436', color: '#fab1a0', icon: '🎃' },
    { id: 'cny', label: 'Chinese New Year', bg: '#ff7675', color: '#d63031', icon: '🧧' }
  ]

  const getVisualTheme = () => {
    if (theme === 'holiday' && subTheme) {
      const h = holidayOptions.find(o => o.id === subTheme)
      if (h) return { ...themes.find(t => t.id === 'holiday'), bg: h.bg, color: h.color }
    }
    return themes.find(t => t.id === theme) || themes[0]
  }

  const currentVisuals = getVisualTheme()

  useEffect(() => {
    if (!receiver) return
    if (!message) {
      setMessage(`Dear ${receiver},\n\n`)
      return
    }
    const simpleDearRegex = /^Dear .*?,/
    if (message.match(simpleDearRegex)) {
      setMessage(message.replace(simpleDearRegex, `Dear ${receiver},`))
    }
  }, [receiver])

  async function handlePublish() {
    if (!message || !sender) return alert('Please write a message and sign your name.')
    setLoading(true)

    let uploadedPhotoUrl = null

    // 1. Upload Photo (With Better Error Handling)
    if (photoFile) {
      try {
        // Sanitize filename: use timestamp + simple extension
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        
        // Attempt Upload
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, photoFile)
        
        if (uploadError) {
          console.error('Upload Error:', uploadError)
          // STOP PROCESS ON ERROR
          alert(`Image Upload Failed: ${uploadError.message}\n(Check your Supabase Storage Policies)`)
          setLoading(false)
          return 
        }

        // Get Public URL
        const { data } = supabase.storage.from('images').getPublicUrl(fileName)
        uploadedPhotoUrl = data.publicUrl

      } catch (err) {
        console.error('Unexpected error:', err)
        alert('Unexpected error during upload.')
        setLoading(false)
        return
      }
    }

    // 2. Insert Data (Only happens if photo succeeded or no photo)
    const { data, error } = await supabase
      .from('digital_letters')
      .insert({
        sender_name: sender,
        message_body: message,
        theme: theme === 'holiday' ? subTheme : theme,
        unlock_at: unlockDate ? new Date(unlockDate).toISOString() : null,
        photo_url: uploadedPhotoUrl
      })
      .select()

    setLoading(false)

    if (error) {
      alert('Database Error: ' + error.message)
    } else {
      setTicket(data[0].ticket_code)
      setStep(5)
    }
  }

  // RECEIPT DOWNLOADER
  const downloadReceipt = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 400; canvas.height = 600
    
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'
    ctx.fillText('PAPERPLAY RECEIPT', 200, 60)
    ctx.font = '14px Arial'; ctx.fillStyle = '#666'; ctx.fillText('TICKET CODE', 200, 100)
    ctx.font = 'bold 40px Monospace'; ctx.fillStyle = '#1a1a1a'; ctx.fillText(ticket, 200, 150)
    ctx.font = '12px Arial'; ctx.fillText('(Scan QR in App)', 200, 480)
    ctx.fillStyle = '#1a1a1a'; ctx.font = 'italic 16px Georgia'; ctx.fillText('Thank you from Starman ✨', 200, 530)

    const svgElement = document.getElementById('qr-code-svg')
    if (svgElement) {
      const xml = new XMLSerializer().serializeToString(svgElement)
      const img = new Image()
      img.src = 'data:image/svg+xml;base64,' + btoa(xml)
      img.onload = () => {
        ctx.drawImage(img, 100, 200, 200, 200)
        const link = document.createElement('a')
        link.download = `PaperPlay-Receipt-${ticket}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
    }
  }

  // NAVIGATION
  const handleThemeSelection = (selectedTheme) => {
    setTheme(selectedTheme)
    if (selectedTheme === 'holiday') setStep(2.5)
    else setStep(3)
  }

  const handleBack = () => {
    if (step === 2.5) setStep(1)
    else if (step === 3) theme === 'holiday' ? setStep(2.5) : setStep(1)
    else if (step === 4) setStep(3)
    else if (step === 1) navigate('/')
  }

  return (
    <div className="app-container wide-view">
      
      <div className="composer-controls">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button onClick={handleBack} className="btn-outline" style={{ width: 'auto', padding: '8px 15px' }}>← Back</button>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ccc', letterSpacing: '1px' }}>
            {step < 5 ? 'CREATING...' : 'DONE'}
          </span>
        </div>

        {step === 1 && (
          <div className="fade-in">
            <h1>Choose Aesthetic</h1>
            <p className="subtitle">Set the vibe for your letter.</p>
            <div className="theme-grid">
              {themes.map(t => (
                <div key={t.id} onClick={() => handleThemeSelection(t.id)} className={`theme-card ${theme === t.id ? 'active' : ''}`} style={{ background: t.bg, color: t.color, gridColumn: `span ${t.colSpan}` }}>
                  <span style={{ fontFamily: t.font, fontSize: '24px' }}>Aa</span>
                  <span style={{ fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2.5 && (
          <div className="fade-in">
            <h1>Which Holiday?</h1>
            <p className="subtitle">Select the specific occasion.</p>
            <div className="button-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
               {holidayOptions.map(h => (
                 <button key={h.id} onClick={() => { setSubTheme(h.id); setStep(3); }} className="action-btn" style={{ background: h.bg, color: h.color, border: 'none', flexDirection: 'column', gap: '5px', textAlign: 'center' }}>
                   <span style={{fontSize:'24px'}}>{h.icon}</span>
                   <span style={{fontSize:'12px'}}>{h.label}</span>
                 </button>
               ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <h1>The Details</h1>
            <p className="subtitle">Who is this for?</p>
            <div className="section">
              <label className="label-text">TO (RECEIVER'S NAME)</label>
              <div className="input-group">
                <input type="text" className="main-input" placeholder="e.g. Your Lover" value={receiver} onChange={e => setReceiver(e.target.value)} style={{paddingLeft: '15px'}} />
              </div>
            </div>
            <div className="section">
              <label className="label-text">FROM (YOUR NAME)</label>
              <div className="input-group">
                <input type="text" className="main-input" placeholder="e.g. Your name" value={sender} onChange={e => setSender(e.target.value)} style={{paddingLeft: '15px'}} />
              </div>
            </div>
            <div className="section">
              <label className="label-text">UNLOCK DATE (OPTIONAL)</label>
              <div className="input-group">
                <input type="date" className="main-input" value={unlockDate} onChange={e => setUnlockDate(e.target.value)} style={{paddingLeft: '15px'}} />
              </div>
            </div>
            <button onClick={() => setStep(4)} className="action-btn btn-solid">Next Step →</button>
          </div>
        )}

        {step === 4 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1>Write Letter</h1>
            <p className="subtitle">Pour your heart out.</p>
            
            <textarea 
              className="main-input" placeholder="Start typing your letter here..." value={message} onChange={e => setMessage(e.target.value)}
              style={{ flex: 1, background: '#f9f9f9', borderRadius: '12px', padding: '20px', resize: 'none', border: '1px solid #eee', marginBottom: '20px', fontFamily: currentVisuals.font, fontSize: '16px', lineHeight: '1.5' }}
            />
            
            {/* FIXED PHOTO UPLOAD UI */}
            <div style={{ marginBottom: '15px', padding: '15px', border: '1px dashed #ccc', borderRadius: '10px', textAlign: 'center', background: '#fcfcfc' }}>
               <label style={{cursor:'pointer', display:'block', width: '100%'}}>
                  {photoFile ? (
                    <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', color:'#27ae60', fontWeight:'600', fontSize:'13px'}}>
                       <span>📸 Image Attached</span>
                       {/* FIXED: Truncate long filenames */}
                       <span style={{maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#666', fontWeight: 'normal'}}>
                         ({photoFile.name})
                       </span>
                    </div>
                  ) : (
                    <div style={{fontSize:'13px', color:'#666'}}>
                      <span style={{fontSize:'18px'}}>📎</span> Attach a Photo
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} style={{display:'none'}} />
               </label>
            </div>

            <button onClick={handlePublish} disabled={loading} className="action-btn btn-solid">
              {loading ? 'Publishing...' : 'Create Letter ✨'}
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="fade-in center-text">
             <div style={{ fontSize: '40px', marginBottom: '20px' }}>🎉</div>
             <h1>Letter Created</h1>
             <p className="subtitle">Your digital memory is ready.</p>
             <div className="ticket-dashed">
                <div className="label-text">TICKET CODE</div>
                <h1 style={{ fontSize: '32px', letterSpacing: '2px', margin: '10px 0' }}>{ticket}</h1>
                <div style={{margin: '20px auto', background: 'white', padding: '10px', display:'inline-block'}}>
                   <QRCode id="qr-code-svg" value={`https://paperplay-nu.vercel.app/view/${ticket}`} size={120} />
                </div>
             </div>
             <button onClick={downloadReceipt} className="action-btn" style={{ background: '#27ae60', color: 'white', marginBottom: '10px' }}>📥 Download Receipt</button>
             <button onClick={() => navigate('/')} className="action-btn btn-outline">Back to Home</button>
          </div>
        )}
      </div>

      <div className="composer-preview">
        <p className="preview-label">LIVE PREVIEW</p>
        <div className="paper-preview" style={{ background: currentVisuals.bg, color: currentVisuals.color }}>
          <div style={{ borderBottom: `1px solid ${currentVisuals.color}40`, paddingBottom: '15px', marginBottom: '20px' }}>
             <span style={{ fontFamily: currentVisuals.font, fontSize: '14px', opacity: 0.7 }}>{unlockDate ? `Opens on: ${unlockDate}` : 'Open immediately'}</span>
          </div>
          <div className="handwritten-text" style={{ fontFamily: currentVisuals.font }}>
             {message || (receiver ? `Dear ${receiver},` : "Start typing...")}
          </div>
          
          {photoFile && (
            <div style={{ marginTop: '20px', padding: '5px', background: 'white', transform: 'rotate(-2deg)', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', width: '100px', margin: '20px auto' }}>
               <img src={URL.createObjectURL(photoFile)} alt="Preview" style={{ width: '100%', display: 'block' }} />
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '30px', textAlign: 'right', fontFamily: currentVisuals.font }}>
            <p style={{ margin: 0, opacity: 0.6, fontSize: '14px' }}>Sincerely,</p>
            <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: 'bold' }}>{sender || "..."}</p>
          </div>
        </div>
      </div>
    </div>
  )
}