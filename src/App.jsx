import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Transaction from './pages/Transaction'
import Deposit from './pages/Deposit'
import Report from './pages/Report'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/transaction" element={<Transaction />} />
      <Route path="/deposit" element={<Deposit />} />
      <Route path="/report" element={<Report />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}
