import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function StaffDashboard() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('staff_authed') === 'true')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [clients, setClients] = useState([])
  const [staffName, setStaffName] = useState(() => sessionStorage.getItem('staff_name') || '')
  const navigate = useNavigate()

  useEffect(() => {
    if (authed) fetchClients()
  }, [authed])

  async function fetchClients() {
    const staffId = sessionStorage.getItem('staff_id')
    const { data } = await supabase
      .from('staff_clients')
      .select('clients(*)')
      .eq('staff_id', staffId)
    setClients((data || []).map(row => row.clients).filter(Boolean))
  }

  async function handleLogin() {
    if (!name.trim() || !password) return
    const { data, error: fetchError } = await supabase
      .from('staff')
      .select('*')
      .ilike('name', name.trim())
      .single()

    if (fetchError || !data || data.password !== password) {
      setError('Wrong name or password')
      return
    }

    sessionStorage.setItem('staff_authed', 'true')
    sessionStorage.setItem('staff_id', data.id)
    sessionStorage.setItem('staff_name', data.name)
    setStaffName(data.name)
    setAuthed(true)
    setError('')
  }

  function handleLogout() {
    sessionStorage.removeItem('staff_authed')
    sessionStorage.removeItem('staff_id')
    sessionStorage.removeItem('staff_name')
    setAuthed(false)
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 p-8 w-80 rounded-2xl shadow-sm">
          <h1 className="text-lg font-bold mb-1">Staff Login</h1>
          <p className="text-sm text-gray-400 mb-6">Enter your name and password</p>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="border border-gray-200 rounded-xl p-3 w-full mb-2 text-sm outline-none focus:border-gray-400"
            placeholder="Name"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="border border-gray-200 rounded-xl p-3 w-full mb-2 text-sm outline-none focus:border-gray-400"
            placeholder="Password"
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <button
            onClick={handleLogin}
            className="bg-gray-900 text-white px-4 py-3 w-full text-sm rounded-xl hover:bg-gray-700"
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-sm">Feed Planner</span>
        <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-700">
          Logout
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
            <p className="text-sm text-gray-400 mt-1">Signed in as {staffName}</p>
          </div>
          <span className="text-sm text-gray-400">{clients.length} account{clients.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="space-y-3">
          {clients.map(client => (
            <div key={client.id} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                {client.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{client.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">/{client.slug}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate(`/planner/${client.slug}`)}
                  className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700"
                >
                  Planner
                </button>
                <button
                  onClick={() => navigate(`/videos/${client.slug}`)}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-gray-400"
                >
                  Videos
                </button>
              </div>
            </div>
          ))}

          {clients.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No clients assigned to you yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
