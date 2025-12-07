import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import QRCode from 'react-qr-code'

export default function OrderStatus() {
  const { ticket } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [qrData, setQrData] = useState(null)
  
  // NEW: State for Video Preview Modal
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => { fetchStatus() }, [ticket])

  async function fetchStatus() {
    // 1. Get Order Details
    const { data: orderData, error } = await supabase
      .from('letter_requests')
      .select('*')
      .eq('ticket_code', ticket)
      .single()

    if (error || !orderData) {
      setLoading(false)
      return
    }

    setOrder(orderData)

    // 2. Get Associated QR Data
    const { data: qr } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('id', ticket)
      .single()
    
    if (qr) setQrData(qr)
    setLoading(false)
  }

  // Helper to determine active steps
  const getStepStatus = (stepName) => {
    if (!order) return ''
    const status = order.status
    if (stepName === 'Pending') return 'active'
    if (stepName === 'Processing' && (status === 'Processing' || status === 'Done')) return 'active'
    if (stepName === 'Done' && status === 'Done') return 'active'
    return ''
  }

  if (loading) return (
    <div className="app-container">
      <div className="center-text">Checking Ticket...</div>
    </div>
  )

  if (!order) return (
    <div className="app-container">
       <div className="center-text">
        <div style={{fontSize:'40px', marginBottom:'20px'}}>🚫</div>
        <h1>Ticket Not Found</h1>
        <p className="subtitle">Please check your code and try again.</p>
        <button onClick={() => navigate('/')} className="action-btn btn-solid" style={{marginTop:'20px'}}>Back Home</button>
      </div>
    </div>
  )

  return (
    <div className="app-container wide-view">
      
      {/* LEFT SIDE: TIMELINE */}
      <div className="composer-controls">
        
        <div style={{ marginBottom: '30px' }}>
          <button onClick={() => navigate('/')} className="btn-outline" style={{ width: 'auto', padding: '8px 15px', marginBottom: '20px' }}>← Back Home</button>
          <h1>Order Tracking</h1>
          <p className="subtitle">Track the status of your physical letter.</p>
        </div>

        <div className="timeline-container">
          <div className={`timeline-step ${getStepStatus('Pending')}`}>
            <div className="step-icon">📝</div>
            <div className="step-content">
              <h3 className="step-title">Order Received</h3>
              <p className="step-desc">We have received your request details.</p>
            </div>
          </div>

          <div className={`timeline-step ${getStepStatus('Processing')}`}>
            <div className="step-icon">🔨</div>
            <div className="step-content">
              <h3 className="step-title">Crafting Letter</h3>
              <p className="step-desc">We are printing, sealing, and preparing your letter.</p>
            </div>
          </div>

          <div className={`timeline-step ${getStepStatus('Done')}`}>
            <div className="step-icon">📦</div>
            <div className="step-content">
              <h3 className="step-title">Ready for Pickup</h3>
              <p className="step-desc">Your letter is ready! We will contact you shortly.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: DIGITAL ASSET CARD */}
      <div className="composer-preview" style={{ background: '#f5f5f7' }}>
        <p className="preview-label">DIGITAL ASSET</p>
        
        <div className="qr-display-card">
          <p className="label-text">TICKET CODE</p>
          <h1 style={{ fontSize: '36px', letterSpacing: '2px', margin: '10px 0' }}>{order.ticket_code}</h1>
          
          <div style={{ margin: '30px 0' }}>
             <QRCode value={`https://paperplay-nu.vercel.app/${order.ticket_code}`} size={160} />
          </div>

          <div style={{ 
            background: qrData?.video_url ? '#e3fafc' : '#f9f9f9', 
            color: qrData?.video_url ? '#0b7285' : '#888',
            padding: '10px', 
            borderRadius: '8px', 
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
             {qrData?.video_url ? "✅ Video Message Attached" : "⚪ No Video Attached"}
          </div>

          {/* ACTION BUTTONS */}
          {qrData?.video_url ? (
            <button onClick={() => setShowVideo(true)} className="action-btn btn-outline">
              ▶ Preview Video
            </button>
          ) : (
            <a href={`https://paperplay-nu.vercel.app/${order.ticket_code}`} target="_blank" style={{textDecoration:'none'}}>
              <button className="action-btn btn-outline">
                📤 Upload Video
              </button>
            </a>
          )}

        </div>
      </div>

      {/* VIDEO PREVIEW MODAL */}
      {showVideo && qrData?.video_url && (
        <div className="modal-overlay" onClick={() => setShowVideo(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'black', width: '100%', maxWidth: '800px', padding: 0, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <video 
              src={qrData.video_url} 
              controls 
              autoPlay 
              style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
            <button 
              onClick={() => setShowVideo(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '20px' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  )
}