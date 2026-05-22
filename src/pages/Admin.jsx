import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PhoneMockup from '../components/PhoneMockup'
import PhotoGrid from '../components/PhotoGrid'
import Nav from '../components/Nav'
import { compressImage } from '../lib/compress'

export default function Admin() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const authed = sessionStorage.getItem('admin_authed') === 'true'

  const [client, setClient] = useState(null)
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const updatingRef = useRef(false)

  useEffect(() => {
    if (!authed) { navigate('/admin'); return }
    fetchClient()
  }, [slug])

  async function fetchClient() {
    const { data } = await supabase.from('clients').select('*').eq('slug', slug).single()
    if (!data) { navigate('/admin'); return }
    setClient(data)
    fetchPhotos(data.id)

    const channel = supabase
      .channel(`admin-${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' },
        () => { if (!updatingRef.current) fetchPhotos(data.id) }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  async function fetchPhotos(clientId) {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('client_id', clientId)
      .order('position', { ascending: true })
    setPhotos(data || [])
  }

  async function handleUpload(e) {
    if (!client) return
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    updatingRef.current = true

    const { data: existing } = await supabase
      .from('photos')
      .select('position')
      .eq('client_id', client.id)
      .order('position', { ascending: false })
      .limit(1)

    let nextPos = existing?.[0]?.position != null ? existing[0].position + 1 : 0

    for (const file of files) {
      const compressed = await compressImage(file)
      const storagePath = `${client.slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('feed-photos')
        .upload(storagePath, compressed, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false })
      if (uploadError) continue
      const { data: { publicUrl } } = supabase.storage.from('feed-photos').getPublicUrl(storagePath)
      await supabase.from('photos').insert({ url: publicUrl, storage_path: storagePath, position: nextPos++, client_id: client.id })
    }

    e.target.value = ''
    setUploading(false)
    updatingRef.current = false
    fetchPhotos(client.id)
  }

  async function handleReorder(reordered) {
    setPhotos(reordered)
    updatingRef.current = true
    await Promise.all(reordered.map((photo, index) =>
      supabase.from('photos').update({ position: index }).eq('id', photo.id)
    ))
    updatingRef.current = false
  }

  async function handleDelete(id, storagePath) {
    updatingRef.current = true
    await supabase.from('photos').delete().eq('id', id)
    if (storagePath) await supabase.storage.from('feed-photos').remove([storagePath])
    updatingRef.current = false
    fetchPhotos(client.id)
  }

  if (!client) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{photos.length} photos</p>
          </div>
          <label className={`cursor-pointer px-4 py-2 text-sm rounded-xl border border-gray-900 ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-900 hover:text-white'} transition-colors`}>
            {uploading ? 'Uploading…' : 'Upload Photos'}
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        <div className="flex gap-12 items-start">
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-400 mb-3 text-center">Preview</p>
            <PhoneMockup editMode={editMode} onToggleEdit={() => setEditMode(e => !e)}>
              <PhotoGrid
                photos={photos}
                onReorder={editMode ? handleReorder : null}
                onDelete={editMode ? handleDelete : null}
                editMode={editMode}
              />
            </PhoneMockup>
          </div>

          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-3">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-4 gap-1">
              {photos.map((photo, i) => (
                <div key={photo.id} className="relative group aspect-[4/5] bg-gray-100">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-xs px-1">{i + 1}</div>
                  <button
                    onClick={() => handleDelete(photo.id, photo.storage_path)}
                    className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >×</button>
                </div>
              ))}
            </div>
            {photos.length === 0 && <p className="text-sm text-gray-400">Upload photos to get started.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
