import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Admin from './pages/Admin'
import Client from './pages/Client'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Client />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
