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
    { id: 'classic', label: 'Classic', bg: '#fdf6e3', color: '#5b4636', font: 'serif' },
    { id: 'love', label: 'Romance', bg: '#fff0f3', color: '#c0392b', font: 'cursive' },
    { id: 'christmas', label: 'Holiday', bg: '#d1f2eb', color: '#006266', font: 'serif' },
    { id: 'simple', label: 'Minimal', bg: '#ffffff', color: '#2d3436', font: 'sans-serif' }
  ]

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

  const currentTheme = themes.find(t => t.id === theme) || themes[0]

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        
        {/* HEADER */}
        <div style={styles.header}>
          {step > 1 && step < 5 ? (
            <button onClick={() => setStep(step - 1)} style={styles.backBtn}>← Back</button>
          ) : (
            <button onClick={() => navigate('/')} style={styles.backBtn}>✕ Close</button>
          )}
          <span style={styles.stepIndicator}>{step < 5 ? `STEP ${step} / 4` : 'DONE'}</span>
        </div>

        {/* --- STEP 1: DELIVERY METHOD --- */}
        {step === 1 && (
          <div style={styles.fade}>
            <h2 style={styles.title}>Delivery Method</h2>
            <p style={styles.subtitle}>How will they receive this letter?</p>

            <div style={styles.grid}>
              <button onClick={() => { setWithQr(false); setStep(2) }} style={styles.selectionCard}>
                <div style={styles.iconCircle}>🎟️</div>
                <div style={{textAlign:'left'}}>
                  <h3 style={styles.cardTitle}>Digital Ticket</h3>
                  <p style={styles.cardDesc}>They enter a code to open it.</p>
                </div>
              </button>

              <button onClick={() => { setWithQr(true); setStep(2) }} style={styles.selectionCard}>
                <div style={styles.iconCircle}>🔳</div>
                <div style={{textAlign:'left'}}>
                  <h3 style={styles.cardTitle}>QR Sticker</h3>
                  <p style={styles.cardDesc}>Generate a printable QR code.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: THEME --- */}
        {step === 2 && (
          <div style={styles.fade}>
            <h2 style={styles.title}>Choose Aesthetic</h2>
            <p style={styles.subtitle}>Set the vibe for your letter.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {themes.map(t => (
                <button 
                  key={t.id}
                  onClick={() => { setTheme(t.id); setStep(3) }}
                  style={{
                    ...styles.themeCard,
                    background: t.bg,
                    color: t.color,
                    border: theme === t.id ? '2px solid #1a1a1a' : '1px solid rgba(0,0,0,0.1)'
                  }}
                >
                  <span style={{ fontFamily: t.font, fontSize: '18px' }}>Aa</span>
                  <span style={{ fontSize: '12px', marginTop: '5px' }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- STEP 3: DETAILS --- */}
        {step === 3 && (
          <div style={styles.fade}>
            <h2 style={styles.title}>The Details</h2>
            <p style={styles.subtitle}>Who is this from?</p>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Sender Name</label>
              <input 
                type="text" 
                placeholder="e.g. Your Name" 
                value={sender} 
                onChange={e => setSender(e.target.value)} 
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Unlock Date (Optional)</label>
              <input 
                type="date" 
                value={unlockDate} 
                onChange={e => setUnlockDate(e.target.value)} 
                style={styles.input}
              />
              <p style={styles.helperText}>Leave empty to unlock immediately.</p>
            </div>

            <button onClick={() => setStep(4)} style={styles.primaryBtn}>Next Step →</button>
          </div>
        )}

        {/* --- STEP 4: WRITE --- */}
        {step === 4 && (
          <div style={styles.fade}>
            <h2 style={styles.title}>Write Letter</h2>
            <p style={styles.subtitle}>Pour your heart out.</p>

            <div style={{ 
              background: currentTheme.bg, 
              padding: '20px', 
              borderRadius: '16px', 
              marginBottom: '20px',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <textarea 
                placeholder="Dear..." 
                value={message} 
                onChange={e => setMessage(e.target.value)}
                style={{ 
                  width: '100%', 
                  height: '250px', 
                  background: 'transparent', 
                  border: 'none', 
                  outline: 'none', 
                  fontSize: '16px', 
                  fontFamily: currentTheme.font,
                  color: currentTheme.color,
                  lineHeight: '1.6',
                  resize: 'none'
                }}
              />
            </div>
            
            <button onClick={handlePublish} disabled={loading} style={styles.primaryBtn}>
              {loading ? 'Publishing...' : 'Create Letter ✨'}
            </button>
          </div>
        )}

        {/* --- STEP 5: SUCCESS --- */}
        {step === 5 && (
          <div style={styles.fade}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={styles.successIcon}>✓</div>
              <h2 style={styles.title}>Letter Created</h2>
              <p style={styles.subtitle}>Your digital memory is ready.</p>
            </div>
            
            <div style={styles.ticketCard}>
              <p style={{ margin: 0, fontSize: '11px', color: '#888', letterSpacing: '1px' }}>ACCESS CODE</p>
              <h1 style={{ margin: '10px 0', fontSize: '36px', color: '#1a1a1a', letterSpacing: '2px', fontFamily: 'monospace' }}>
                {ticket}
              </h1>
              <p style={{ fontSize: '12px', color: '#aaa' }}>Share this code with the receiver.</p>
            </div>

            {withQr && (
              <div style={{ marginTop: '20px', textAlign: 'center', padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid #eee' }}>
                <QRCode value={`https://paperplay-nu.vercel.app/view/${ticket}`} size={140} />
                <p style={{ fontSize: '12px', color: '#ccc', margin: '10px 0 0' }}>Scan to Open</p>
              </div>
            )}

            <button onClick={() => navigate('/')} style={{ ...styles.primaryBtn, background: '#1a1a1a', marginTop: '25px' }}>
              Back to Home
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

// --- AESTHETIC STYLES ---
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f5f5f7',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    background: 'white',
    padding: '35px',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
    width: '100%',
    maxWidth: '450px',
    minHeight: '500px',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    padding: 0
  },
  stepIndicator: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#ccc',
    letterSpacing: '1px'
  },
  title: {
    margin: '0 0 8px 0',
    color: '#1a1a1a',
    fontSize: '26px',
    fontWeight: '700',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    margin: '0 0 30px 0',
    color: '#888',
    fontSize: '15px',
    fontWeight: '400'
  },
  grid: {
    display: 'grid',
    gap: '15px'
  },
  selectionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
    background: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
  },
  iconCircle: {
    width: '45px',
    height: '45px',
    background: '#f5f5f7',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px'
  },
  cardTitle: {
    margin: '0',
    fontSize: '16px',
    color: '#1a1a1a'
  },
  cardDesc: {
    margin: '3px 0 0 0',
    fontSize: '13px',
    color: '#888'
  },
  themeCard: {
    padding: '25px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    fontSize: '15px',
    background: '#fcfcfc',
    outline: 'none',
    color: '#333'
  },
  helperText: {
    fontSize: '12px',
    color: '#aaa',
    marginTop: '6px'
  },
  primaryBtn: {
    width: '100%',
    padding: '16px',
    background: '#1a1a1a',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: 'auto',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  },
  ticketCard: {
    background: '#f5f5f7',
    padding: '30px',
    borderRadius: '20px',
    textAlign: 'center',
    border: '1px dashed #ccc'
  },
  successIcon: {
    width: '60px',
    height: '60px',
    background: '#e0f2f1',
    color: '#006266',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '30px',
    margin: '0 auto 20px'
  },
  fade: { animation: 'fadeIn 0.4s ease-out' }
}