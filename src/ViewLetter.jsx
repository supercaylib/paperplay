import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

export default function ViewLetter() {
  const { ticket } = useParams()
  const navigate = useNavigate()

  // STATE
  const [letter, setLetter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  // INTERACTION STATE
  const [isLocked, setIsLocked] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // THEME DEFINITIONS
  const themes = {
    classic: { bg: '#fdf6e3', color: '#5b4636', font: '"Times New Roman", serif' },
    love: { bg: '#fff0f3', color: '#c0392b', font: 'Brush Script MT, cursive' },
    christmas: { bg: '#d1f2eb', color: '#006266', font: 'Georgia, serif' },
    simple: { bg: '#ffffff', color: '#2d3436', font: 'Arial, sans-serif' }
  }

  useEffect(() => {
    fetchLetter()
  }, [])

  async function fetchLetter() {
    const { data, error } = await supabase
      .from('digital_letters')
      .select('*')
      .eq('ticket_code', ticket)
      .single()

    if (error || !data) {
      setLoading(false)
      setError(true)
      return
    }

    setLetter(data)
    setLoading(false)

    if (data.unlock_at) {
      const unlockDate = new Date(data.unlock_at)
      const now = new Date()
      
      if (now < unlockDate) {
        setIsLocked(true)
        calculateTimeLeft(unlockDate)
        setInterval(() => calculateTimeLeft(unlockDate), 1000)
      }
    }
  }

  function calculateTimeLeft(targetDate) {
    const now = new Date()
    const diff = targetDate - now

    if (diff <= 0) {
      setIsLocked(false)
      return
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    setTimeLeft(`${days}d ${hours}h ${minutes}m`)
  }

  // --- THEME HELPERS ---
  const getThemeClass = (themeName) => {
    if (themeName === 'christmas') return 'theme-christmas'
    return ''
  }

  // FIX IS HERE: Don't use 'background' shorthand for Christmas!
  const getContainerStyle = (themeName, themeConfig) => {
    if (themeName === 'christmas') {
      // Return empty background so CSS class wins!
      return { color: '#2d3436' } 
    }
    return { background: themeConfig.bg, color: themeConfig.color }
  }

  // LOADING SCREEN
  if (loading) return (
    <div className="view-page-bg">
      <div style={{color:'white'}}>Fetching your letter...</div>
    </div>
  )

  // ERROR SCREEN
  if (error) return (
    <div className="view-page-bg">
      <div className="lock-screen">
        <h2>🚫 Letter Not Found</h2>
        <p>This ticket code is invalid or the letter was deleted.</p>
        <button onClick={() => navigate('/')} className="action-btn btn-outline" style={{marginTop:'20px'}}>Go Home</button>
      </div>
    </div>
  )

  const currentTheme = themes[letter.theme] || themes.classic

  // 1. LOCKED VIEW
  if (isLocked) return (
    <div className="view-page-bg">
      <div className="lock-screen">
        <div style={{fontSize:'40px', marginBottom:'10px'}}>🔒</div>
        <h2>Do Not Open Until...</h2>
        <p>This letter is time-locked by the sender.</p>
        <div className="countdown-box">{timeLeft}</div>
        <p style={{fontSize:'12px', opacity:0.7}}>Unlocks on: {new Date(letter.unlock_at).toLocaleDateString()}</p>
        <button onClick={() => navigate('/')} className="action-btn btn-outline" style={{marginTop:'20px'}}>Okay, I'll Wait</button>
      </div>
    </div>
  )

  // 2. ENVELOPE VIEW
  if (!isOpen) return (
    <div className="view-page-bg">
      <div className="envelope-wrapper">
        <div className="envelope-closed" onClick={() => setIsOpen(true)}>
          <div className="wax-seal">P</div>
          <h3>A Letter for You</h3>
          <p style={{fontSize:'14px', color:'#666', margin:'10px 0'}}>From: <strong>{letter.sender_name}</strong></p>
          <div style={{fontSize:'12px', color:'#999', marginTop:'20px'}}>Tap to Break Seal</div>
        </div>
      </div>
    </div>
  )

  // 3. THE LETTER
  return (
    <div className="view-page-bg">
      <div 
        className={`letter-container ${getThemeClass(letter.theme)}`} 
        style={getContainerStyle(letter.theme, currentTheme)}
      >
        
        {/* HEADER */}
        <div style={{ 
          borderBottom: letter.theme === 'christmas' ? 'none' : `1px solid ${currentTheme.color}40`, 
          paddingBottom: '20px', 
          marginBottom: '30px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.5, letterSpacing: '1px' }}>PAPERPLAY ARCHIVE</span>
          <span style={{ fontFamily: currentTheme.font, fontSize: '14px', opacity: 0.7 }}>
             {new Date(letter.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* BODY */}
        <div className="handwritten-text" style={{ fontFamily: letter.theme === 'christmas' ? 'inherit' : currentTheme.font }}>
           {letter.message_body}
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: '50px', textAlign: 'right', fontFamily: letter.theme === 'christmas' ? 'inherit' : currentTheme.font }}>
          <p style={{ margin: 0, opacity: 0.6, fontSize: '14px' }}>Sincerely,</p>
          <p style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: 'bold' }}>{letter.sender_name}</p>
        </div>

        {/* ACTION BAR */}
        <div className="action-bar" style={{ borderTop: letter.theme === 'christmas' ? 'none' : '1px dashed rgba(0,0,0,0.1)' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', opacity: 0.6, color: letter.theme === 'christmas' ? 'inherit' : currentTheme.color }}
          >
            ← Close Letter
          </button>

          <button 
            onClick={() => navigate('/create')}
            style={{ 
              background: letter.theme === 'christmas' ? '#2d3436' : currentTheme.color, 
              color: letter.theme === 'christmas' ? 'white' : currentTheme.bg, 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '20px', 
              fontSize: '12px', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            Reply with a Letter
          </button>
        </div>

      </div>
    </div>
  )
}