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
  
  // INTERACTION
  const [isLocked, setIsLocked] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isUnwrapping, setIsUnwrapping] = useState(false) // For ribbon animation

  const themes = {
    classic: { bg: '#fdf6e3', color: '#5b4636', font: '"Times New Roman", serif' },
    love: { bg: '#fff0f3', color: '#c0392b', font: 'Brush Script MT, cursive' },
    christmas: { bg: '#d1f2eb', color: '#006266', font: 'Georgia, serif' },
    newyear: { bg: '#fff3cd', color: '#d35400', font: 'Georgia, serif' },
    valentines: { bg: '#ffe3e3', color: '#c0392b', font: 'Brush Script MT, cursive' },
    thanksgiving: { bg: '#ffeaa7', color: '#e67e22', font: 'Georgia, serif' },
    easter: { bg: '#e0f7fa', color: '#00bcd4', font: 'Georgia, serif' },
    halloween: { bg: '#2d3436', color: '#fab1a0', font: 'Georgia, serif' },
    cny: { bg: '#ff7675', color: '#d63031', font: 'Georgia, serif' },
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
    if (diff <= 0) { setIsLocked(false); return }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    setTimeLeft(`${days}d ${hours}h ${minutes}m`)
  }

  // ANIMATION LOGIC
  const handleOpen = () => {
    setIsUnwrapping(true)
    setTimeout(() => {
      setIsOpen(true)
    }, 600) // Wait for ribbon animation
  }

  // WEATHER EFFECT COMPONENT
  const WeatherEffect = ({ type }) => {
    const particles = Array.from({ length: 20 }) // 20 particles
    if (type === 'snow') {
      return (
        <div className="weather-layer">
          {particles.map((_, i) => (
            <div key={i} className="snow-particle" style={{ left: `${Math.random() * 100}%`, animationDuration: `${3 + Math.random() * 5}s`, animationDelay: `${Math.random() * 5}s` }}>❄</div>
          ))}
        </div>
      )
    }
    if (type === 'hearts') {
      return (
        <div className="weather-layer">
          {particles.map((_, i) => (
            <div key={i} className="heart-particle" style={{ left: `${Math.random() * 100}%`, animationDuration: `${4 + Math.random() * 4}s`, animationDelay: `${Math.random() * 5}s` }}>❤️</div>
          ))}
        </div>
      )
    }
    return null
  }

  // Determine active weather
  const getWeather = () => {
    if (!letter) return null
    if (['christmas', 'newyear', 'cny'].includes(letter.theme)) return 'snow'
    if (['love', 'valentines'].includes(letter.theme)) return 'hearts'
    return null
  }

  if (loading) return <div className="view-page-bg"><div style={{color:'white'}}>Fetching...</div></div>
  if (error) return <div className="view-page-bg"><div className="lock-screen"><h2>🚫 Not Found</h2><button onClick={() => navigate('/')} className="action-btn btn-outline">Go Home</button></div></div>

  const currentTheme = themes[letter.theme] || themes.classic

  // LOCKED
  if (isLocked) return (
    <div className="view-page-bg">
      <div className="lock-screen">
        <div style={{fontSize:'40px', marginBottom:'10px'}}>🔒</div>
        <h2>Locked</h2>
        <div className="countdown-box">{timeLeft}</div>
        <p style={{fontSize:'12px', opacity:0.7}}>Opens on: {new Date(letter.unlock_at).toLocaleDateString()}</p>
        <button onClick={() => navigate('/')} className="action-btn btn-outline" style={{marginTop:'20px'}}>Wait</button>
      </div>
    </div>
  )

  // ENVELOPE (RIBBON) VIEW
  if (!isOpen) return (
    <div className="view-page-bg">
      {/* Background Animation */}
      <WeatherEffect type={getWeather()} />
      
      <div className={`envelope-wrapper`}>
        {/* NEW RIBBON UI */}
        <div 
          className={`ribbon-wrapper ${isUnwrapping ? 'unwrap-anim' : ''}`} 
          onClick={handleOpen}
        >
          <div className="ribbon-v"></div>
          <div className="ribbon-h"></div>
          <div className="ribbon-bow">OPEN</div>
          
          <div style={{position:'absolute', bottom:'20px', width:'100%', textAlign:'center', color:'#888', fontSize:'12px', fontWeight:'bold'}}>
            A Letter for You
          </div>
        </div>
      </div>
    </div>
  )

  // OPENED LETTER
  return (
    <div className="view-page-bg">
      <WeatherEffect type={getWeather()} />

      <div className="letter-container" style={{ background: currentTheme.bg, color: currentTheme.color }}>
        
        {/* HEADER */}
        <div style={{ borderBottom: `1px solid ${currentTheme.color}40`, paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.5, letterSpacing: '1px' }}>PAPERPLAY ARCHIVE</span>
          <span style={{ fontFamily: currentTheme.font, fontSize: '14px', opacity: 0.7 }}>
             {new Date(letter.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* BODY */}
        <div className="handwritten-text" style={{ fontFamily: currentTheme.font }}>
           {letter.message_body}
        </div>

        {/* POLAROID PHOTO ATTACHMENT */}
        {letter.photo_url && (
          <div className="polaroid-container">
             <img src={letter.photo_url} alt="Attached Memory" className="polaroid-img" />
             <div style={{textAlign:'center', marginTop:'10px', fontFamily:'cursive', color:'#555', fontSize:'12px'}}>
               A special memory
             </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ marginTop: '50px', textAlign: 'right', fontFamily: currentTheme.font }}>
          <p style={{ margin: 0, opacity: 0.6, fontSize: '14px' }}>Sincerely,</p>
          <p style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: 'bold' }}>{letter.sender_name}</p>
        </div>

        {/* ACTION BAR */}
        <div className="action-bar">
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', opacity: 0.6, color: currentTheme.color }}>
            ← Close Letter
          </button>
          <button onClick={() => navigate('/create')} style={{ background: currentTheme.color, color: currentTheme.bg, border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            Reply with a Letter
          </button>
        </div>

      </div>
    </div>
  )
}