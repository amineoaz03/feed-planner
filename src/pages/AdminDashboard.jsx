import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_authed') === 'true')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [clients, setClients] = useState([])
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (authed) fetchClients()
  }, [authed])

  async function fetchClients() {
    const { data } = await supabase
      .from('clients')
      .select('*, photos(count)')
      .order('created_at', { ascending: true })
    setClients(data || [])
  }

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authed', 'true')
      setAuthed(true)
      setError('')
    } else {
      setError('Wrong password')
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    const slug = slugify(newName)
    const { error } = await supabase.from('clients').insert({ name: newName.trim(), slug })
    if (error) {
      alert(error.message)
    } else {
      setNewName('')
      fetchClients()
    }
    setCreating(false)
  }

  async function handleRename(id) {
    if (!renameValue.trim()) return
    const slug = slugify(renameValue)
    await supabase.from('clients').update({ name: renameValue.trim(), slug }).eq('id', id)
    setRenamingId(null)
    setRenameValue('')
    fetchClients()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this client and all their photos?')) return
    await supabase.from('clients').delete().eq('id', id)
    fetchClients()
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 p-8 w-80 rounded-2xl shadow-sm">
          <h1 className="text-lg font-bold mb-1">Admin Login</h1>
          <p className="text-sm text-gray-400 mb-6">Enter your password to continue</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="border border-gray-200 rounded-xl p-3 w-full mb-2 text-sm outline-none focus:border-gray-400"
            placeholder="Password"
            autoFocus
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
        <button
          onClick={() => { sessionStorage.removeItem('admin_authed'); setAuthed(false) }}
          className="text-xs text-gray-400 hover:text-gray-700"
        >
          Logout
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <span className="text-sm text-gray-400">{clients.length} account{clients.length !== 1 ? 's' : ''}</span>
        </div>

        {/* client list */}
        <div className="space-y-3 mb-8">
          {clients.map(client => (
            <div key={client.id} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                {client.name[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                {renamingId === client.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(client.id); if (e.key === 'Escape') setRenamingId(null) }}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-gray-500 flex-1"
                      autoFocus
                    />
                    <button onClick={() => handleRename(client.id)} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg">Save</button>
                    <button onClick={() => setRenamingId(null)} className="text-xs text-gray-400 hover:text-gray-700">Cancel</button>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-sm text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">/{client.slug}</p>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate(`/admin/${client.slug}`)}
                  className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700"
                >
                  Manage
                </button>
                <button
                  onClick={() => { setRenamingId(client.id); setRenameValue(client.name) }}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-gray-400"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-400 hover:border-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {clients.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No clients yet. Create your first one below.</p>
          )}
        </div>

        {/* create new client */}
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">New client</p>
          <div className="flex gap-3">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Client name"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm hover:bg-gray-700 disabled:opacity-40"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
