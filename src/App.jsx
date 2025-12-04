import { Routes, Route } from 'react-router-dom'
import Scan from './Scan'
import Admin from './Admin' 

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<h1>Welcome to PaperPlay! Scan a sticker to start.</h1>} />
        <Route path="/admin" element={<Admin />} />
        {/* This handles any ID (e.g. localhost:5173/gift-1) */}
        <Route path="/:id" element={<Scan />} />
      </Routes>
    </div>
  )
}

export default App