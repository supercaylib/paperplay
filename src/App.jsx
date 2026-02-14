import { useState } from 'react'
import { Routes, Route, useNavigate, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Scan from './Scan'
import Admin from './Admin'
import ComposeLetter from './ComposeLetter'
import ViewLetter from './ViewLetter'


function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<ComposeLetter />} />
        <Route path="/view/:ticket" element={<ViewLetter />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/:id" element={<Scan />} />
      </Routes>
    </div>
  )
}

function LandingPage() {
  const navigate = useNavigate()
  
  // TRACKING STATE
  const [ticketInput, setTicketInput] = useState('')
  const [orderStatus, setOrderStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  async function checkTicket() {
    if (!ticketInput) return
    setLoading(true)
    setOrderStatus(null)
    
    const code = ticketInput.toUpperCase().trim()
    // 2. Check DIGITAL Letter
    let { data: digitalData } = await supabase
      .from('digital_letters')
      .select('ticket_code')
      .eq('ticket_code', code)
      .single()
      
    setLoading(false)

    if (digitalData) {
      navigate(`/view/${code}`)
    } else {
      setOrderStatus('NotFound')
    }
  }

  return (
    // We use the CSS class 'app-container' to handle the responsive box
    <div className="app-container">
      
      <div className="center-text" style={{marginBottom: '30px'}}>
        <img src="/logo.png" alt="Logo" className="logo-img" />
        <h1>PaperPlay</h1>
        <p className="subtitle">The Greatest Letter Maker Online</p>
      </div>

      {/* SMART TRACKING SECTION */}
      <div className="section">
        <label className="label-text">ENTER TICKET CODE</label>
        <div className="input-group">
          <div className="icon-container">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input 
            type="text" 
            placeholder="e.g. A1B2C3" 
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
            className="main-input"
          />
          <button onClick={checkTicket} className="arrow-btn" disabled={loading}>
            {loading ? '...' : '→'}
          </button>
        </div>

        {orderStatus === 'NotFound' && (
          <div className="status-error">
            🚫 <strong>Ticket Not Found</strong><br/>
            Check if you typed it correctly.
          </div>
        )}
      </div>

      <hr className="divider" />

      {/* SERVICES SECTION */}
      <div className="section">
        <label className="label-text">CREATE NEW</label>
        
        <div className="button-grid">
          
          {/* DIGITAL LETTER */}
          <Link to="/create">
            <button className="action-btn btn-solid">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <span>Create Digital Letter</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="footer">
        <p>RAGX Production</p>
      </div>

    </div>
  )
}

export default App