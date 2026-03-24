import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

const SHAREHOLDERS = ['Ammi', 'Alka', 'Jahanzeb', 'Memoona', 'Waleed']

export default function Admin() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ count: 0, total: 0, lastDate: '-', accounts: 0, shareholders: 5 })
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'transactions'), snap => {
      let total = 0, lastDate = '-'
      const accounts = new Set()
      snap.forEach(d => {
        const t = d.data()
        total += parseFloat(t.amount) || 0
        if (t.account) accounts.add(t.account)
        if (t.dateISO && (!lastDate || t.dateISO > lastDate)) lastDate = t.dateISO
      })
      setStats({
        count: snap.size,
        total,
        lastDate: lastDate !== '-' ? new Date(lastDate).toLocaleString() : '-',
        accounts: accounts.size,
        shareholders: SHAREHOLDERS.length,
      })
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const fmt = (n) => n.toLocaleString('en-PK', { maximumFractionDigits: 3 })

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 4000) }

  const exportJSON = async () => {
    const snap = await getDocs(query(collection(db, 'transactions'), orderBy('timestamp', 'desc')))
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    a.download = 'hamara-hisab-backup.json'
    a.click()
    showMsg('✅ Export complete!')
  }

  const validateData = async () => {
    const snap = await getDocs(collection(db, 'transactions'))
    let issues = 0
    snap.forEach(d => {
      const t = d.data()
      if (!t.amount || !t.type || !t.account) issues++
    })
    showMsg(issues === 0 ? '✅ All data valid!' : `⚠️ Found ${issues} records with missing fields.`)
  }

  const clearAllData = async () => {
    if (!window.confirm('⚠️ This will delete ALL transactions permanently. Are you absolutely sure?')) return
    if (!window.confirm('Last chance! Click OK to permanently delete all data.')) return
    const snap = await getDocs(collection(db, 'transactions'))
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'transactions', d.id))))
    const snapD = await getDocs(collection(db, 'deposits'))
    await Promise.all(snapD.docs.map(d => deleteDoc(doc(db, 'deposits', d.id))))
    showMsg('🗑️ All data cleared.')
  }

  const viewShareholders = () => {
    alert('Shareholders:\n' + SHAREHOLDERS.map((s, i) => `${i + 1}. ${s}`).join('\n'))
  }

  const viewAccounts = () => {
    const income = ['ALMEEZAN', 'NEW ALMEEZAN', 'NEW ALADEEL', 'OLD ALADEEL', 'GULZAR', 'AZAM', 'ABDUL REHMAN', 'SHIKOO', 'RASHEED', 'MUNSHI', 'ASHIQ BUT', 'ASAD BUTTER', 'MASTER SB']
    const expense = ['GENERAL EXPENSE', 'BANK DEPOSIT', 'SHAMIM', 'NAILA', 'AMMI 8 Acer', 'MASJID', 'WELFAIR']
    alert('INCOME ACCOUNTS:\n' + income.join(', ') + '\n\nEXPENSE ACCOUNTS:\n' + expense.join(', '))
  }

  return (
    <div>
      <div className="navbar">
        <button onClick={() => navigate('/')}>← Home</button>
        <button onClick={() => navigate('/transaction')}>Add</button>
        <button onClick={() => navigate('/report')}>Reports</button>
      </div>

      <div className="page-wrapper">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Manage your database and settings</p>

        {msg && <div className="alert alert-success">{msg}</div>}

        {/* Stats */}
        <div className="card">
          <div className="section-title">📊 Database Statistics</div>
          {loading ? <div className="loading">Loading...</div> : (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Transactions</div>
                <div className="stat-value">{stats.count.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Amount</div>
                <div className="stat-value" style={{ fontSize: '0.95rem' }}>{fmt(stats.total)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Accounts</div>
                <div className="stat-value">{stats.accounts}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Shareholders</div>
                <div className="stat-value">{stats.shareholders}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Last Transaction</div>
                <div className="stat-value" style={{ fontSize: '0.85rem' }}>{stats.lastDate}</div>
              </div>
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <button className="btn-tool" onClick={() => window.location.reload()}>🔄 Refresh Statistics</button>
          </div>
        </div>

        {/* Shareholder Management */}
        <div className="card">
          <div className="section-title">👥 Shareholder Management</div>
          <div className="tool-buttons">
            <button className="btn-tool" onClick={viewShareholders}>📋 View Shareholder Details</button>
          </div>
        </div>

        {/* Account Management */}
        <div className="card">
          <div className="section-title">📁 Account Management</div>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 14 }}>
            <div>Income Accounts: ALMEEZAN, NEW ALMEEZAN, NEW ALADEEL, OLD ALADEEL, GULZAR, AZAM, ABDUL REHMAN, SHIKOO, RASHEED, MUNSHI, ASHIQ BUT, ASAD BUTTER, MASTER SB</div>
            <div style={{ marginTop: 6 }}>Expense Accounts: GENERAL EXPENSE, BANK DEPOSIT, SHAMIM, NAILA, AMMI 8 Acer, MASJID, WELFAIR</div>
          </div>
          <div className="tool-buttons">
            <button className="btn-tool" onClick={viewAccounts}>📋 View All Accounts</button>
          </div>
        </div>

        {/* Database Tools */}
        <div className="card">
          <div className="section-title">🔧 Database Tools</div>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 14 }}>Tools for managing the transaction database:</p>
          <div className="tool-buttons">
            <button className="btn-tool" onClick={exportJSON}>📤 Export Data (JSON)</button>
            <button className="btn-tool" onClick={validateData}>✅ Validate Data</button>
            <button className="btn-tool" onClick={exportJSON}>💾 Create Backup</button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card danger-zone">
          <div className="danger-title">⚠️ Danger Zone</div>
          <div className="danger-warning">⚠️ Warning: These actions are irreversible!</div>
          <div className="tool-buttons">
            <button className="btn-danger" onClick={clearAllData}>🗑️ Clear All Data</button>
            <button className="btn-danger" onClick={clearAllData}>🔄 Reset Database</button>
          </div>
        </div>
      </div>
    </div>
  )
}
