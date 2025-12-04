import { Routes, Route } from 'react-router-dom'
import Scan from './Scan'
import Admin from './Admin'

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/:id" element={<Scan />} />
      </Routes>
    </div>
  )
}

function LandingPage() {
  return (
    <div style={styles.pageBackground}>
      <div style={styles.card}>
        
        {/* --- CUSTOM LOGO --- */}
        <img 
          src="/logo.png" 
          alt="PaperPlay Logo" 
          style={styles.logoImage} 
        />
        
        <h1 style={styles.title}>PaperPlay</h1>
        <p style={styles.subtitle}>Digital Capsule on Paper</p>
        
        <hr style={styles.divider} />

        <div style={styles.noteBox}>
          <p style={styles.noteText}>
            "may ilalagay akong notes dito wait lang haha"
          </p>
        </div>

        <div style={styles.contactSection}>
          <p style={styles.contactLabel}>Get your QR's:</p>
          
          <div style={styles.socialLinks}>
            
            {/* FACEBOOK BUTTON (Official Logo) */}
            <a href="https://facebook.com/calebragx" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <button style={{...styles.socialBtn, background: '#1877F2'}}>
                {/* SVG CODE FOR FACEBOOK LOGO */}
                <svg viewBox="0 0 24 24" width="24" height="24" style={{ marginRight: '10px', fill: 'white' }}>
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Caleb Ragx
              </button>
            </a>

            {/* INSTAGRAM BUTTON (Official Logo) */}
            <a href="https://instagram.com/ragx_ig" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <button style={{...styles.socialBtn, background: 'linear-gradient(45deg, #405DE6, #833AB4, #C13584)'}}>
                {/* SVG CODE FOR INSTAGRAM LOGO */}
                <svg viewBox="0 0 24 24" width="24" height="24" style={{ marginRight: '10px', fill: 'white' }}>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069-3.204 0-3.584-.012-4.849-.069-3.225-.149-4.771-1.664-4.919-4.919-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.073-4.947-.2-4.356-2.623-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                ragx_ig
              </button>
            </a>
          </div>
        </div>

        <div style={styles.footer}>
          <p style={{ margin: 0, fontSize: '11px', color: '#b2bec3', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Created by
          </p>
          <h3 style={styles.creatorName}>Starman</h3>
        </div>

      </div>
    </div>
  )
}

const styles = {
  pageBackground: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
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
  // NEW STYLE FOR YOUR LOGO
  logoImage: {
    width: '80px',
    height: '80px',
    borderRadius: '20px', // Slightly rounded corners (looks like an App Icon)
    objectFit: 'cover',
    margin: '0 auto 20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
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
    background: '#fff3cd',
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