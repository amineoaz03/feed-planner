import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import PhoneMockup from '../components/PhoneMockup'
import PhotoGrid from '../components/PhotoGrid'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const updatingRef = useRef(false)

  useEffect(() => {
    if (!authed) return

    fetchPhotos()

    const channel = supabase
      .channel('admin-photos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'photos' },
        () => {
          if (!updatingRef.current) fetchPhotos()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [authed])

  async function fetchPhotos() {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('position', { ascending: true })
    setPhotos(data || [])
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    updatingRef.current = true

    const { data: existing } = await supabase
      .from('photos')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)

    let nextPos = existing?.[0]?.position != null ? existing[0].position + 1 : 0

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('feed-photos')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('feed-photos')
        .getPublicUrl(storagePath)

      await supabase.from('photos').insert({
        url: publicUrl,
        storage_path: storagePath,
        position: nextPos++,
      })
    }

    e.target.value = ''
    setUploading(false)
    updatingRef.current = false
    fetchPhotos()
  }

  async function handleReorder(reordered) {
    setPhotos(reordered)
    updatingRef.current = true
    await Promise.all(
      reordered.map((photo, index) =>
        supabase.from('photos').update({ position: index }).eq('id', photo.id)
      )
    )
    updatingRef.current = false
  }

  async function handleDelete(id, storagePath) {
    updatingRef.current = true
    await supabase.from('photos').delete().eq('id', id)
    if (storagePath) {
      await supabase.storage.from('feed-photos').remove([storagePath])
    }
    updatingRef.current = false
    fetchPhotos()
  }

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      setError('')
    } else {
      setError('Wrong password')
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 p-8 w-80">
          <h1 className="text-lg font-bold mb-6">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="border border-gray-300 p-2 w-full mb-2 text-sm outline-none focus:border-gray-500"
            placeholder="Password"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <button
            onClick={handleLogin}
            className="bg-black text-white px-4 py-2 w-full text-sm hover:bg-gray-800"
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold">Feed Planner — Admin</h1>
          <label className={`cursor-pointer px-4 py-2 text-sm border border-black ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black hover:text-white'}`}>
            {uploading ? 'Uploading…' : 'Upload Photos'}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        <div className="flex gap-12 items-start">
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-500 mb-3 text-center">Preview</p>
            <PhoneMockup>
              <PhotoGrid
                photos={photos}
                onReorder={handleReorder}
                onDelete={handleDelete}
              />
            </PhoneMockup>
          </div>

          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-3">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} in feed
            </p>
            <div className="grid grid-cols-4 gap-1">
              {photos.map((photo, i) => (
                <div key={photo.id} className="relative group aspect-square bg-gray-100">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-xs px-1">
                    {i + 1}
                  </div>
                  <button
                    onClick={() => handleDelete(photo.id, photo.storage_path)}
                    className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {photos.length === 0 && (
              <p className="text-sm text-gray-400">Upload photos to get started.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
