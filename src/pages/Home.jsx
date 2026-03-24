import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export default function Home() {
  const navigate = useNavigate()
  const [totalCash, setTotalCash] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen to all transactions to compute cash on hand in real-time
    const unsub = onSnapshot(collection(db, 'transactions'), (snap) => {
      let cash = 0
      snap.forEach(doc => {
        const t = doc.data()
        const amt = parseFloat(t.amount) || 0
        if (t.type === 'income' && t.method === 'cash') cash += amt
        else if (t.type === 'expense' && t.method === 'cash') cash -= amt
      })
      setTotalCash(cash)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const fmt = (n) => {
    if (n === null) return 'Loading...'
    return `Rs.${n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="home-container">
        <h1 className="home-title">ہمارا حساب</h1>
        <p className="home-subtitle">Financial Transaction Management</p>

        <div className="cash-card">
          <div className="cash-label">Cash on Hand</div>
          <div className="cash-label" style={{ fontSize: '0.75rem', opacity: 0.7 }}>Available Cash</div>
          <div className={`cash-amount ${totalCash < 0 ? 'negative' : ''}`}>
            {loading ? 'Loading...' : fmt(totalCash)}
          </div>
        </div>

        <div className="home-buttons">
          <button className="home-btn" onClick={() => navigate('/transaction')}>
            <span className="btn-icon">➕</span>
            <span className="btn-label">Add Transaction</span>
          </button>
          <button className="home-btn" onClick={() => navigate('/deposit')}>
            <span className="btn-icon">🏦</span>
            <span className="btn-label">Bank Deposit</span>
          </button>
          <button className="home-btn" onClick={() => navigate('/report')}>
            <span className="btn-icon">📊</span>
            <span className="btn-label">Report</span>
          </button>
          <button className="home-btn" onClick={() => navigate('/admin')}>
            <span className="btn-icon">⚙️</span>
            <span className="btn-label">Admin</span>
          </button>
        </div>
      </div>
      <div className="footer">ہمارا حساب v1.0 | Built with ❤️</div>
    </div>
  )
}
