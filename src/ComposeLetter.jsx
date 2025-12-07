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

  // THEME CONFIG
  // Note: We use 'colSpan' to control the layout (2 = full width, 1 = half width)
  const themes = [
    { id: 'holiday', label: 'Holiday & Seasonal', bg: '#f0f9ff', color: '#2c3e50', font: 'Georgia, serif', colSpan: 2 },
    { id: 'love', label: 'Romance', bg: '#fff0f3', color: '#c0392b', font: 'Brush Script MT, cursive', colSpan: 2 },
    { id: 'classic', label: 'Classic', bg: '#fdf6e3', color: '#5b4636', font: '"Times New Roman", serif', colSpan: 1 },
    { id: 'simple', label: 'Minimal', bg: '#ffffff', color: '#2d3436', font: 'Arial, sans-serif', colSpan: 1 }
  ]

  // EXTENDED HOLIDAY OPTIONS
  const holidayOptions = [
    { id: 'christmas', label: 'Christmas', bg: '#d1f2eb', color: '#006266', icon: '🎄' },
    { id: 'newyear', label: 'New Year', bg: '#fff3cd', color: '#d35400', icon: '🎆' },
    { id: 'valentines', label: 'Valentine\'s', bg: '#ffe3e3', color: '#c0392b', icon: '💘' },
    { id: 'thanksgiving', label: 'Thanksgiving', bg: '#ffeaa7', color: '#e67e22', icon: '🦃' },
    { id: 'easter', label: 'Easter', bg: '#e0f7fa', color: '#00bcd4', icon: '🐰' },
    { id: 'halloween', label: 'Halloween', bg: '#2d3436', color: '#fab1a0', icon: '🎃' },
    { id: 'cny', label: 'Chinese New Year', bg: '#ff7675', color: '#d63031', icon: '🧧' }
  ]

  // 1. Determine actual visual theme based on selection
  const getVisualTheme = () => {
    // If it's a holiday, use the specific holiday colors
    if (theme === 'holiday' && subTheme) {
      const h = holidayOptions.find(o => o.id === subTheme)
      if (h) return { ...themes.find(t => t.id === 'holiday'), bg: h.bg, color: h.color }
    }
    // Otherwise return the main theme
    return themes.find(t => t.id === theme) || themes[0]
  }

  const currentVisuals = getVisualTheme()

  // 2. FIXED: "Dear Name" Logic
  // This logic looks for "Dear [Something]," at the start and replaces it properly
  useEffect(() => {
    // If empty name, do nothing (or we could clear it, but better to leave it)
    if (!receiver) return

    // If message is totally empty, start it off
    if (!message) {
      setMessage(`Dear ${receiver},\n\n`)
      return
    }

    // Check if message starts with "Dear ..., "
    const dearRegex = /^Dear .*?,\n\n/
    const simpleDearRegex = /^Dear .*?,/

    if (message.match(simpleDearRegex)) {
      // Replace existing "Dear X," with "Dear NewName,"
      const newMessage = message.replace(simpleDearRegex, `Dear ${receiver},`)
      setMessage(newMessage)
    } else {
      // If user deleted the Dear line manually, don't force it back immediately
      // unless the message is exactly empty (handled above).
      // This prevents fighting the user if they want to delete "Dear".
    }
  }, [receiver])

  async function handlePublish() {
    if (!message || !sender) return alert('Please write a message and sign your name.')
    setLoading(true)

    const { data, error } = await supabase
      .from('digital_letters')
      .insert({
        sender_name: sender,
        message_body: message,
        theme: theme === 'holiday' ? subTheme : theme, // Store specific holiday if applicable
        unlock_at: unlockDate ? new Date(unlockDate).toISOString() : null
      })
      .select()

    setLoading(false)

    if (error) {
      alert('Error: ' + error.message)
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
    
    ctx.font = '14px Arial'; ctx.fillStyle = '#666'
    ctx.fillText('TICKET CODE', 200, 100)
    
    ctx.font = 'bold 40px Monospace'; ctx.fillStyle = '#1a1a1a'
    ctx.fillText(ticket, 200, 150)
    
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2
    ctx.strokeRect(100, 200, 200, 200)
    ctx.font = '12px Arial'; ctx.fillText('(Scan QR in App)', 200, 300)

    ctx.fillStyle = '#1a1a1a'; ctx.font = 'italic 16px Georgia'
    ctx.fillText('Thank you from Starman ✨', 200, 500)
    
    const link = document.createElement('a')
    link.download = `PaperPlay-Receipt-${ticket}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  // NAVIGATION HANDLERS
  const handleThemeSelection = (selectedTheme) => {
    setTheme(selectedTheme)
    if (selectedTheme === 'holiday') {
      setStep(2.5) // Go to holiday choices
    } else {
      setStep(3) // Skip to details
    }
  }

  const handleBack = () => {
    if (step === 2.5) {
      setStep(1) // From Holidays back to Main Theme
    } else if (step === 3) {
      // If we are in Details, check where we came from
      if (theme === 'holiday') setStep(2.5)
      else setStep(1)
    } else if (step === 4) {
      setStep(3)
    } else if (step === 1) {
      navigate('/')
    }
  }

  return (
    <div className="app-container wide-view">
      
      {/* --- LEFT SIDE: CONTROLS --- */}
      <div className="composer-controls">
        
        {/* BACK BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button onClick={handleBack} className="btn-outline" style={{ width: 'auto', padding: '8px 15px' }}>← Back</button>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ccc', letterSpacing: '1px' }}>
            {step < 5 ? 'CREATING...' : 'DONE'}
          </span>
        </div>

        {/* STEP 1: CHOOSE THEME CATEGORY */}
        {step === 1 && (
          <div className="fade-in">
            <h1>Choose Aesthetic</h1>
            <p className="subtitle">Set the vibe for your letter.</p>
            
            <div className="theme-grid">
              {themes.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => handleThemeSelection(t.id)}
                  className={`theme-card ${theme === t.id ? 'active' : ''}`}
                  style={{ 
                    background: t.bg, 
                    color: t.color, 
                    gridColumn: `span ${t.colSpan}` // Controls layout order
                  }}
                >
                  <span style={{ fontFamily: t.font, fontSize: '24px' }}>Aa</span>
                  <span style={{ fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2.5: HOLIDAY SUB-SELECTION */}
        {step === 2.5 && (
          <div className="fade-in">
            <h1>Which Holiday?</h1>
            <p className="subtitle">Select the specific occasion.</p>
            
            <div className="button-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
               {holidayOptions.map(h => (
                 <button 
                  key={h.id}
                  onClick={() => { setSubTheme(h.id); setStep(3); }}
                  className="action-btn"
                  style={{ background: h.bg, color: h.color, border: 'none', flexDirection: 'column', gap: '5px', textAlign: 'center' }}
                 >
                   <span style={{fontSize:'24px'}}>{h.icon}</span>
                   <span style={{fontSize:'12px'}}>{h.label}</span>
                 </button>
               ))}
            </div>
          </div>
        )}

        {/* STEP 3: DETAILS */}
        {step === 3 && (
          <div className="fade-in">
            <h1>The Details</h1>
            <p className="subtitle">Who is this for?</p>
            
            <div className="section">
              <label className="label-text">TO (RECEIVER'S NAME)</label>
              <div className="input-group">
                <input 
                  type="text" 
                  className="main-input" 
                  placeholder="e.g. Justine" 
                  value={receiver} 
                  onChange={e => setReceiver(e.target.value)}
                  style={{paddingLeft: '15px'}}
                />
              </div>
            </div>

            <div className="section">
              <label className="label-text">FROM (YOUR NAME)</label>
              <div className="input-group">
                <input 
                  type="text" 
                  className="main-input" 
                  placeholder="e.g. Kuya Caleb" 
                  value={sender} 
                  onChange={e => setSender(e.target.value)}
                  style={{paddingLeft: '15px'}}
                />
              </div>
            </div>

            <div className="section">
              <label className="label-text">UNLOCK DATE (OPTIONAL)</label>
              <div className="input-group">
                <input 
                  type="date" 
                  className="main-input" 
                  value={unlockDate} 
                  onChange={e => setUnlockDate(e.target.value)}
                  style={{paddingLeft: '15px'}}
                />
              </div>
            </div>

            <button onClick={() => setStep(4)} className="action-btn btn-solid">Next Step →</button>
          </div>
        )}

        {/* STEP 4: WRITE */}
        {step === 4 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1>Write Letter</h1>
            <p className="subtitle">Pour your heart out.</p>

            <textarea 
              className="main-input"
              placeholder="Start typing your letter here..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{
                flex: 1, 
                background: '#f9f9f9', 
                borderRadius: '12px', 
                padding: '20px', 
                resize: 'none', 
                border: '1px solid #eee',
                marginBottom: '20px',
                fontFamily: currentVisuals.font,
                fontSize: '16px',
                lineHeight: '1.5'
              }}
            />
            
            <button onClick={handlePublish} disabled={loading} className="action-btn btn-solid">
              {loading ? 'Publishing...' : 'Create Letter ✨'}
            </button>
          </div>
        )}

        {/* STEP 5: SUCCESS & RECEIPT */}
        {step === 5 && (
          <div className="fade-in center-text">
             <div style={{ fontSize: '40px', marginBottom: '20px' }}>🎉</div>
             <h1>Letter Created</h1>
             <p className="subtitle">Your digital memory is ready.</p>

             <div className="ticket-dashed">
                <div className="label-text">TICKET CODE</div>
                <h1 style={{ fontSize: '32px', letterSpacing: '2px', margin: '10px 0' }}>{ticket}</h1>
                <div style={{margin: '20px auto', background: 'white', padding: '10px', display:'inline-block'}}>
                   <QRCode value={`https://paperplay-nu.vercel.app/view/${ticket}`} size={100} />
                </div>
             </div>

             <button onClick={downloadReceipt} className="action-btn" style={{ background: '#27ae60', color: 'white', marginBottom: '10px' }}>
                📥 Download Receipt
             </button>

             <button onClick={() => navigate('/')} className="action-btn btn-outline">Back to Home</button>
          </div>
        )}
      </div>

      {/* --- RIGHT SIDE: LIVE PREVIEW --- */}
      <div className="composer-preview">
        <p className="preview-label">LIVE PREVIEW</p>
        
        <div className="paper-preview" style={{ background: currentVisuals.bg, color: currentVisuals.color }}>
          <div style={{ borderBottom: `1px solid ${currentVisuals.color}40`, paddingBottom: '15px', marginBottom: '20px' }}>
             <span style={{ fontFamily: currentVisuals.font, fontSize: '14px', opacity: 0.7 }}>
               {unlockDate ? `Opens on: ${unlockDate}` : 'Open immediately'}
             </span>
          </div>

          <div className="handwritten-text" style={{ fontFamily: currentVisuals.font }}>
             {message || (receiver ? `Dear ${receiver},` : "Start typing...")}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '30px', textAlign: 'right', fontFamily: currentVisuals.font }}>
            <p style={{ margin: 0, opacity: 0.6, fontSize: '14px' }}>Sincerely,</p>
            <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: 'bold' }}>{sender || "..."}</p>
          </div>
        </div>
      </div>

    </div>
  )
}