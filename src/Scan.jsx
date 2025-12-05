import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Confetti from 'react-confetti'

export default function Scan() {
  const { id } = useParams()
  
  const [loading, setLoading] = useState(true)
  const [stickerData, setStickerData] = useState(null)
  const [isValidSticker, setIsValidSticker] = useState(false)
  
  const [viewState, setViewState] = useState('welcome')
  const [file, setFile] = useState(null)
  const [unlockDate, setUnlockDate] = useState('') 
  const [allowAdmin, setAllowAdmin] = useState(true)

  useEffect(() => { checkSticker() }, [id])

  async function checkSticker() {
    const { data, error } = await supabase.from('qr_codes').select('*').eq('id', id).single()
    
    setLoading(false)

    if (error || !data) {
      setIsValidSticker(false)
    } else {
      setIsValidSticker(true)
      setStickerData(data)
    }
  }

  async function handleUpload() {
    if (!file) return alert('Please select a video first')
    
    setViewState('uploading')

    const fileName = `${id}-${Date.now()}.mp4`
    
    const { error: upError } = await supabase.storage.from('videos').upload(fileName, file)
    if (upError) {
      setViewState('form')
      return alert('Upload failed. Try a smaller video.')
    }

    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName)

    const updateData = { 
      video_url: urlData.publicUrl,
      unlock_at: unlockDate ? new Date(unlockDate).toISOString() : null,
      allow_admin_view: allowAdmin
    }

    const { error: dbError } = await supabase
      .from('qr_codes')
      .update(updateData)
      .eq('id', id)
    
    if (!dbError) {
      setStickerData({ ...stickerData, ...updateData })
    } else {
      setViewState('form')
      alert('Database error')
    }
  }

  const isLocked = stickerData?.unlock_at && new Date() < new Date(stickerData.unlock_at)
  const timeLeft = stickerData?.unlock_at ? new Date(stickerData.unlock_at) - new Date() : 0
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24))

  if (loading) return <div style={styles.centerPage}><h2>Loading... 🔄</h2></div>
  
  if (!isValidSticker) return (
    <div style={styles.centerPage}>
      <h1 style={{fontSize: '40px'}}>🚫</h1>
      <h2>Invalid Sticker</h2>
      <p>This QR code does not exist in our system.</p>
      <p style={{fontSize: '12px', color: '#999'}}>ID: {id}</p>
    </div>
  )

  if (stickerData?.video_url) {
    if (isLocked) {
      return (
        <div style={styles.centerPage}>
          <h1 style={{fontSize: '50px'}}>🔒</h1>
          <h2>Do Not Open Until...</h2>
          <h3 style={{color: '#ff4757'}}>{new Date(stickerData.unlock_at).toDateString()}</h3>
          <div style={{background: '#ffeaa7', padding: '20px', borderRadius: '15px', marginTop: '20px'}}>
            <p style={{margin:0, fontWeight: 'bold', color: '#d35400'}}>TIME REMAINING:</p>
            <h1 style={{margin:'10px 0', fontSize: '40px'}}>{daysLeft} Days</h1>
          </div>
        </div>
      )
    }

    return (
      <div style={styles.centerPage}>
        <Confetti numberOfPieces={300} recycle={false} />
        <h1 style={styles.logoTitle}>PaperPlay</h1>
        <h2 style={{marginTop: 0}}>✨ Surprise! ✨</h2>
        <div style={styles.videoWrapper}>
          <video src={stickerData.video_url} controls autoPlay playsInline />
        </div>
        <a href={stickerData.video_url} download target="_blank" style={{width: '100%', maxWidth: '400px'}}>
          <button style={styles.downloadBtn}>Download Memory 📥</button>
        </a>
      </div>
    )
  }

  if (viewState === 'welcome') {
    return (
      <div style={styles.landingPage}>
        <div style={styles.card}>
          <div style={styles.iconWrapper}>🎁</div>
          <h1 style={styles.title}>You found a Sticker!</h1>
          <p style={styles.subtitle}>This PaperPlay sticker is currently empty.</p>
          <hr style={styles.divider} />
          <div style={styles.noteBox}>
            <p style={styles.noteText}>
              "Upload a video message to this sticker. It becomes a permanent digital memory."
            </p>
          </div>
          <button onClick={() => setViewState('form')} style={styles.mainBtn}>
            🎁 Setup Gift
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.centerPage}>
      <h2 style={{color: '#333'}}>Record a Message 🎥</h2>
      <p style={{color: '#666', marginBottom: '20px'}}>Upload a video for the receiver.</p>
      
      <div style={{width: '100%', maxWidth: '400px', background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
        
        <input 
          type="file" 
          accept="video/*" 
          onChange={e => setFile(e.target.files[0])}
          disabled={viewState === 'uploading'}
          style={{marginBottom: '20px'}}
        />

        <div style={{textAlign: 'left', marginBottom: '15px'}}>
          <label style={{fontWeight: 'bold', fontSize: '14px'}}>📅 Unlock Date (Optional)</label>
          <input 
            type="date" 
            onChange={(e) => setUnlockDate(e.target.value)}
            disabled={viewState === 'uploading'}
            style={{width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc'}}
          />
        </div>

        <div style={{textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#f8f9fa', padding: '10px', borderRadius: '8px', marginBottom: '20px'}}>
          <input 
            type="checkbox" 
            checked={allowAdmin} 
            onChange={(e) => setAllowAdmin(e.target.checked)}
            disabled={viewState === 'uploading'}
            style={{width: '20px', height: '20px', marginTop: '2px'}}
          />
          <div style={{fontSize: '12px', color: '#555'}}>
            <strong>Allow Admin Support?</strong><br/>
            If unchecked, the PaperPlay team cannot see this video to help with issues.
          </div>
        </div>

        {viewState === 'uploading' ? (
          <button disabled style={{...styles.mainBtn, background: '#b2bec3', cursor: 'not-allowed'}}>Uploading...</button>
        ) : (
          <button onClick={handleUpload} style={styles.mainBtn}>Save Memory ✨</button>
        )}
      </div>
      
      {viewState !== 'uploading' && (
        <button onClick={() => setViewState('welcome')} style={{...styles.secondaryBtn, marginTop: '20px'}}>
          Cancel
        </button>
      )}
    </div>
  )
}

const styles = {
  centerPage: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center', padding: '20px',
    background: '#f0f2f5', textAlign: 'center', fontFamily: 'sans-serif'
  },
  landingPage: {
    minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', padding: '20px', fontFamily: 'sans-serif'
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)', padding: '40px 30px', borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)', maxWidth: '400px', width: '100%', textAlign: 'center'
  },
  iconWrapper: { fontSize: '40px', background: '#f1f2f6', width: '80px', height: '80px', lineHeight: '80px', borderRadius: '50%', margin: '0 auto 20px' },
  title: { margin: 0, color: '#2d3436', fontSize: '28px', fontWeight: '800' },
  subtitle: { margin: '5px 0 0 0', color: '#b2bec3', fontSize: '14px', fontWeight: '500' },
  divider: { border: 'none', borderTop: '1px solid #eee', margin: '25px 0' },
  noteBox: { background: '#e3fafc', color: '#0984e3', padding: '15px', borderRadius: '12px', marginBottom: '30px', fontSize: '14px', fontStyle: 'italic' },
  mainBtn: { background: '#2d3436', color: 'white', padding: '15px', borderRadius: '12px', fontWeight: 'bold', width: '100%', border: 'none', cursor: 'pointer', fontSize: '16px' },
  secondaryBtn: { background: 'transparent', color: '#666', border: 'none', cursor: 'pointer', textDecoration: 'underline' },
  downloadBtn: { background: '#2ecc71', color: 'white', padding: '15px', borderRadius: '12px', fontWeight: 'bold', width: '100%', border: 'none', cursor: 'pointer', marginTop: '20px', fontSize: '16px' },
  videoWrapper: { width: '100%', maxWidth: '400px', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  logoTitle: { background: '-webkit-linear-gradient(45deg, #0984e3, #a29bfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 10px 0' }
}