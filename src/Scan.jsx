import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from './supabaseClient'

export default function Scan() {
  const { id } = useParams() // Get the ID from the URL (e.g. "gift-1")
  const [loading, setLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState(null)
  const [uploading, setUploading] = useState(false)

  // 1. Check if this sticker already has a video
  useEffect(() => {
    checkSticker()
  }, [id])

  async function checkSticker() {
    setLoading(true)
    // Check database for this specific ID
    const { data, error } = await supabase
      .from('qr_codes')
      .select('video_url')
      .eq('id', id)
      .single()

    if (data && data.video_url) {
      setVideoUrl(data.video_url)
    }
    setLoading(false)
  }

  // 2. Handle the Video Upload
  async function handleUpload(event) {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    
    // A. Upload file to Supabase Storage
    const fileName = `${id}-${Date.now()}.mp4`
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('videos')
      .upload(fileName, file)

    if (fileError) {
      alert('Error uploading video!')
      console.error(fileError)
      setUploading(false)
      return
    }

    // B. Get the Public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('videos')
      .getPublicUrl(fileName)
      
    const publicUrl = publicUrlData.publicUrl

    // C. Save the link to the Database
    const { error: dbError } = await supabase
      .from('qr_codes')
      .upsert({ 
        id: id, 
        video_url: publicUrl,
        // unlock_at: new Date().toISOString() // We will add countdown logic later
      })

    if (dbError) {
      alert('Database error!')
    } else {
      setVideoUrl(publicUrl) // Show the video immediately
    }
    setUploading(false)
  }

  // --- RENDER THE UI ---

  if (loading) return <h2>Checking Sticker...</h2>

  // SCENARIO 1: Video exists (The Receiver View)
  if (videoUrl) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>✨ A Surprise for You! ✨</h1>
        <video 
          src={videoUrl} 
          controls 
          style={{ width: '100%', maxWidth: '400px', borderRadius: '10px' }} 
          autoPlay
        />
        <br />
        <a href={videoUrl} download>
          <button style={{ marginTop: '20px', padding: '10px 20px' }}>
            Download Memory 📥
          </button>
        </a>
      </div>
    )
  }

  // SCENARIO 2: No video yet (The Giver View)
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Record a Message 🎥</h1>
      <p>This PaperPlay sticker is empty. Upload a video to link it!</p>
      
      <input 
        type="file" 
        accept="video/*" 
        onChange={handleUpload}
        disabled={uploading}
        style={{ marginTop: '20px' }}
      />
      
      {uploading && <p>Uploading... please wait...</p>}
    </div>
  )
}