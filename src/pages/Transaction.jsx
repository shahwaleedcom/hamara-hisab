import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const INCOME_ACCOUNTS = [
  'ALMEEZAN', 'NEW ALMEEZAN', 'NEW ALADEEL', 'OLD ALADEEL',
  'GULZAR', 'AZAM', 'ABDUL REHMAN', 'SHIKOO', 'RASHEED',
  'MUNSHI', 'ASHIQ BUT', 'ASAD BUTTER', 'MASTER SB'
]

const EXPENSE_ACCOUNTS = [
  'GENERAL EXPENSE', 'BANK DEPOSIT',
  'SHAMIM', 'NAILA', 'AMMI 8 Acer', 'MASJID', 'WELFAIR'
]

const SHAREHOLDERS = [
  { name: 'Ammi', share: 2 },
  { name: 'Alka', share: 1 },
  { name: 'Jahanzeb', share: 2 },
  { name: 'Memoona', share: 1 },
  { name: 'Waleed', share: 2 },
]

const TOTAL_STEPS = 7

export default function Transaction() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    amount: '',
    description: '',
    type: '',       // 'income' | 'expense'
    account: '',
    method: '',     // 'cash' | 'credit'
    isCommon: null, // true | false
    shareholder: '',
  })

  const accounts = form.type === 'income' ? INCOME_ACCOUNTS : EXPENSE_ACCOUNTS

  const canProceed = () => {
    if (step === 1) return parseFloat(form.amount) > 0
    if (step === 2) return form.description.trim().length > 0
    if (step === 3) return form.type !== ''
    if (step === 4) return form.account !== ''
    if (step === 5) return form.method !== ''
    if (step === 6) return form.isCommon !== null
    if (step === 7) return form.isCommon || form.shareholder !== ''
    return true
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const now = new Date()
      await addDoc(collection(db, 'transactions'), {
        amount: parseFloat(form.amount),
        description: form.description.trim(),
        type: form.type,
        account: form.account,
        method: form.method,
        isCommon: form.isCommon,
        shareholder: form.isCommon ? 'All' : form.shareholder,
        date: now.toLocaleDateString('en-US'),
        dateISO: now.toISOString(),
        timestamp: serverTimestamp(),
      })
      setSaved(true)
    } catch (e) {
      setError('Error saving: ' + e.message)
    }
    setSaving(false)
  }

  const reset = () => {
    setForm({ amount: '', description: '', type: '', account: '', method: '', isCommon: null, shareholder: '' })
    setStep(1)
    setSaved(false)
    setError('')
  }

  const totalShare = SHAREHOLDERS.reduce((s, sh) => s + sh.share, 0)

  if (saved) {
    return (
      <div>
        <Navbar navigate={navigate} />
        <div className="page-wrapper">
          <div className="card success-screen">
            <div className="success-icon">✅</div>
            <h2 style={{ color: '#1a6b3a', marginBottom: 8 }}>Transaction Saved Successfully!</h2>
            <p style={{ color: '#666', marginBottom: 24 }}>Your transaction has been recorded.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-primary" onClick={reset}>Add Another</button>
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
        <h1 className="page-title">Add Transaction</h1>
        <p className="page-subtitle">Let's add your transaction step by step</p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="card">
          {/* Progress bar */}
          <div className="step-progress">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`step-dot ${i < step ? 'active' : ''}`} />
            ))}
          </div>

          {/* Step 1 – Amount */}
          {step === 1 && (
            <div>
              <div className="step-header">Enter the transaction amount</div>
              <label style={{ display: 'block', marginBottom: 8, color: '#666', fontSize: '0.9rem' }}>Amount (Rs.)</label>
              <input
                className="amount-input"
                type="number"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                autoFocus
              />
            </div>
          )}

          {/* Step 2 – Description */}
          {step === 2 && (
            <div>
              <div className="step-header">Enter the transaction description</div>
              <label style={{ display: 'block', marginBottom: 8, color: '#666', fontSize: '0.9rem' }}>Description</label>
              <input
                className="desc-input amount-input"
                type="text"
                placeholder="Enter description..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                autoFocus
              />
            </div>
          )}

          {/* Step 3 – Type */}
          {step === 3 && (
            <div>
              <div className="step-header">Is this income or expense?</div>
              <div className="choice-grid">
                <div className={`choice-card ${form.type === 'income' ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, type: 'income', account: '' })}>
                  <div className="choice-title">💰 Income</div>
                  <div className="choice-desc">Money coming in</div>
                </div>
                <div className={`choice-card ${form.type === 'expense' ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, type: 'expense', account: '' })}>
                  <div className="choice-title">💸 Expense</div>
                  <div className="choice-desc">Money going out</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 – Account */}
          {step === 4 && (
            <div>
              <div className="step-header">Which account should this be assigned to?</div>
              <div className="account-list">
                {accounts.map(acc => (
                  <div key={acc}
                    className={`account-item ${form.account === acc ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, account: acc })}>
                    <span className="account-badge">{form.type === 'income' ? '📈' : '📉'}</span>
                    <span>{acc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 – Method */}
          {step === 5 && (
            <div>
              <div className="step-header">How was this transaction paid?</div>
              <div className="choice-grid">
                <div className={`choice-card ${form.method === 'cash' ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, method: 'cash' })}>
                  <div className="choice-title">💵 Cash</div>
                  <div className="choice-desc">Physical cash payment</div>
                </div>
                <div className={`choice-card ${form.method === 'credit' ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, method: 'credit' })}>
                  <div className="choice-title">💳 Credit</div>
                  <div className="choice-desc">Credit card or bank transfer</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6 – Common or Individual */}
          {step === 6 && (
            <div>
              <div className="step-header">Is this a common or individual transaction?</div>
              <div className="choice-grid">
                <div className={`choice-card ${form.isCommon === true ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, isCommon: true, shareholder: '' })}>
                  <div className="choice-title">👥 Common Transaction</div>
                  <div className="choice-desc">Shared among all shareholders</div>
                </div>
                <div className={`choice-card ${form.isCommon === false ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, isCommon: false })}>
                  <div className="choice-title">👤 Individual Transaction</div>
                  <div className="choice-desc">Personal transaction for specific shareholder</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7 – Shareholder (if individual) or Confirmation (if common) */}
          {step === 7 && (
            <div>
              {form.isCommon ? (
                <div>
                  <div className="step-header">Select shareholder division</div>
                  <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: 14 }}>
                    This transaction will be split among all shareholders proportionally:
                  </div>
                  <div className="shareholder-grid">
                    {SHAREHOLDERS.map(sh => (
                      <div key={sh.name} className="shareholder-card selected">
                        <div className="sh-name">{sh.name}</div>
                        <div className="sh-share">
                          {((sh.share / totalShare) * 100).toFixed(1)}%
                          {' '}= Rs.{((parseFloat(form.amount) || 0) * sh.share / totalShare).toLocaleString('en-PK', { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="step-header">Please confirm your transaction</div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: '#666', fontSize: '0.9rem' }}>Select shareholder</label>
                    <div className="shareholder-grid">
                      {SHAREHOLDERS.map(sh => (
                        <div key={sh.name}
                          className={`shareholder-card ${form.shareholder === sh.name ? 'selected' : ''}`}
                          onClick={() => setForm({ ...form, shareholder: sh.name })}>
                          <div className="sh-name">{sh.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation summary */}
              <div className="confirm-box" style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, color: '#1a6b3a', marginBottom: 10, fontSize: '1rem' }}>
                  📋 Please confirm your transaction
                </div>
                {[
                  ['Amount', `Rs.${parseFloat(form.amount).toLocaleString('en-PK')}`],
                  ['Description', form.description],
                  ['Type', form.type.charAt(0).toUpperCase() + form.type.slice(1)],
                  ['Account', form.account],
                  ['Method', form.method.charAt(0).toUpperCase() + form.method.slice(1)],
                  ['Category', form.isCommon ? 'Common (All Shareholders)' : `Individual – ${form.shareholder}`],
                ].map(([label, value]) => (
                  <div className="confirm-row" key={label}>
                    <span className="confirm-label">{label}</span>
                    <span className="confirm-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="wizard-nav">
            <button className="btn-secondary" onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}>
              ← Back
            </button>
            {step < TOTAL_STEPS ? (
              <button className="btn-primary" disabled={!canProceed()} onClick={() => setStep(step + 1)}>
                Next →
              </button>
            ) : (
              <button className="btn-primary"
                disabled={!canProceed() || saving || (!form.isCommon && !form.shareholder)}
                onClick={handleSave}>
                {saving ? 'Saving...' : '💾 Save Transaction'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Navbar({ navigate }) {
  return (
    <div className="navbar">
      <button onClick={() => navigate('/')}>← Home</button>
      <button onClick={() => navigate('/report')}>Reports</button>
      <button onClick={() => navigate('/deposit')}>Deposit</button>
      <button onClick={() => navigate('/admin')}>Admin</button>
    </div>
  )
}
