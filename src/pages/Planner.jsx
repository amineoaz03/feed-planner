import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'

function Lightbox({ url, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 bg-white text-black text-xl flex items-center justify-center rounded-full"
      >
        ×
      </button>
      <img
        src={url}
        alt=""
        onClick={e => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
      />
    </div>
  )
}

const STATUSES = ['Draft', 'In Review', 'Approved']

const STATUS_STYLES = {
  'Draft': 'bg-gray-100 text-gray-600',
  'In Review': 'bg-yellow-100 text-yellow-700',
  'Approved': 'bg-green-100 text-green-700',
}

export default function Planner() {
  const [photos, setPhotos] = useState([])
  const [zoomed, setZoomed] = useState(null)
  const timers = useRef({})
  const updatingRef = useRef(false)

  useEffect(() => {
    fetchPhotos()

    const channel = supabase
      .channel('planner-photos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'photos' },
        () => { if (!updatingRef.current) fetchPhotos() }
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

  function handleChange(id, field, value) {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))

    const key = id + field
    clearTimeout(timers.current[key])
    timers.current[key] = setTimeout(async () => {
      updatingRef.current = true
      await supabase.from('photos').update({ [field]: value }).eq('id', id)
      updatingRef.current = false
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {zoomed && <Lightbox url={zoomed} onClose={() => setZoomed(null)} />}
      <Nav />

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Content Planner</h1>
          <span className="text-xs text-gray-400">{photos.length} posts · auto-saves</span>
        </div>

        <div className="bg-white border border-gray-200 overflow-x-auto">
          {/* header */}
          <div className="grid grid-cols-[60px_100px_160px_1fr_150px] min-w-[700px] bg-gray-50 border-b border-gray-200">
            <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase border-l border-gray-200">Photo</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase border-l border-gray-200">Date</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase border-l border-gray-200">Caption</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase border-l border-gray-200">Status</div>
          </div>

          {/* rows */}
          {photos.length === 0 && (
            <div className="py-16 text-center text-sm text-gray-400">
              No photos yet — upload from the Admin page first.
            </div>
          )}

          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="grid grid-cols-[60px_100px_160px_1fr_150px] min-w-[700px] border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {/* index */}
              <div className="px-4 flex items-center text-sm text-gray-400 font-mono">
                {i + 1}
              </div>

              {/* photo */}
              <div className="px-3 py-2 border-l border-gray-100 flex items-center">
                <img
                  src={photo.url}
                  alt=""
                  loading="lazy"
                  onClick={() => setZoomed(photo.url)}
                  className="w-14 h-[70px] object-cover cursor-zoom-in"
                />
              </div>

              {/* date */}
              <div className="px-4 border-l border-gray-100 flex items-center">
                <input
                  type="date"
                  value={photo.date || ''}
                  onChange={e => handleChange(photo.id, 'date', e.target.value)}
                  className="w-full text-sm bg-transparent outline-none cursor-pointer text-gray-700"
                />
              </div>

              {/* caption */}
              <div className="px-4 py-3 border-l border-gray-100">
                <textarea
                  value={photo.caption || ''}
                  onChange={e => handleChange(photo.id, 'caption', e.target.value)}
                  placeholder="Write your caption here…"
                  rows={3}
                  className="w-full text-sm bg-transparent outline-none resize-none text-gray-700 placeholder-gray-300 leading-relaxed"
                />
              </div>

              {/* status */}
              <div className="px-4 border-l border-gray-100 flex items-center">
                <select
                  value={photo.status || 'Draft'}
                  onChange={e => handleChange(photo.id, 'status', e.target.value)}
                  className={`text-xs px-3 py-1.5 rounded-full outline-none cursor-pointer w-full text-center font-medium ${STATUS_STYLES[photo.status] || STATUS_STYLES['Draft']}`}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
