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
      .eq('id', ticket) // The Ticket IS the QR ID
      .single()
    
    if (qr) setQrData(qr)
    setLoading(false)
  }

  if (loading) return <div style={styles.page}><div style={styles.loader}>Checking Ticket...</div></div>

  if (!order) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>🚫</div>
        <h2 style={styles.title}>Ticket Not Found</h2>
        <p style={styles.text}>Please check your code and try again.</p>
        <button onClick={() => navigate('/')} style={styles.btn}>Back Home</button>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.title}>Order Status</h1>
          <div style={styles.badge}>{order.status}</div>
        </div>

        <div style={styles.infoBox}>
          <p style={styles.label}>TICKET CODE</p>
          <p style={styles.ticketCode}>{order.ticket_code}</p>
          <p style={styles.subText}>Keep this key safe.</p>
        </div>

        {/* PROGRESS BAR */}
        <div style={styles.progressContainer}>
          <div style={{...styles.progressBar, width: order.status === 'Done' ? '100%' : '50%'}}></div>
        </div>
        <p style={{textAlign: 'center', fontSize: '13px', color: '#666', marginBottom: '30px'}}>
          {order.status === 'Done' ? 'Order Complete & Ready!' : 'We are currently crafting your letter.'}
        </p>

        <hr style={styles.divider} />

        {/* QR CODE SECTION */}
        <div style={styles.qrSection}>
          <h3 style={styles.subtitle}>Your Digital Sticker</h3>
          <p style={styles.text}>This QR code is linked to your letter.</p>
          
          <div style={styles.qrWrapper}>
            <QRCode value={`https://paperplay-nu.vercel.app/${order.ticket_code}`} size={140} />
          </div>

          <p style={{fontSize: '12px', color: '#999', marginTop: '15px'}}>
            {qrData?.video_url ? "✅ Video Message Attached" : "⚪ No Video (Scan to Upload)"}
          </p>

          <a href={`https://paperplay-nu.vercel.app/${order.ticket_code}`} target="_blank" style={{textDecoration:'none'}}>
            <button style={styles.secondaryBtn}>
              {qrData?.video_url ? "▶ Preview Video" : "📤 Upload Video Now"}
            </button>
          </a>
        </div>

        <button onClick={() => navigate('/')} style={styles.btn}>Back to Home</button>

      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f5f7', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  card: { background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' },
  loader: { fontSize: '16px', fontWeight: '600', color: '#666' },
  icon: { fontSize: '40px', marginBottom: '15px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a1a' },
  badge: { background: '#e3fafc', color: '#007b85', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' },
  infoBox: { background: '#f9f9f9', padding: '20px', borderRadius: '16px', textAlign: 'center', marginBottom: '20px' },
  label: { fontSize: '11px', fontWeight: '700', color: '#b2bec3', letterSpacing: '1px' },
  ticketCode: { fontSize: '28px', fontWeight: '800', color: '#1a1a1a', margin: '5px 0', letterSpacing: '2px', fontFamily: 'monospace' },
  subText: { fontSize: '13px', color: '#888', margin: 0 },
  progressContainer: { width: '100%', height: '6px', background: '#eee', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' },
  progressBar: { height: '100%', background: '#1a1a1a', borderRadius: '10px' },
  divider: { border: 'none', borderTop: '1px solid #eee', margin: '25px 0' },
  qrSection: { textAlign: 'center' },
  subtitle: { fontSize: '16px', fontWeight: '700', color: '#333', margin: '0 0 5px 0' },
  text: { fontSize: '14px', color: '#666', margin: '0 0 20px 0' },
  qrWrapper: { background: 'white', padding: '15px', borderRadius: '16px', border: '1px dashed #ccc', display: 'inline-block' },
  btn: { width: '100%', padding: '14px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', marginTop: '30px' },
  secondaryBtn: { marginTop: '15px', padding: '10px 20px', background: 'white', border: '1px solid #ccc', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#333' }
}