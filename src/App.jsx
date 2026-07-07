import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import Admin from './pages/Admin'
import Client from './pages/Client'
import Planner from './pages/Planner'
import Videos from './pages/Videos'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/:slug" element={<Admin />} />
        <Route path="/planner/:slug" element={<Planner />} />
        <Route path="/videos/:slug" element={<Videos />} />
        <Route path="/:slug" element={<Client />} />
      </Routes>
    </BrowserRouter>
  )
}
