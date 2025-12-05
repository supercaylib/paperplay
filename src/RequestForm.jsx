import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function RequestForm() {
  const navigate = useNavigate()
  
  // STATES
  const [step, setStep] = useState(1) 
  const [loading, setLoading] = useState(false)
  
  // DATA
  const [category, setCategory] = useState('')
  const [letterType, setLetterType] = useState('')
  const [formData, setFormData] = useState({ name: '', contact: '' }) // Removed Age
  const [file, setFile] = useState(null)
  
  // GENERATED KEY
  const [ticketCode, setTicketCode] = useState(null)

  const options = {
    'Seasonal': ['Christmas', 'New Year', 'Valentine\'s'],
    'Personal': ['Birthday', 'Condolence', 'Miss You', 'Congratulations'],
    'Formal': ['Excuse Letter', 'Resignation', 'Application']
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    // 1. Generate Ticket Code (Used for BOTH tables)
    const generatedCode = `REQ-${Date.now().toString().slice(-6)}`
    
    let videoPublicUrl = null

    // 2. Upload Video (If selected)
    if (file) {
      const fileName = `${generatedCode}-${Date.now()}.mp4`
      const { error: upError } = await supabase.storage.from('videos').upload(fileName, file)
      if (!upError) {
        const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName)
        videoPublicUrl = urlData.publicUrl
      }
    }

    // 3. Create QR Code Entry (So Admin sees it available/used)
    const { error: qrError } = await supabase.from('qr_codes').insert({
      id: generatedCode,
      video_url: videoPublicUrl,
      unlock_at: null
    })

    if (qrError) {
      alert('System Error (QR): ' + qrError.message)
      setLoading(false)
      return
    }

    // 4. Create Letter Request Entry
    const { error: reqError } = await supabase.from('letter_requests').insert({
      customer_name: formData.name,
      contact_link: formData.contact,
      category: category,
      letter_type: letterType,
      ticket_code: generatedCode,
      status: 'Pending'
    })

    setLoading(false)

    if (reqError) {
      alert('System Error (Req): ' + reqError.message)
    } else {
      setTicketCode(generatedCode)
      setStep(4) // Success Step
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        
        {/* HEADER */}
        {step < 4 && (
          <div style={styles.header}>
            <button onClick={() => step === 1 ? navigate('/') : setStep(step - 1)} style={styles.backBtn}>← Back</button>
            <span style={styles.stepCount}>STEP {step} / 3</span>
          </div>
        )}

        {/* --- STEP 1: STYLE --- */}
        {step === 1 && (
          <div style={styles.fade}>
            <h2 style={styles.title}>Choose Style</h2>
            <p style={styles.subtitle}>What kind of letter do you need?</p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              {Object.keys(options).map((cat) => (
                <div key={cat}>
                  <h4 style={styles.catTitle}>{cat}</h4>
                  <div style={styles.grid}>
                    {options[cat].map((type) => (
                      <button key={type} onClick={() => { setCategory(cat); setLetterType(type); setStep(2); }} style={styles.optionBtn}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- STEP 2: DETAILS --- */}
        {step === 2 && (
          <div style={styles.fade}>
            <h2 style={styles.title}>Your Details</h2>
            <p style={styles.subtitle}>So we can contact you.</p>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Your Name</label>
              <input type="text" placeholder="e.g. Juan Dela Cruz" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={styles.input} />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Facebook / Instagram Link</label>
              <input type="text" placeholder="fb.com/yourprofile" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} style={styles.input} />
            </div>

            <button onClick={() => { if(formData.name && formData.contact) setStep(3); else alert('Please fill details'); }} style={styles.primaryBtn}>Next →</button>
          </div>
        )}

        {/* --- STEP 3: VIDEO (Optional) --- */}
        {step === 3 && (
          <div style={styles.fade}>
            <h2 style={styles.title}>Video Greeting 🎥</h2>
            <p style={styles.subtitle}>Upload now, or do it later via QR.</p>

            <div style={styles.uploadBox}>
              <input type="file" accept="video/*" onChange={e => setFile(e.target.files[0])} style={{width: '100%'}} />
              <p style={{fontSize:'12px', color:'#aaa', marginTop:'10px'}}>Optional. Max size 50MB.</p>
            </div>

            <button onClick={handleSubmit} disabled={loading} style={styles.primaryBtn}>
              {loading ? 'Processing...' : file ? 'Submit with Video 🚀' : 'Skip & Submit →'}
            </button>
          </div>
        )}

        {/* --- STEP 4: SUCCESS --- */}
        {step === 4 && (
          <div style={styles.fade}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.title}>Request Sent!</h2>
            <p style={styles.subtitle}>Here is your Tracking Key.</p>
            
            <div style={styles.ticketCard}>
              <p style={{margin:0, fontSize:'11px', color:'#888', letterSpacing:'1px'}}>YOUR TICKET KEY</p>
              <h1 style={{margin:'10px 0', fontSize:'32px', color:'#1a1a1a', letterSpacing:'2px', fontFamily:'monospace'}}>{ticketCode}</h1>
            </div>

            <p style={{fontSize:'13px', color:'#666', marginTop:'20px', lineHeight:'1.5'}}>
              Use this Key on the home page to track your order status and see your digital QR code.
            </p>

            <button onClick={() => navigate(`/status/${ticketCode}`)} style={{...styles.primaryBtn, marginTop:'20px'}}>
              View Status Page
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

// --- PROFESSIONAL STYLES ---
const styles = {
  page: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f7', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  card: { background: 'white', padding: '35px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', width: '100%', maxWidth: '450px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  backBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  stepCount: { fontSize: '11px', fontWeight: '700', color: '#ccc', letterSpacing: '1px' },
  title: { margin: '0 0 8px 0', color: '#1a1a1a', fontSize: '26px', fontWeight: '700' },
  subtitle: { margin: '0 0 25px 0', color: '#888', fontSize: '15px' },
  catTitle: { fontSize: '12px', fontWeight: '700', color: '#b2bec3', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' },
  grid: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  optionBtn: { background: 'white', border: '1px solid #e0e0e0', padding: '10px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', color: '#333', fontWeight: '500', transition: '0.2s' },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e5e5', fontSize: '15px', background: '#fcfcfc', outline: 'none', color: '#333' },
  uploadBox: { border: '2px dashed #e0e0e0', padding: '20px', borderRadius: '16px', textAlign: 'center', marginBottom: '20px', background: '#fafafa' },
  primaryBtn: { width: '100%', padding: '16px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
  ticketCard: { background: '#f5f5f7', padding: '25px', borderRadius: '20px', textAlign: 'center', border: '1px solid #e5e5e5' },
  successIcon: { width: '60px', height: '60px', background: '#e0f2f1', color: '#006266', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 20px' },
  fade: { animation: 'fadeIn 0.4s ease-out' }
}