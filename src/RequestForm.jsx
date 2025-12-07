import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function RequestForm() {
  const navigate = useNavigate()
  
  // STATES
  const [step, setStep] = useState(1) 
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // DATA
  const [category, setCategory] = useState('')
  const [letterType, setLetterType] = useState('')
  const [formData, setFormData] = useState({ name: '', contact: '' })
  const [file, setFile] = useState(null)
  
  // GENERATED KEY
  const [ticketCode, setTicketCode] = useState(null)

  const options = {
    'Seasonal': ['Christmas', 'New Year', 'Valentine\'s'],
    'Personal': ['Birthday', 'Condolence', 'Miss You', 'Congratulations'],
    'Formal': ['Excuse Letter', 'Resignation', 'Application']
  }

  // Helper for Preview Visuals
  const getEnvClass = () => {
    if (category === 'Seasonal') return 'env-seasonal'
    if (category === 'Personal') return 'env-personal'
    return 'env-formal'
  }

  const getStampIcon = () => {
    if (category === 'Seasonal') return '🎄'
    if (category === 'Personal') return '❤️'
    if (category === 'Formal') return '✒️'
    return '📮'
  }

  // Copy Function
  function copyToClipboard() {
    navigator.clipboard.writeText(ticketCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit() { // Removed 'e' since it's button click
    if (!formData.name || !formData.contact) return alert('Please fill in your details.')
    
    setLoading(true)

    // 1. Generate Ticket Code
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

    // 3. Create QR Code Entry
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

  // REUSABLE COMPONENTS
  const BackButton = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
       {step > 1 && step < 4 ? (
        <button onClick={() => setStep(step - 1)} className="btn-outline" style={{ width: 'auto', padding: '8px 15px' }}>← Back</button>
      ) : (
        <button onClick={() => navigate('/')} className="btn-outline" style={{ width: 'auto', padding: '8px 15px' }}>✕ Close</button>
      )}
      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ccc', letterSpacing: '1px' }}>
        {step < 4 ? `STEP ${step} / 3` : 'DONE'}
      </span>
    </div>
  )

  return (
    <div className="app-container wide-view">
      
      {/* LEFT SIDE: CONTROLS */}
      <div className="composer-controls">
        <BackButton />

        {/* STEP 1: STYLE */}
        {step === 1 && (
          <div className="fade-in">
            <h1>Choose Style</h1>
            <p className="subtitle">What kind of letter do you need?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {Object.keys(options).map((cat) => (
                <div key={cat}>
                  <h4 className="label-text" style={{marginBottom:'10px'}}>{cat}</h4>
                  <div className="button-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                    {options[cat].map((type) => (
                      <button 
                        key={type} 
                        onClick={() => { setCategory(cat); setLetterType(type); setStep(2); }} 
                        className="action-btn btn-outline"
                        style={{ justifyContent: 'flex-start', padding: '10px 15px' }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: DETAILS */}
        {step === 2 && (
          <div className="fade-in">
            <h1>Your Details</h1>
            <p className="subtitle">So we can contact you.</p>
            
            <div className="section">
              <label className="label-text">YOUR NAME</label>
              <div className="input-group">
                <input 
                  type="text" 
                  className="main-input"
                  placeholder="e.g. Juan Dela Cruz" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  style={{paddingLeft:'15px'}}
                />
              </div>
            </div>

            <div className="section">
              <label className="label-text">SOCIAL LINK (FB/IG)</label>
              <div className="input-group">
                <input 
                  type="text" 
                  className="main-input"
                  placeholder="fb.com/yourprofile" 
                  value={formData.contact} 
                  onChange={e => setFormData({...formData, contact: e.target.value})} 
                  style={{paddingLeft:'15px'}}
                />
              </div>
            </div>

            <button onClick={() => { if(formData.name && formData.contact) setStep(3); else alert('Please fill details'); }} className="action-btn btn-solid">Next →</button>
          </div>
        )}

        {/* STEP 3: VIDEO */}
        {step === 3 && (
          <div className="fade-in">
            <h1>Video Greeting 🎥</h1>
            <p className="subtitle">Upload now, or do it later via QR.</p>

            <div style={{ border: '2px dashed #e0e0e0', padding: '30px', borderRadius: '16px', textAlign: 'center', marginBottom: '20px', background: '#fafafa' }}>
              <input type="file" accept="video/*" onChange={e => setFile(e.target.files[0])} style={{width: '100%'}} />
              <p style={{fontSize:'12px', color:'#aaa', marginTop:'15px'}}>Optional. Max size 50MB.</p>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="action-btn btn-solid">
              {loading ? 'Processing...' : file ? 'Submit with Video 🚀' : 'Skip & Submit →'}
            </button>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 4 && (
          <div className="fade-in center-text">
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>🚚</div>
            <h1>Request Sent!</h1>
            <p className="subtitle">We have received your order.</p>
            
            <div className="ticket-dashed">
              <p className="label-text">YOUR TICKET KEY</p>
              <h1 style={{margin:'10px 0', fontSize:'32px', color:'#1a1a1a', letterSpacing:'2px'}}>{ticketCode}</h1>
              
              <button onClick={copyToClipboard} className="copy-btn">
                 {copied ? '✓ Copied!' : '📋 Copy Key'}
              </button>
            </div>

            <p style={{fontSize:'13px', color:'#666', marginTop:'20px', lineHeight:'1.5', maxWidth:'300px', margin:'20px auto'}}>
              Use this Key on the home page to track your order status and see your digital QR code.
            </p>

            <button onClick={() => navigate(`/status/${ticketCode}`)} className="action-btn btn-solid">
              View Status Page
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: ENVELOPE PREVIEW */}
      <div className="composer-preview">
        <p className="preview-label">PACKAGE PREVIEW</p>
        
        <div className={`physical-envelope ${getEnvClass()}`}>
          {/* Stamp */}
          <div className="stamp-box">
             <div style={{fontSize:'24px'}}>{getStampIcon()}</div>
             <div style={{fontSize:'8px', marginTop:'5px'}}>POST</div>
          </div>

          {/* Address Block */}
          <div className="address-lines">
            <p className="marker-text" style={{ fontSize: '12px', opacity: 0.6 }}>FROM: {formData.name || 'Your Name'}</p>
            
            <h2 className="marker-text" style={{ fontSize: '22px', margin: '20px 0', fontWeight: 'bold' }}>
              {letterType ? `To: ${letterType}` : 'To: Receiver'}
            </h2>

            <p className="marker-text" style={{ fontSize: '12px', opacity: 0.6 }}>
               CAT: {category || '...'}
            </p>
          </div>

          <div className="shipping-tag">PRIORITY MAIL</div>
        </div>

        <div style={{marginTop:'30px', textAlign:'center', opacity: 0.5}}>
           <p style={{fontSize:'12px'}}>*This is a preview of your request data.</p>
        </div>
      </div>

    </div>
  )
}