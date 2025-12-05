import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Scan from './Scan'
import Admin from './Admin'
import RequestForm from './RequestForm'
import ComposeLetter from './ComposeLetter'
import ViewLetter from './ViewLetter' // <--- IMPORT THE NEW PAGE

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/request" element={<RequestForm />} />
        <Route path="/create" element={<ComposeLetter />} />
        <Route path="/view/:ticket" element={<ViewLetter />} /> {/* <--- ADD ROUTE */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/:id" element={<Scan />} />
      </Routes>
    </div>
  )
}

function LandingPage() {
  const navigate = useNavigate()
  
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
      // NAVIGATE TO THE VIEWER!
      navigate(`/view/${digitalData.ticket_code}`)
    } else {
      setOrderStatus('NotFound')
    }
  }

  return (
    <div style={styles.pageBackground}>
      <div style={styles.card}>
        <img src="/logo.png" alt="Logo" style={styles.logoImage} />
        <h1 style={styles.title}>PaperPlay</h1>
        <p style={styles.subtitle}>Digital Memories on Paper</p>
        <hr style={styles.divider} />
        <div style={styles.noteBox}><p style={styles.noteText}>"may ilalagay akong notes dito wait lang haha"</p></div>

        {/* TRACKING SECTION */}
        <div style={styles.trackSection}>
          <p style={styles.sectionTitle}>📦 Track / View Letter</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="Enter Ticket (e.g. A1B2C3)" value={ticketInput} onChange={(e) => setTicketInput(e.target.value.toUpperCase())} style={styles.trackInput} />
            <button onClick={checkTicket} style={styles.trackBtn} disabled={loading}>{loading ? '...' : '🔍'}</button>
          </div>
          {orderStatus === 'Pending' && <div style={{...styles.statusBox, background: '#ffeaa7', color: '#d35400'}}>⏳ <strong>Order Pending</strong><br/>We are crafting your letter!</div>}
          {orderStatus === 'Done' && <div style={{...styles.statusBox, background: '#55efc4', color: '#006266'}}>✅ <strong>Ready!</strong><br/>Check your inbox/messages.</div>}
          {orderStatus === 'NotFound' && <div style={{...styles.statusBox, background: '#ff7675', color: 'white'}}>🚫 <strong>Not Found</strong><br/>Check your code again.</div>}
        </div>

        {/* ACTIONS */}
        <div style={styles.contactSection}>
          <h3 style={{ fontSize: '14px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Services</h3>
          <a href="/request" style={{ textDecoration: 'none' }}><button style={styles.requestBtn}>✍️ Request Physical Letter</button></a>
          <a href="/create" style={{ textDecoration: 'none' }}><button style={{...styles.requestBtn, background: 'white', color: '#2d3436', border: '2px solid #2d3436', marginTop: '10px'}}>💌 Make Digital Letter</button></a>
          
          <p style={{ marginTop: '20px', fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Socials:</p>
          <div style={styles.socialLinks}>
            <a href="https://facebook.com/calebragx" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <button style={{...styles.socialBtn, background: '#1877F2'}}><svg viewBox="0 0 24 24" width="24" height="24" style={{ marginRight: '10px', fill: 'white' }}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Caleb Ragx</button>
            </a>
            <a href="https://instagram.com/ragx_ig" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <button style={{...styles.socialBtn, background: 'linear-gradient(45deg, #405DE6, #833AB4, #C13584)'}}><svg viewBox="0 0 24 24" width="24" height="24" style={{ marginRight: '10px', fill: 'white' }}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069-3.204 0-3.584-.012-4.849-.069-3.225-.149-4.771-1.664-4.919-4.919-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.073-4.947-.2-4.356-2.623-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> ragx_ig</button>
            </a>
          </div>
        </div>

        <div style={styles.footer}>
          <p style={{ margin: 0, fontSize: '11px', color: '#b2bec3', letterSpacing: '1px', textTransform: 'uppercase' }}>Created by</p>
          <h3 style={styles.creatorName}>Caleb R. Pule</h3>
        </div>
      </div>
    </div>
  )
}

const styles = {
  pageBackground: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', padding: '20px', fontFamily: 'sans-serif' },
  card: { background: 'rgba(255, 255, 255, 0.95)', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', maxWidth: '400px', width: '100%', textAlign: 'center' },
  logoImage: { width: '80px', height: '80px', borderRadius: '20px', objectFit: 'cover', margin: '0 auto 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
  title: { margin: '0', color: '#2d3436', fontSize: '32px', letterSpacing: '-1px', fontWeight: '800' },
  subtitle: { margin: '5px 0 0 0', color: '#b2bec3', fontSize: '14px', fontWeight: '500' },
  divider: { border: 'none', borderTop: '1px solid #eee', margin: '25px 0' },
  noteBox: { background: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '12px', marginBottom: '20px', borderLeft: '4px solid #ffeeba' },
  noteText: { margin: 0, fontStyle: 'italic', fontSize: '14px' },
  trackSection: { background: '#f8f9fa', padding: '15px', borderRadius: '15px', marginBottom: '30px', textAlign: 'left' },
  sectionTitle: { fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#aaa', margin: '0 0 10px 0' },
  trackInput: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '14px' },
  trackBtn: { background: '#2d3436', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px', cursor: 'pointer', fontSize: '18px' },
  statusBox: { marginTop: '10px', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center' },
  contactSection: { marginBottom: '30px' },
  requestBtn: { background: 'black', color: 'white', padding: '16px', width: '100%', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', border: 'none' },
  socialLinks: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' },
  socialBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '600', fontSize: '15px', width: '100%', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  footer: { marginTop: '40px', borderTop: '1px dashed #e0e0e0', paddingTop: '20px' },
  creatorName: { margin: '5px 0 0 0', color: '#2d3436', fontSize: '16px', fontWeight: '700' }
}

export default App