import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Scan from './Scan'
import Admin from './Admin'
import RequestForm from './RequestForm'

function App() {
  return (
    <div>
      <Routes>
        {/* 1. LANDING PAGE with TRACKING */}
        <Route path="/" element={<LandingPage />} />
        
        {/* 2. REQUEST FORM */}
        <Route path="/request" element={<RequestForm />} />
        
        {/* 3. ADMIN DASHBOARD */}
        <Route path="/admin" element={<Admin />} />

        {/* 4. SCANNER */}
        <Route path="/:id" element={<Scan />} />
      </Routes>
    </div>
  )
}

// --- LANDING PAGE COMPONENT ---
function LandingPage() {
  // TRACKING STATE
  const [ticketInput, setTicketInput] = useState('')
  const [orderStatus, setOrderStatus] = useState(null) // null, 'Pending', 'Done', 'NotFound'
  const [loading, setLoading] = useState(false)

  async function checkTicket() {
    if (!ticketInput) return
    setLoading(true)
    setOrderStatus(null)

    const { data, error } = await supabase
      .from('letter_requests')
      .select('status')
      .eq('ticket_code', ticketInput.toUpperCase()) // Force uppercase matching
      .single()

    setLoading(false)

    if (error || !data) {
      setOrderStatus('NotFound')
    } else {
      setOrderStatus(data.status) // 'Pending' or 'Done'
    }
  }

  return (
    <div style={styles.pageBackground}>
      <div style={styles.card}>
        
        {/* LOGO */}
        <img src="/logo.png" alt="Logo" style={styles.logoImage} />
        
        <h1 style={styles.title}>PaperPlay</h1>
        <p style={styles.subtitle}>Digital Memories on Paper</p>
        
        <hr style={styles.divider} />

        {/* NOTE */}
        <div style={styles.noteBox}>
          <p style={styles.noteText}>
            "may ilalagay akong notes dito wait lang haha"
          </p>
        </div>

        {/* --- TRACKING SECTION (NEW) --- */}
        <div style={styles.trackSection}>
          <p style={styles.sectionTitle}>📦 Track your Letter</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Enter Ticket (e.g. A1B2C3)" 
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
              style={styles.trackInput}
            />
            <button onClick={checkTicket} style={styles.trackBtn} disabled={loading}>
              {loading ? '...' : '🔍'}
            </button>
          </div>

          {/* STATUS RESULT */}
          {orderStatus === 'Pending' && (
            <div style={{...styles.statusBox, background: '#ffeaa7', color: '#d35400'}}>
              ⏳ <strong>Order Pending</strong><br/>We are crafting your letter!
            </div>
          )}
          {orderStatus === 'Done' && (
            <div style={{...styles.statusBox, background: '#55efc4', color: '#006266'}}>
              ✅ <strong>Ready!</strong><br/>Check your inbox/messages.
            </div>
          )}
          {orderStatus === 'NotFound' && (
            <div style={{...styles.statusBox, background: '#ff7675', color: 'white'}}>
              🚫 <strong>Not Found</strong><br/>Check your code again.
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div style={styles.contactSection}>
          <a href="/request" style={{ textDecoration: 'none' }}>
            <button style={styles.requestBtn}>✍️ Request a Letter</button>
          </a>
          
          <p style={{ marginTop: '20px', fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Socials:</p>
          
          <div style={styles.socialLinks}>
            <a href="https://facebook.com/calebragx" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <button style={{...styles.socialBtn, background: '#1877F2'}}>
                <span style={{ marginRight: '10px' }}>📘</span> Caleb Ragx
              </button>
            </a>

            <a href="https://instagram.com/ragx_ig" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <button style={{...styles.socialBtn, background: 'linear-gradient(45deg, #405DE6, #833AB4, #C13584)'}}>
                <span style={{ marginRight: '10px' }}>📸</span> ragx_ig
              </button>
            </a>
          </div>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <p style={{ margin: 0, fontSize: '11px', color: '#b2bec3', letterSpacing: '1px', textTransform: 'uppercase' }}>Created by</p>
          <h3 style={styles.creatorName}>Caleb R. Pule</h3>
        </div>

      </div>
    </div>
  )
}

// STYLES
const styles = {
  pageBackground: {
    minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', padding: '20px', fontFamily: 'sans-serif'
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)', padding: '40px 30px', borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)', maxWidth: '400px', width: '100%', textAlign: 'center'
  },
  logoImage: { width: '80px', height: '80px', borderRadius: '20px', objectFit: 'cover', margin: '0 auto 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
  title: { margin: '0', color: '#2d3436', fontSize: '32px', letterSpacing: '-1px', fontWeight: '800' },
  subtitle: { margin: '5px 0 0 0', color: '#b2bec3', fontSize: '14px', fontWeight: '500' },
  divider: { border: 'none', borderTop: '1px solid #eee', margin: '25px 0' },
  noteBox: { background: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '12px', marginBottom: '20px', borderLeft: '4px solid #ffeeba' },
  noteText: { margin: 0, fontStyle: 'italic', fontSize: '14px' },
  
  // TRACKING STYLES
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