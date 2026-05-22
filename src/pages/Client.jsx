import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PhoneMockup from '../components/PhoneMockup'
import PhotoGrid from '../components/PhotoGrid'
import Nav from '../components/Nav'

export default function Client() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [photos, setPhotos] = useState([])
  const [editMode, setEditMode] = useState(false)
  const updatingRef = useRef(false)

  useEffect(() => {
    fetchClient()
  }, [slug])

  async function fetchClient() {
    const { data } = await supabase.from('clients').select('*').eq('slug', slug).single()
    if (!data) { navigate('/admin'); return }
    setClient(data)
    fetchPhotos(data.id)

    const channel = supabase
      .channel(`client-${slug}`)
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

  async function handleReorder(reordered) {
    setPhotos(reordered)
    updatingRef.current = true
    await Promise.all(reordered.map((photo, index) =>
      supabase.from('photos').update({ position: index }).eq('id', photo.id)
    ))
    updatingRef.current = false
  }

  async function handleDelete(id) {
    updatingRef.current = true
    await supabase.from('photos').delete().eq('id', id)
    updatingRef.current = false
    if (client) fetchPhotos(client.id)
  }

  if (!client) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="flex flex-col items-center justify-center p-6 pt-10">
        <h1 className="text-xl font-bold mb-6">{client.name}</h1>
        <PhoneMockup editMode={editMode} onToggleEdit={() => setEditMode(e => !e)}>
          <PhotoGrid
            photos={photos}
            onReorder={editMode ? handleReorder : null}
            onDelete={editMode ? handleDelete : null}
            editMode={editMode}
          />
        </PhoneMockup>
      </div>
    </div>
  )
}
