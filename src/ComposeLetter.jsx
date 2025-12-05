import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import QRCode from 'react-qr-code'

export default function ComposeLetter() {
  const navigate = useNavigate()
  
  // WIZARD STATE
  const [step, setStep] = useState(1) 
  const [loading, setLoading] = useState(false)

  // FORM DATA
  const [withQr, setWithQr] = useState(false) // Step 1
  const [theme, setTheme] = useState('classic') // Step 2
  const [sender, setSender] = useState('') // Step 3
  const [unlockDate, setUnlockDate] = useState('') // Step 3
  const [message, setMessage] = useState('') // Step 4
  
  // RESULT
  const [ticket, setTicket] = useState(null)

  // THEMES
  const themes = [
    { id: 'classic', label: '📜 Classic', bg: '#fdf6e3', color: '#5b4636' },
    { id: 'love', label: '💖 Love', bg: '#ffe6e6', color: '#d63031' },
    { id: 'christmas', label: '🎄 Holiday', bg: '#d1f2eb', color: '#006266' },
    { id: 'simple', label: '✨ Minimal', bg: '#ffffff', color: '#2d3436' }
  ]

  async function handlePublish() {
    if (!message || !sender) return alert('Please fill in all fields.')
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
      setStep(5) // Success Screen
    }
  }

  // --- STYLES HELPER ---
  const currentTheme = themes.find(t => t.id === theme) || themes[0]

  return (
    <div style={{ ...styles.page, background: '#f0f2f5' }}>
      
      <div style={{ ...styles.card, maxWidth: '500px' }}>
        
        {/* HEADER (Except on success) */}
        {step < 5 && (
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <button onClick={() => step === 1 ? navigate('/') : setStep(step - 1)} style={styles.backBtn}>← Back</button>
             <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ccc' }}>STEP {step} OF 4</span>
          </div>
        )}

        {/* --- STEP 1: MODE SELECTION --- */}
        {step === 1 && (
          <div style={styles.fade}>
            <h2 style={styles.heading}>Create a Letter ✍️</h2>
            <p style={styles.subtext}>How should this letter be delivered?</p>

            <button onClick={() => { setWithQr(false); setStep(2) }} style={styles.optionBtn}>
              <span style={{ fontSize: '24px' }}>🎟️</span>
              <div style={{ textAlign: 'left' }}>
                <strong>Digital Ticket Only</strong>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>Receiver enters a code to read it.</div>
              </div>
            </button>

            <button onClick={() => { setWithQr(true); setStep(2) }} style={{...styles.optionBtn, marginTop: '15px'}}>
              <span style={{ fontSize: '24px' }}>🔳</span>
              <div style={{ textAlign: 'left' }}>
                <strong>With QR Code</strong>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>Generate a QR they can scan.</div>
              </div>
            </button>
          </div>
        )}

        {/* --- STEP 2: THEME SELECTION --- */}
        {step === 2 && (
          <div style={styles.fade}>
            <h2 style={styles.heading}>Pick a Vibe 🎨</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
              {themes.map(t => (
                <button 
                  key={t.id}
                  onClick={() => { setTheme(t.id); setStep(3) }}
                  style={{
                    ...styles.themeBtn,
                    background: t.bg,
                    color: t.color,
                    border: theme === t.id ? '2px solid black' : '1px solid #eee'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- STEP 3: DETAILS (Name & Date) --- */}
        {step === 3 && (
          <div style={styles.fade}>
            <h2 style={styles.heading}>The Details 📅</h2>
            
            <label style={styles.label}>Sender Name (You)</label>
            <input 
              type="text" 
              placeholder="e.g. Secret Admirer" 
              value={sender} 
              onChange={e => setSender(e.target.value)} 
              style={styles.input}
            />

            <label style={styles.label}>Open Date (Optional)</label>
            <p style={{ fontSize: '11px', color: '#999', marginBottom: '5px' }}>
              If set, the letter will be 🔒 LOCKED until this date.
            </p>
            <input 
              type="date" 
              value={unlockDate} 
              onChange={e => setUnlockDate(e.target.value)} 
              style={styles.input}
            />

            <button onClick={() => setStep(4)} style={styles.nextBtn}>Next →</button>
          </div>
        )}

        {/* --- STEP 4: WRITE MESSAGE --- */}
        {step === 4 && (
          <div style={styles.fade}>
            <h2 style={styles.heading}>Write your Heart out 🖋️</h2>
            <div style={{ 
              background: currentTheme.bg, 
              padding: '20px', 
              borderRadius: '15px', 
              minHeight: '200px',
              border: '1px solid #eee'
            }}>
              <textarea 
                placeholder="Dear..." 
                value={message} 
                onChange={e => setMessage(e.target.value)}
                style={{ 
                  width: '100%', 
                  height: '200px', 
                  background: 'transparent', 
                  border: 'none', 
                  outline: 'none', 
                  fontSize: '16px', 
                  fontFamily: 'cursive',
                  color: currentTheme.color
                }}
              />
            </div>
            
            <button onClick={handlePublish} disabled={loading} style={styles.nextBtn}>
              {loading ? 'Publishing...' : '🚀 Publish Letter'}
            </button>
          </div>
        )}

        {/* --- STEP 5: SUCCESS --- */}
        {step === 5 && (
          <div style={styles.fade}>
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎉</div>
            <h2 style={styles.heading}>Letter Created!</h2>
            <p style={styles.subtext}>Share this ticket with the receiver.</p>
            
            <div style={styles.ticketBox}>
              <p style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', color: '#888' }}>Access Ticket</p>
              <h1 style={{ margin: '5px 0', letterSpacing: '4px', color: '#2d3436', fontSize: '32px' }}>{ticket}</h1>
            </div>

            {withQr && (
              <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '15px', border: '1px dashed #ccc', display: 'inline-block' }}>
                <QRCode value={`https://paperplay-nu.vercel.app/view/${ticket}`} size={120} />
                <p style={{ fontSize: '10px', color: '#999', margin: '5px 0 0' }}>Scan to Open</p>
              </div>
            )}

            <p style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
              They can enter the code <strong>{ticket}</strong> on the home page to view it.
            </p>

            <button onClick={() => navigate('/')} style={{ ...styles.nextBtn, background: 'black', marginTop: '20px' }}>
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: 'sans-serif' },
  card: { background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', width: '100%' },
  heading: { margin: '0 0 10px 0', color: '#2d3436', fontSize: '24px' },
  subtext: { margin: '0 0 25px 0', color: '#b2bec3', fontSize: '14px' },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '14px' },
  optionBtn: { display: 'flex', alignItems: 'center', gap: '15px', width: '100%', padding: '15px', background: '#f8f9fa', border: '1px solid #eee', borderRadius: '12px', cursor: 'pointer', transition: '0.2s' },
  themeBtn: { padding: '20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '5px', marginTop: '15px', textAlign: 'left' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '15px', background: '#f9f9f9' },
  nextBtn: { width: '100%', padding: '15px', marginTop: '20px', background: '#0984e3', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  ticketBox: { background: '#f1f2f6', padding: '20px', borderRadius: '15px', border: '2px dashed #ccc', marginTop: '10px' },
  fade: { animation: 'fadeIn 0.3s ease-in-out' }
}