import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'

const SHAREHOLDERS = ['Ammi', 'Alka', 'Jahanzeb', 'Memoona', 'Waleed']
const SHARE_RATIOS = { Ammi: 2, Alka: 1, Jahanzeb: 2, Memoona: 1, Waleed: 2 }
const TOTAL_SHARE = Object.values(SHARE_RATIOS).reduce((a, b) => a + b, 0)

const PAYABLE_ACCOUNTS = ['SHAMIM', 'NAILA', 'AMMI 8 Acer', 'MASJID', 'WELFAIR']
const RECEIVABLE_ACCOUNTS = ['GULZAR', 'AZAM', 'ABDUL REHMAN', 'SHIKOO', 'RASHEED', 'MUNSHI', 'ASHIQ BUT', 'ASAD BUTTER', 'MASTER SB']

const ACCOUNT_NUMBERS = {
  SHAMIM: 103, NAILA: 104, 'AMMI 8 Acer': 105, MASJID: 106, WELFAIR: 124,
  GULZAR: 114, AZAM: 115, 'ABDUL REHMAN': 116, SHIKOO: 117,
  RASHEED: 118, MUNSHI: 119, 'ASHIQ BUT': 120, 'ASAD BUTTER': 121, 'MASTER SB': 123
}

export default function Report() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [deposits, setDeposits] = useState([])
  const [refreshMsg, setRefreshMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubT = onSnapshot(
      query(collection(db, 'transactions'), orderBy('timestamp', 'desc')),
      snap => {
        setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      }
    )
    const unsubD = onSnapshot(
      query(collection(db, 'deposits'), orderBy('timestamp', 'desc')),
      snap => setDeposits(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return () => { unsubT(); unsubD() }
  }, [])

  const fmt = (n) => `Rs.${(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`

  // Shareholder cash on hand
  const shCash = () => {
    const cash = { Ammi: 0, Alka: 0, Jahanzeb: 0, Memoona: 0, Waleed: 0 }
    transactions.forEach(t => {
      if (t.method !== 'cash') return
      const amt = parseFloat(t.amount) || 0
      const sign = t.type === 'income' ? 1 : -1
      if (t.isCommon || t.shareholder === 'All') {
        SHAREHOLDERS.forEach(sh => { cash[sh] += sign * amt * SHARE_RATIOS[sh] / TOTAL_SHARE })
      } else if (t.shareholder && cash[t.shareholder] !== undefined) {
        cash[t.shareholder] += sign * amt
      }
    })
    return cash
  }

  // Account balances (credit transactions)
  const accountBalances = (accs) => {
    const bal = {}
    accs.forEach(a => { bal[a] = 0 })
    transactions.forEach(t => {
      if (accs.includes(t.account)) {
        const amt = parseFloat(t.amount) || 0
        bal[t.account] = (bal[t.account] || 0) + (t.type === 'income' ? amt : -amt)
      }
    })
    return bal
  }

  // Deposits grouped by shareholder (last 6 per shareholder)
  const depositsByUser = () => {
    const byUser = {}
    SHAREHOLDERS.forEach(sh => { byUser[sh] = [] })
    deposits.forEach(d => {
      SHAREHOLDERS.forEach(sh => {
        if (d.amounts && d.amounts[sh] > 0) {
          byUser[sh].push({ date: d.date, amount: d.amounts[sh] })
        }
      })
    })
    return byUser
  }

  const cashOnHand = shCash()
  const payable = accountBalances(PAYABLE_ACCOUNTS)
  const receivable = accountBalances(RECEIVABLE_ACCOUNTS)
  const depByUser = depositsByUser()
  const last15 = transactions.filter(t => !t.isDeposit).slice(0, 15)

  const refresh = () => {
    setRefreshMsg('📊 Data refreshed successfully!')
    setTimeout(() => setRefreshMsg(''), 3000)
  }

  // Export functions
  const exportCSV = () => {
    const rows = [['Date', 'Description', 'Amount', 'Account', 'Type', 'Method']]
    transactions.forEach(t => rows.push([t.date, t.description, t.amount, t.account, t.type, t.method]))
    const csv = rows.map(r => r.join(',')).join('\n')
    download('transactions.csv', csv, 'text/csv')
  }

  const exportJSON = () => download('transactions.json', JSON.stringify(transactions, null, 2), 'application/json')

  const exportPDF = () => window.print()

  const download = (name, content, type) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([content], { type }))
    a.download = name
    a.click()
  }

  if (loading) return <div className="loading">Loading data...</div>

  return (
    <div>
      <Navbar navigate={navigate} refresh={refresh} />
      <div className="page-wrapper">
        <h1 className="page-title">Financial Dashboard</h1>
        {refreshMsg && <div className="alert alert-success">{refreshMsg}</div>}

        {/* Recent Bank Deposits */}
        <div className="card">
          <div className="section-title">Recent Bank Deposits</div>
          <div className="deposits-grid">
            {SHAREHOLDERS.map(sh => (
              <div className="deposit-history-card" key={sh}>
                <div className="deposit-history-name">{sh}</div>
                {depByUser[sh].slice(0, 6).length === 0
                  ? <div style={{ fontSize: '0.8rem', color: '#aaa' }}>No deposits yet</div>
                  : depByUser[sh].slice(0, 6).map((d, i) => (
                    <div className="deposit-entry" key={i}>
                      <span>{d.date}</span>
                      <span style={{ fontWeight: 600 }}>Rs.{(d.amount).toLocaleString('en-PK')}</span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* Last 15 Transactions */}
        <div className="card">
          <div className="section-title">Last 15 Transactions</div>
          <div className="table-wrap">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {last15.map(t => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.description}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(t.amount)}</td>
                    <td>{t.account}</td>
                    <td>
                      <span className={`badge badge-${t.type}`}>
                        {t.type?.charAt(0).toUpperCase() + t.type?.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${t.method}`}>
                        {t.method?.charAt(0).toUpperCase() + t.method?.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                {last15.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>No transactions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Accounts Payable */}
        <div className="card">
          <div className="section-title">Accounts Payable Balances</div>
          <div className="accounts-grid">
            {PAYABLE_ACCOUNTS.map(acc => (
              <div className="account-balance-card" key={acc}>
                <div className="account-balance-info">
                  <div className="account-balance-name">{acc}</div>
                  <div className="account-balance-num">Account #{ACCOUNT_NUMBERS[acc]}</div>
                </div>
                <div className="account-balance-amount">{fmt(payable[acc])}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Accounts Receivable */}
        <div className="card">
          <div className="section-title">Accounts Receivable Balances</div>
          <div className="accounts-grid">
            {RECEIVABLE_ACCOUNTS.map(acc => (
              <div className="account-balance-card" key={acc}>
                <div className="account-balance-info">
                  <div className="account-balance-name">{acc}</div>
                  <div className="account-balance-num">Account #{ACCOUNT_NUMBERS[acc]}</div>
                </div>
                <div className="account-balance-amount">{fmt(receivable[acc])}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Shareholder Cash on Hand */}
        <div className="card">
          <div className="section-title">Shareholder Cash on Hand</div>
          <div className="sh-balances">
            {SHAREHOLDERS.map(sh => (
              <div className="sh-balance-card" key={sh}>
                <div className="sh-balance-name">{sh}</div>
                <div className={`sh-balance-amount ${cashOnHand[sh] < 0 ? 'negative' : ''}`}>
                  {fmt(cashOnHand[sh])}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="card">
          <div className="section-title">Export Data</div>
          <div className="export-buttons">
            <button className="btn-export" onClick={exportCSV}>📄 Export to CSV</button>
            <button className="btn-export" onClick={exportPDF}>🖨️ Export to PDF</button>
            <button className="btn-export" onClick={exportJSON}>📦 Export to JSON</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Navbar({ navigate, refresh }) {
  return (
    <div className="navbar">
      <button onClick={() => navigate('/')}>← Home</button>
      <button onClick={() => navigate('/transaction')}>Add</button>
      <button onClick={() => navigate('/deposit')}>Deposit</button>
      <button onClick={() => navigate('/admin')}>Admin</button>
      <button onClick={refresh}>Refresh Data</button>
    </div>
  )
}
