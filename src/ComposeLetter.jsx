import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import QRCode from 'react-qr-code'

export default function ComposeLetter() {
  const navigate = useNavigate()
  
  // STATE
  const [step, setStep] = useState(1) 
  const [loading, setLoading] = useState(false)

  // DATA
  const [withQr, setWithQr] = useState(false)
  const [theme, setTheme] = useState('classic')
  const [sender, setSender] = useState('')
  const [unlockDate, setUnlockDate] = useState('')
  const [message, setMessage] = useState('')
  const [ticket, setTicket] = useState(null)

  // THEME CONFIG
  const themes = [
    { id: 'classic', label: 'Classic', bg: '#fdf6e3', color: '#5b4636', font: '"Times New Roman", serif' },
    { id: 'love', label: 'Romance', bg: '#fff0f3', color: '#c0392b', font: 'Brush Script MT, cursive' },
    { id: 'christmas', label: 'Holiday', bg: '#d1f2eb', color: '#006266', font: 'Georgia, serif' },
    { id: 'simple', label: 'Minimal', bg: '#ffffff', color: '#2d3436', font: 'Arial, sans-serif' }
  ]

  const currentTheme = themes.find(t => t.id === theme) || themes[0]

  async function handlePublish() {
    if (!message || !sender) return alert('Please write a message and sign your name.')
    setLoading(true)

    const { data, error } = await supabase
      .from('digital_letters')
      .insert({
        sender_name: sender,
        message_body: message,
        theme: theme,
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

  // REUSABLE COMPONENTS
  const BackButton = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
       {step > 1 && step < 5 ? (
        <button onClick={() => setStep(step - 1)} className="btn-outline" style={{ width: 'auto', padding: '8px 15px' }}>← Back</button>
      ) : (
        <button onClick={() => navigate('/')} className="btn-outline" style={{ width: 'auto', padding: '8px 15px' }}>✕ Close</button>
      )}
      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ccc', letterSpacing: '1px' }}>
        {step < 5 ? `STEP ${step} / 4` : 'DONE'}
      </span>
    </div>
  )

  return (
    // "wide-view" class enables the split layout on Desktop
    <div className="app-container wide-view">
      
      {/* --- LEFT SIDE: CONTROLS --- */}
      <div className="composer-controls">
        <BackButton />

        {/* STEP 1: DELIVERY */}
        {step === 1 && (
          <div className="fade-in">
            <h1>Delivery Method</h1>
            <p className="subtitle">How will they receive this?</p>
            
            <div className="button-grid">
              <button onClick={() => { setWithQr(false); setStep(2) }} className="action-btn btn-outline">
                <span style={{fontSize:'20px'}}>🎟️</span>
                <div style={{textAlign:'left'}}>
                  <div>Digital Ticket Code</div>
                  <div style={{fontSize:'11px', color:'#888', fontWeight:'normal'}}>Share a simple 6-digit code.</div>
                </div>
              </button>

              <button onClick={() => { setWithQr(true); setStep(2) }} className="action-btn btn-outline">
                <span style={{fontSize:'20px'}}>🔳</span>
                <div style={{textAlign:'left'}}>
                  <div>QR Code Sticker</div>
                  <div style={{fontSize:'11px', color:'#888', fontWeight:'normal'}}>Generate a printable QR.</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: THEME */}
        {step === 2 && (
          <div className="fade-in">
            <h1>Choose Aesthetic</h1>
            <p className="subtitle">Set the vibe for your letter.</p>
            
            <div className="theme-grid">
              {themes.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => { setTheme(t.id); setStep(3) }}
                  className={`theme-card ${theme === t.id ? 'active' : ''}`}
                  style={{ background: t.bg, color: t.color }}
                >
                  <span style={{ fontFamily: t.font, fontSize: '24px' }}>Aa</span>
                  <span style={{ fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: DETAILS */}
        {step === 3 && (
          <div className="fade-in">
            <h1>The Details</h1>
            <p className="subtitle">Sign your name.</p>
            
            <div className="section">
              <label className="label-text">FROM</label>
              <div className="input-group">
                <input 
                  type="text" 
                  className="main-input" 
                  placeholder="e.g. Secret Admirer" 
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
              <p style={{fontSize:'12px', color:'#999', marginTop:'5px'}}>Leave empty to unlock immediately.</p>
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
                marginBottom: '20px'
              }}
            />
            
            <button onClick={handlePublish} disabled={loading} className="action-btn btn-solid">
              {loading ? 'Publishing...' : 'Create Letter ✨'}
            </button>
          </div>
        )}

        {/* STEP 5: SUCCESS */}
        {step === 5 && (
          <div className="fade-in center-text">
             <div style={{ fontSize: '40px', marginBottom: '20px' }}>🎉</div>
             <h1>Letter Created</h1>
             <p className="subtitle">Your digital memory is ready.</p>

             <div className="ticket-dashed">
                <div className="label-text">TICKET CODE</div>
                <h1 style={{ fontSize: '32px', letterSpacing: '2px' }}>{ticket}</h1>
             </div>

             {withQr && (
               <div style={{ marginBottom: '20px' }}>
                 <QRCode value={`https://paperplay-nu.vercel.app/view/${ticket}`} size={120} />
               </div>
             )}

             <button onClick={() => navigate('/')} className="action-btn btn-solid">Back to Home</button>
          </div>
        )}
      </div>

      {/* --- RIGHT SIDE: LIVE PREVIEW (Desktop Only) --- */}
      <div className="composer-preview">
        <p className="label-text" style={{ position: 'absolute', top: '20px', left: '20px' }}>LIVE PREVIEW</p>
        
        {/* The Paper */}
        <div className="paper-preview" style={{ background: currentTheme.bg, color: currentTheme.color }}>
          <div style={{ borderBottom: `1px solid ${currentTheme.color}40`, paddingBottom: '15px', marginBottom: '20px' }}>
             <span style={{ fontFamily: currentTheme.font, fontSize: '14px', opacity: 0.7 }}>
               {unlockDate ? `Opens on: ${unlockDate}` : 'Open immediately'}
             </span>
          </div>

          <div className="handwritten-text" style={{ fontFamily: currentTheme.font }}>
             {message || "(Your letter content will appear here...)"}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '30px', textAlign: 'right', fontFamily: currentTheme.font }}>
            <p style={{ margin: 0, opacity: 0.6, fontSize: '14px' }}>Sincerely,</p>
            <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: 'bold' }}>{sender || "..."}</p>
          </div>
        </div>
      </div>

    </div>
  )
}