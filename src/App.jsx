import { Routes, Route } from 'react-router-dom'
import Scan from './Scan'
import Admin from './Admin'

function App() {
  return (
    <div>
      <Routes>
        
        {/* 1. LANDING PAGE (Your Digital Business Card) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* 2. ADMIN DASHBOARD */}
        <Route path="/admin" element={<Admin />} />

        {/* 3. SCANNER (Must be last to catch IDs) */}
        <Route path="/:id" element={<Scan />} />
        
      </Routes>
    </div>
  )
}

// --- NEW COMPONENT: The Aesthetic Front Page ---
function LandingPage() {
  return (
    <div style={styles.pageBackground}>
      <div style={styles.card}>
        
        {/* LOGO / ICON */}
        <div style={styles.iconWrapper}>
          🎥
        </div>
        
        <h1 style={styles.title}>PaperPlay</h1>
        <p style={styles.subtitle}>Digital Memories on Paper</p>
        
        <hr style={styles.divider} />

        {/* THE NOTE */}
        <div style={styles.noteBox}>
          <p style={styles.noteText}>
            "may ilalagay akong notes dito wait lang haha"
          </p>
        </div>

        {/* CONTACT SECTION */}
        <div style={styles.contactSection}>
          <p style={styles.contactLabel}>Get your stickers:</p>
          
          <div style={styles.socialLinks}>
            {/* Facebook Button */}
            <a 
              href="https://facebook.com/calebragx" 
              target="_blank" 
              rel="noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <button style={{...styles.socialBtn, background: '#1877F2'}}>
                <span style={{ marginRight: '10px', fontSize: '18px' }}>📘</span> Caleb Ragx
              </button>
            </a>

            {/* Instagram Button */}
            <a 
              href="https://instagram.com/ragx_ig" 
              target="_blank" 
              rel="noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <button style={{...styles.socialBtn, background: 'linear-gradient(45deg, #405DE6, #833AB4, #C13584)'}}>
                <span style={{ marginRight: '10px', fontSize: '18px' }}>📸</span> ragx_ig
              </button>
            </a>
          </div>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <p style={{ margin: 0, fontSize: '11px', color: '#b2bec3', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Created by
          </p>
          <h3 style={styles.creatorName}>Caleb R. Pule</h3>
        </div>

      </div>
    </div>
  )
}

// --- STYLES ---
const styles = {
  pageBackground: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', // Soft gray-blue gradient
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '40px 30px',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
  },
  iconWrapper: {
    fontSize: '40px',
    background: '#f1f2f6',
    width: '80px',
    height: '80px',
    lineHeight: '80px',
    borderRadius: '50%',
    margin: '0 auto 20px',
    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)'
  },
  title: {
    margin: '0',
    color: '#2d3436',
    fontSize: '32px',
    letterSpacing: '-1px',
    fontWeight: '800',
  },
  subtitle: {
    margin: '5px 0 0 0',
    color: '#b2bec3',
    fontSize: '14px',
    fontWeight: '500',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #eee',
    margin: '25px 0',
  },
  noteBox: {
    background: '#fff3cd', // Soft yellow note color
    color: '#856404',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '30px',
    borderLeft: '4px solid #ffeeba',
  },
  noteText: {
    margin: 0,
    fontStyle: 'italic',
    fontSize: '14px',
  },
  contactSection: {
    marginBottom: '30px',
  },
  contactLabel: {
    fontWeight: '700',
    color: '#2d3436',
    margin: '0 0 15px 0',
    fontSize: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  socialLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  socialBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '15px',
    width: '100%',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  footer: {
    marginTop: '40px',
    borderTop: '1px dashed #e0e0e0',
    paddingTop: '20px',
  },
  creatorName: {
    margin: '5px 0 0 0',
    color: '#2d3436',
    fontSize: '16px',
    fontWeight: '700',
  }
}

export default App