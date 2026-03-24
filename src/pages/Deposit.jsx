import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const SHAREHOLDERS = ['Ammi', 'Alka', 'Jahanzeb', 'Memoona', 'Waleed']
const SHARE_RATIOS = { Ammi: 2, Alka: 1, Jahanzeb: 2, Memoona: 1, Waleed: 2 }
const TOTAL_SHARE = Object.values(SHARE_RATIOS).reduce((a, b) => a + b, 0)

export default function Deposit() {
  const navigate = useNavigate()
  const [amounts, setAmounts] = useState({ Ammi: '', Alka: '', Jahanzeb: '', Memoona: '', Waleed: '' })
  const [cashOnHand, setCashOnHand] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Compute each shareholder's cash on hand from transactions
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'transactions'), (snap) => {
      const cash = { Ammi: 0, Alka: 0, Jahanzeb: 0, Memoona: 0, Waleed: 0 }
      snap.forEach(doc => {
        const t = doc.data()
        if (t.method !== 'cash') return
        const amt = parseFloat(t.amount) || 0
        const sign = t.type === 'income' ? 1 : -1
        if (t.isCommon) {
          SHAREHOLDERS.forEach(sh => {
            cash[sh] += sign * amt * SHARE_RATIOS[sh] / TOTAL_SHARE
          })
        } else if (t.shareholder && cash[t.shareholder] !== undefined) {
          cash[t.shareholder] += sign * amt
        }
      })
      setCashOnHand(cash)
    })
    return () => unsub()
  }, [])

  const total = SHAREHOLDERS.reduce((s, sh) => s + (parseFloat(amounts[sh]) || 0), 0)

  const handleSave = async () => {
    if (total <= 0) { setError('Please enter at least one deposit amount.'); return }
    setSaving(true)
    setError('')
    try {
      const now = new Date()
      const depositAmounts = {}
      SHAREHOLDERS.forEach(sh => { depositAmounts[sh] = parseFloat(amounts[sh]) || 0 })

      // Save deposit record
      await addDoc(collection(db, 'deposits'), {
        date: now.toLocaleDateString('en-US'),
        dateISO: now.toISOString(),
        amounts: depositAmounts,
        total,
        timestamp: serverTimestamp(),
      })

      // Also record as a transaction (Bank Deposit expense) for cash tracking
      await addDoc(collection(db, 'transactions'), {
        amount: total,
        description: 'Bank Deposit',
        type: 'expense',
        account: 'BANK DEPOSIT',
        method: 'cash',
        isCommon: false,
        shareholder: 'All',
        date: now.toLocaleDateString('en-US'),
        dateISO: now.toISOString(),
        timestamp: serverTimestamp(),
        isDeposit: true,
        depositAmounts,
      })

      setSaved(true)
    } catch (e) {
      setError('Error saving: ' + e.message)
    }
    setSaving(false)
  }

  const fmt = (n) => `Rs.${(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

  if (saved) {
    return (
      <div>
        <Navbar navigate={navigate} />
        <div className="page-wrapper">
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#1a6b3a', marginBottom: 8 }}>Bank Deposit Saved!</h2>
            <p style={{ color: '#666', marginBottom: 24 }}>Total deposited: {fmt(total)}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => { setAmounts({ Ammi: '', Alka: '', Jahanzeb: '', Memoona: '', Waleed: '' }); setSaved(false) }}>New Deposit</button>
              <button className="btn-secondary" onClick={() => navigate('/')}>← Home</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar navigate={navigate} />
      <div className="page-wrapper">
        <h1 className="page-title">Bank Deposit</h1>
        <p className="page-subtitle">Enter individual deposit amounts. Current cash balances are shown for reference.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="deposit-grid">
          {SHAREHOLDERS.map(sh => (
            <div className="deposit-card" key={sh}>
              <div className="deposit-name">{sh}</div>
              <div className="deposit-cash">Cash on Hand: {fmt(cashOnHand[sh])}</div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: 6 }}>Deposit Amount</label>
              <input
                className="deposit-input"
                type="number"
                placeholder="0.00"
                value={amounts[sh]}
                onChange={e => setAmounts({ ...amounts, [sh]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="total-bar">
          <span className="total-label">Total Deposit Amount</span>
          <span className="total-amount">{fmt(total)}</span>
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={saving || total <= 0}
          style={{ width: '100%', padding: '14px' }}>
          {saving ? 'Saving...' : '💾 Save Bank Deposit'}
        </button>
      </div>
    </div>
  )
}

function Navbar({ navigate }) {
  return (
    <div className="navbar">
      <button onClick={() => navigate('/')}>← Home</button>
      <button onClick={() => navigate('/transaction')}>Add</button>
      <button onClick={() => navigate('/report')}>Reports</button>
    </div>
  )
}
