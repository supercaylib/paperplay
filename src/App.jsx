import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Scan from './Scan'
import Admin from './Admin'
import RequestForm from './RequestForm'
import ComposeLetter from './ComposeLetter'
import ViewLetter from './ViewLetter'

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/request" element={<RequestForm />} />
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

    // 1. Check PHYSICAL Orders
    let { data, error } = await supabase
      .from('letter_requests')
      .select('status')
      .eq('ticket_code', ticketInput.toUpperCase())
      .single()

    if (data) {
      setLoading(false)
      setOrderStatus(data.status)
      return
    }

    // 2. Check DIGITAL Letters
    let { data: digitalData } = await supabase
      .from('digital_letters')
      .select('ticket_code')
      .eq('ticket_code', ticketInput.toUpperCase())
      .single()
      
    setLoading(false)

    if (digitalData) {
      navigate(`/view/${digitalData.ticket_code}`)
    } else {
      setOrderStatus('NotFound')
    }
  }

  return (
    <div style={styles.pageBackground}>
      <div style={styles.card}>
        
        {/* LOGO AREA */}
        <div style={{marginBottom: '30px'}}>
          <img src="/logo.png" alt="Logo" style={styles.logoImage} />
          <h1 style={styles.title}>PaperPlay</h1>
          <p style={styles.subtitle}>Digital Memories on Paper</p>
        </div>

        {/* TRACKING SECTION */}
        <div style={styles.section}>
          <label style={styles.label}>TRACK / VIEW</label>
          <div style={styles.inputGroup}>
            <div style={styles.iconContainer}>
              {/* SEARCH ICON */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
              type="text" 
              placeholder="Enter Ticket Code" 
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
              style={styles.input}
            />
            <button onClick={checkTicket} style={styles.arrowBtn} disabled={loading}>
              →
            </button>
          </div>

          {/* STATUS MESSAGES */}
          {orderStatus === 'Pending' && <div style={styles.statusInfo}>⏳ Order Pending</div>}
          {orderStatus === 'Done' && <div style={styles.statusSuccess}>✅ Ready for Pickup/Delivery</div>}
          {orderStatus === 'NotFound' && <div style={styles.statusError}>🚫 Invalid Ticket Code</div>}
        </div>

        <hr style={styles.divider} />

        {/* SERVICES SECTION */}
        <div style={styles.section}>
          <label style={styles.label}>SERVICES</label>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            
            {/* BUTTON 1: REQUEST PHYSICAL */}
            <a href="/request" style={{ textDecoration: 'none' }}>
              <button style={styles.actionBtnOutline}>
                {/* PEN ICON */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
                <span>Request Letter Service</span>
              </button>
            </a>

            {/* BUTTON 2: CREATE DIGITAL */}
            <a href="/create" style={{ textDecoration: 'none' }}>
              <button style={styles.actionBtnSolid}>
                {/* MAIL ICON */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span>Create Digital Letter</span>
              </button>
            </a>

          </div>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <p style={styles.footerText}>Caleb R. Pule</p>
        </div>

      </div>
    </div>
  )
}

// --- PROFESSIONAL STYLES ---
const styles = {
  pageBackground: {
    minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
    background: '#f5f5f7', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    background: 'white', padding: '40px 30px', borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.05)', maxWidth: '380px', width: '100%', textAlign: 'center'
  },
  logoImage: { 
    width: '70px', height: '70px', borderRadius: '18px', objectFit: 'cover', 
    marginBottom: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
  },
  title: { 
    margin: '0', color: '#1a1a1a', fontSize: '28px', letterSpacing: '-0.5px', fontWeight: '700' 
  },
  subtitle: { 
    margin: '5px 0 0 0', color: '#888', fontSize: '14px', fontWeight: '500' 
  },
  
  section: { textAlign: 'left', marginBottom: '10px' },
  label: { 
    fontSize: '11px', fontWeight: '700', color: '#b2bec3', 
    letterSpacing: '1.5px', marginBottom: '10px', display: 'block', textTransform: 'uppercase' 
  },
  
  // SEARCH INPUT STYLING
  inputGroup: {
    display: 'flex', alignItems: 'center', background: '#f9f9f9', 
    border: '1px solid #eee', borderRadius: '12px', padding: '5px',
    transition: 'border 0.2s'
  },
  iconContainer: { padding: '0 10px', display: 'flex', alignItems: 'center', opacity: 0.5 },
  input: {
    border: 'none', background: 'transparent', width: '100%', padding: '10px 0',
    outline: 'none', fontSize: '15px', color: '#333'
  },
  arrowBtn: {
    background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '8px',
    width: '36px', height: '36px', cursor: 'pointer', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', fontSize: '16px'
  },

  // STATUS BOXES
  statusInfo: { marginTop:'10px', fontSize:'13px', color:'#d35400', background:'#fff8e1', padding:'10px', borderRadius:'8px', textAlign:'center' },
  statusSuccess: { marginTop:'10px', fontSize:'13px', color:'#006266', background:'#e0f2f1', padding:'10px', borderRadius:'8px', textAlign:'center' },
  statusError: { marginTop:'10px', fontSize:'13px', color:'#c0392b', background:'#ffebee', padding:'10px', borderRadius:'8px', textAlign:'center' },

  divider: { border: 'none', borderTop: '1px solid #f0f0f0', margin: '30px 0' },

  // BUTTONS
  actionBtnOutline: {
    width: '100%', padding: '14px', borderRadius: '12px', cursor: 'pointer',
    background: 'white', border: '1px solid #e0e0e0', color: '#333',
    fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', gap: '10px', transition: 'all 0.2s'
  },
  actionBtnSolid: {
    width: '100%', padding: '14px', borderRadius: '12px', cursor: 'pointer',
    background: '#1a1a1a', border: 'none', color: 'white',
    fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },

  footer: { marginTop: '40px' },
  footerText: { margin: 0, fontSize: '12px', color: '#ccc', fontWeight: '500' }
}

export default App