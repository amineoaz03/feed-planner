import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import PhoneMockup from '../components/PhoneMockup'
import PhotoGrid from '../components/PhotoGrid'

export default function Client() {
  const [photos, setPhotos] = useState([])
  const updatingRef = useRef(false)

  useEffect(() => {
    fetchPhotos()

    const channel = supabase
      .channel('client-photos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'photos' },
        () => {
          if (!updatingRef.current) fetchPhotos()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchPhotos() {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('position', { ascending: true })
    setPhotos(data || [])
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

  async function handleDelete(id) {
    updatingRef.current = true
    await supabase.from('photos').delete().eq('id', id)
    updatingRef.current = false
    fetchPhotos()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-xl font-bold mb-6">Feed Preview</h1>
      <PhoneMockup>
        <PhotoGrid
          photos={photos}
          onReorder={handleReorder}
          onDelete={handleDelete}
        />
      </PhoneMockup>
      <p className="text-xs text-gray-400 mt-4">
        Drag to reorder · Hover to delete
      </p>
    </div>
  )
}
