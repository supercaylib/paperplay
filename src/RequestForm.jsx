import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function RequestForm() {
  const navigate = useNavigate()
  
  // STATES
  const [step, setStep] = useState(1) // 1=Category, 2=Details, 3=Success
  const [loading, setLoading] = useState(false)
  
  // FORM DATA
  const [category, setCategory] = useState('')
  const [letterType, setLetterType] = useState('')
  const [formData, setFormData] = useState({ name: '', age: '', contact: '' })
  const [ticketCode, setTicketCode] = useState(null)

  // DATA OPTIONS
  const options = {
    'Seasonal 🎄': ['Christmas', 'New Year', 'Valentine\'s', 'Halloween'],
    'Personal 💌': ['Birthday', 'Condolence', 'Miss You', 'Congratulations'],
    'Excuse 📄': ['School Absence', 'Sick Leave', 'Work Leave', 'Event Regret']
  }

  // SUBMIT FUNCTION
  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase
      .from('letter_requests')
      .insert({
        customer_name: formData.name,
        customer_age: formData.age,
        contact_link: formData.contact,
        category: category,
        letter_type: letterType
      })
      .select() // We need this to get the auto-generated ticket code back

    setLoading(false)

    if (error) {
      alert('Error sending request: ' + error.message)
    } else {
      setTicketCode(data[0].ticket_code)
      setStep(3) // Go to Success Screen
    }
  }

  // --- VIEW 1: CATEGORY SELECTION ---
  if (step === 1) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <button onClick={() => navigate('/')} style={styles.backBtn}>← Back</button>
          <h2 style={styles.heading}>Choose a Letter Style</h2>
          <p style={styles.subtext}>What kind of memory are we making?</p>

          <div style={styles.grid}>
            {Object.keys(options).map((cat) => (
              <div key={cat} style={styles.categoryBlock}>
                <h3 style={styles.catTitle}>{cat}</h3>
                <div style={styles.chipContainer}>
                  {options[cat].map((type) => (
                    <button 
                      key={type} 
                      onClick={() => { setCategory(cat); setLetterType(type); setStep(2); }}
                      style={styles.chip}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // --- VIEW 2: DETAILS FORM ---
  if (step === 2) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <button onClick={() => setStep(1)} style={styles.backBtn}>← Change Style</button>
          
          <h2 style={styles.heading}>Almost there!</h2>
          <p style={styles.subtext}>
            Requesting: <strong>{letterType}</strong> ({category.split(' ')[0]})
          </p>

          <form onSubmit={handleSubmit} style={{textAlign: 'left'}}>
            <label style={styles.label}>Your Name</label>
            <input 
              required 
              type="text" 
              style={styles.input} 
              placeholder="e.g. Juan Dela Cruz"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />

            <label style={styles.label}>Age</label>
            <input 
              required 
              type="number" 
              style={styles.input} 
              placeholder="e.g. 21"
              value={formData.age}
              onChange={e => setFormData({...formData, age: e.target.value})}
            />

            <label style={styles.label}>Facebook/IG Link (For contact)</label>
            <input 
              required 
              type="text" 
              style={styles.input} 
              placeholder="fb.com/juandelacruz"
              value={formData.contact}
              onChange={e => setFormData({...formData, contact: e.target.value})}
            />

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Sending...' : 'Submit Request 🚀'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // --- VIEW 3: SUCCESS TICKET ---
  if (step === 3) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{fontSize: '50px', marginBottom: '10px'}}>🎉</div>
          <h2 style={styles.heading}>Request Sent!</h2>
          <p style={styles.subtext}>Please save your Ticket Code.</p>
          
          <div style={styles.ticketBox}>
            <p style={{margin:0, fontSize:'12px', textTransform:'uppercase', color:'#888'}}>Ticket Number</p>
            <h1 style={{margin:'5px 0', letterSpacing:'3px', color:'#2d3436'}}>{ticketCode}</h1>
          </div>

          <p style={{fontSize:'13px', color:'#666', marginTop:'20px'}}>
            We will contact you via the link you provided to confirm the details.
          </p>

          <button onClick={() => navigate('/')} style={styles.homeBtn}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }
}

// STYLES (Aesthetic Glassmorphism)
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '20px',
    fontFamily: 'sans-serif',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '30px',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
  },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#888', marginBottom: '10px', fontSize: '14px' },
  heading: { margin: '0 0 5px 0', color: '#2d3436', fontSize: '24px' },
  subtext: { margin: '0 0 25px 0', color: '#b2bec3', fontSize: '14px' },
  
  categoryBlock: { marginBottom: '20px', textAlign: 'left' },
  catTitle: { fontSize: '14px', textTransform: 'uppercase', color: '#b2bec3', margin: '0 0 10px 0', letterSpacing: '1px' },
  chipContainer: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  chip: {
    background: 'white', border: '1px solid #eee', padding: '10px 15px', borderRadius: '20px',
    cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: '0.2s',
    color: '#555'
  },
  
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '5px', marginTop: '15px' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '15px', background: '#f9f9f9' },
  submitBtn: { width: '100%', padding: '15px', marginTop: '30px', background: '#0984e3', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  
  ticketBox: { background: '#f1f2f6', padding: '20px', borderRadius: '15px', border: '2px dashed #ccc', marginTop: '20px' },
  homeBtn: { marginTop: '20px', padding: '12px 25px', background: 'black', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer' }
}