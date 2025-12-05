import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Confetti from 'react-confetti'

export default function ViewLetter() {
  const { ticket } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [letter, setLetter] = useState(null)
  const [error, setError] = useState(false)
  const [isOpen, setIsOpen] = useState(false) // Controls the animation

  useEffect(() => { fetchLetter() }, [ticket])

  async function fetchLetter() {
    const { data, error } = await supabase
      .from('digital_letters')
      .select('*')
      .eq('ticket_code', ticket)
      .single()

    setLoading(false)
    if (error || !data) setError(true)
    else setLetter(data)
  }

  // LOGIC: Is it locked?
  const isLocked = letter?.unlock_at && new Date() < new Date(letter.unlock_at)
  
  // COUNTDOWN MATH
  const timeLeft = letter?.unlock_at ? new Date(letter.unlock_at) - new Date() : 0
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60)

  // THEME STYLES
  const themes = {
    classic: { bg: '#fdf6e3', text: '#5b4636', font: '"Times New Roman", serif', border: '4px double #d4c5a9' },
    love:    { bg: '#fff0f3', text: '#c0392b', font: 'cursive', border: '2px solid #ff7675' },
    christmas: { bg: '#d1f2eb', text: '#006266', font: 'serif', border: '2px dashed #16a085' },
    simple:  { bg: '#ffffff', text: '#2d3436', font: 'sans-serif', border: '1px solid #ddd' }
  }
  
  const activeTheme = letter ? themes[letter.theme] || themes.classic : themes.classic

  if (loading) return <div style={styles.center}><h2>Checking Ticket... 🎟️</h2></div>
  
  if (error) return (
    <div style={styles.center}>
      <h1>🚫</h1>
      <h2>Letter Not Found</h2>
      <button onClick={() => navigate('/')} style={styles.btn}>Go Home</button>
    </div>
  )

  // --- VIEW 1: LOCKED (Countdown) ---
  if (isLocked) {
    return (
      <div style={styles.center}>
        <h1 style={{fontSize:'60px', margin:0}}>🔒</h1>
        <h2 style={{color: '#333'}}>Do Not Open Until...</h2>
        <p style={{fontSize:'18px', color:'#d63031', fontWeight:'bold'}}>
          {new Date(letter.unlock_at).toDateString()}
        </p>
        
        <div style={styles.countdownBox}>
          <div style={styles.timeUnit}><h1>{days}</h1><small>DAYS</small></div>
          <div style={styles.timeUnit}><h1>{hours}</h1><small>HRS</small></div>
          <div style={styles.timeUnit}><h1>{minutes}</h1><small>MINS</small></div>
        </div>
        <p style={{color:'#777', marginTop:'20px'}}>Excited yarn? ✨</p>
      </div>
    )
  }

  // --- VIEW 2: UNLOCKED (The Letter) ---
  return (
    <div style={styles.center}>
      {isOpen && letter.theme === 'love' && <Confetti numberOfPieces={100} colors={['#ff7675', '#fd79a8']} />}
      {isOpen && letter.theme === 'christmas' && <Confetti numberOfPieces={100} colors={['#00b894', '#d63031']} />}

      {!isOpen ? (
        // ENVELOPE CLOSED STATE
        <div style={styles.envelopeWrapper} onClick={() => setIsOpen(true)}>
          <div style={styles.envelope}>
            <div style={styles.seal}>💌</div>
            <p style={{marginTop:'80px', fontWeight:'bold', color:'#555'}}>From: {letter.sender_name}</p>
            <p style={{fontSize:'12px', color:'#999'}}>(Tap to Open)</p>
          </div>
        </div>
      ) : (
        // LETTER OPEN STATE
        <div style={styles.letterWrapper}>
          <div style={{
            ...styles.letterPaper,
            background: activeTheme.bg,
            color: activeTheme.text,
            fontFamily: activeTheme.font,
            border: activeTheme.border
          }}>
            <p style={{textAlign:'right', fontSize:'12px', opacity:0.6}}>{new Date(letter.created_at).toLocaleDateString()}</p>
            
            <h2 style={{marginBottom:'30px'}}>Dear Receiver,</h2>
            
            <p style={{whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '18px'}}>
              {letter.message_body}
            </p>

            <p style={{marginTop:'50px', textAlign:'right', fontWeight:'bold'}}>
              Sincerely,<br/>
              {letter.sender_name}
            </p>
          </div>

          <button onClick={() => navigate('/')} style={styles.closeBtn}>Close Letter</button>
        </div>
      )}
    </div>
  )
}

const styles = {
  center: { minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#e0e5ec', padding: '20px', fontFamily: 'sans-serif' },
  btn: { padding: '10px 20px', background: 'black', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' },
  
  countdownBox: { display: 'flex', gap: '20px', background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginTop: '20px' },
  timeUnit: { textAlign: 'center', minWidth: '60px' },

  // ENVELOPE ANIMATION STYLES
  envelopeWrapper: { cursor: 'pointer', perspective: '1000px' },
  envelope: { 
    width: '300px', height: '200px', background: '#fff', borderRadius: '10px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
    border: '2px solid #ddd'
  },
  seal: { fontSize: '50px', position: 'absolute', top: '-25px', background: '#f0f2f5', borderRadius: '50%', padding: '5px' },

  // LETTER PAPER STYLES
  letterWrapper: { width: '100%', maxWidth: '600px', animation: 'slideUp 0.8s ease' },
  letterPaper: { 
    padding: '40px', borderRadius: '5px', 
    boxShadow: '0 5px 30px rgba(0,0,0,0.15)', minHeight: '400px'
  },
  closeBtn: { marginTop: '30px', background: 'transparent', border: '1px solid #aaa', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', color: '#555' }
}