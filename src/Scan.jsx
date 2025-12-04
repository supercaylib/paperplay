import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Confetti from 'react-confetti'

export default function Scan() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [stickerData, setStickerData] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [unlockDate, setUnlockDate] = useState('') 

  useEffect(() => { checkSticker() }, [id])

  async function checkSticker() {
    // Check if data exists
    const { data } = await supabase.from('qr_codes').select('*').eq('id', id).single()
    setStickerData(data)
    setLoading(false)
  }

  async function handleUpload(event) {
    const file = event.target.files[0]
    if (!file) return
    setUploading(true)

    // 1. Upload File
    const fileName = `${id}-${Date.now()}.mp4`
    const { error: upError } = await supabase.storage.from('videos').upload(fileName, file)
    
    if (upError) {
      setUploading(false)
      return alert('Upload failed. Try a smaller video.')
    }

    // 2. Get Public URL
    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName)

    // 3. Save to Database (With optional Unlock Date)
    const updateData = { 
      id: id, 
      video_url: urlData.publicUrl,
      unlock_at: unlockDate ? new Date(unlockDate).toISOString() : null
    }

    const { error: dbError } = await supabase.from('qr_codes').upsert(updateData)
    
    if (!dbError) setStickerData(updateData)
    setUploading(false)
  }

  // LOGIC: Is it locked?
  const isLocked = stickerData?.unlock_at && new Date() < new Date(stickerData.unlock_at)
  
  // Calculate Days Remaining
  const timeLeft = stickerData?.unlock_at ? new Date(stickerData.unlock_at) - new Date() : 0
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24))

  // --- RENDERING ---

  if (loading) return <div className="app-container"><h2>Loading... 🔄</h2></div>

  // SCENARIO 1: LOCKED (Countdown)
  if (stickerData?.video_url && isLocked) {
    return (
      <div className="app-container" style={{textAlign: 'center'}}>
        <h1 style={{fontSize: '50px'}}>🔒</h1>
        <h2>Do Not Open Until...</h2>
        <h3 style={{color: '#ff4757'}}>{new Date(stickerData.unlock_at).toDateString()}</h3>
        
        <div style={{background: '#ffeaa7', padding: '20px', borderRadius: '15px', marginTop: '20px'}}>
          <p style={{margin:0, fontWeight: 'bold', color: '#d35400'}}>TIME REMAINING:</p>
          <h1 style={{margin:'10px 0', fontSize: '40px'}}>{daysLeft} Days</h1>
        </div>
        <p style={{marginTop: '30px', color: '#7f8c8d'}}>Come back later for your surprise!</p>
      </div>
    )
  }

  // SCENARIO 2: UNLOCKED (Video + Confetti)
  if (stickerData?.video_url) {
    return (
      <div className="app-container">
        <Confetti numberOfPieces={300} recycle={false} />
        <h1>✨ Surprise! ✨</h1>
        <video 
          src={stickerData.video_url} 
          controls 
          autoPlay 
          playsInline
          style={{ width: '100%', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
        />
        <br />
        <a href={stickerData.video_url} download target="_blank">
          <button style={{marginTop: '20px', background: '#2ecc71'}}>
            Download Memory 📥
          </button>
        </a>
      </div>
    )
  }

  // SCENARIO 3: EMPTY (Upload Mode)
  return (
    <div className="app-container">
      <h1>Record a Message 🎥</h1>
      <p>This PaperPlay sticker is empty.</p>
      
      <input 
        type="file" 
        accept="video/*" 
        onChange={handleUpload}
        disabled={uploading}
        className="file-input"
      />

      <div style={{marginTop: '25px', textAlign: 'left', width: '100%', background: '#fff', padding: '15px', borderRadius: '10px'}}>
        <label style={{fontWeight: 'bold', display: 'block'}}>📅 Unlock Date (Optional)</label>
        <p style={{fontSize: '12px', color: '#666', margin: '5px 0 10px'}}>
          If you pick a date, the video will be <b>locked</b> until then.
        </p>
        <input 
          type="date" 
          onChange={(e) => setUnlockDate(e.target.value)}
          style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc'}}
        />
      </div>
      
      {uploading && <h3 style={{color: '#e84118', marginTop: '20px'}}>Uploading... please wait...</h3>}
    </div>
  )
}