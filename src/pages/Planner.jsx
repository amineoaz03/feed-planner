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
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center rounded-full border border-white/20"
      >
        ×
      </button>
      <img
        src={url}
        alt=""
        onClick={e => e.stopPropagation()}
        className="max-h-[88vh] max-w-[88vw] object-contain rounded-lg shadow-2xl"
      />
    </div>
  )
}

const STATUSES = ['Draft', 'In Review', 'Approved']

const STATUS_STYLES = {
  'Draft':     'bg-gray-100 text-gray-500 border border-gray-200',
  'In Review': 'bg-amber-50 text-amber-600 border border-amber-200',
  'Approved':  'bg-emerald-50 text-emerald-600 border border-emerald-200',
}

const STATUS_DOT = {
  'Draft':     'bg-gray-400',
  'In Review': 'bg-amber-400',
  'Approved':  'bg-emerald-400',
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

  const approved = photos.filter(p => p.status === 'Approved').length
  const inReview = photos.filter(p => p.status === 'In Review').length

  return (
    <div className="min-h-screen bg-gray-50">
      {zoomed && <Lightbox url={zoomed} onClose={() => setZoomed(null)} />}
      <Nav />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* page header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Content Planner</h1>
            <p className="text-sm text-gray-400 mt-1">Plan, write captions and track approval with your client.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-center shadow-sm">
              <p className="text-xl font-bold text-gray-800">{photos.length}</p>
              <p className="text-xs text-gray-400">Posts</p>
            </div>
            <div className="bg-white border border-amber-200 rounded-xl px-4 py-2 text-center shadow-sm">
              <p className="text-xl font-bold text-amber-500">{inReview}</p>
              <p className="text-xs text-gray-400">In Review</p>
            </div>
            <div className="bg-white border border-emerald-200 rounded-xl px-4 py-2 text-center shadow-sm">
              <p className="text-xl font-bold text-emerald-500">{approved}</p>
              <p className="text-xs text-gray-400">Approved</p>
            </div>
          </div>
        </div>

        {/* table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">

          {/* table header */}
          <div className="grid grid-cols-[52px_88px_170px_1fr_160px] min-w-[680px] bg-gray-50 border-b border-gray-200">
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">#</div>
            <div className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Photo</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Caption</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</div>
          </div>

          {photos.length === 0 && (
            <div className="py-20 text-center text-sm text-gray-400">
              No photos yet — upload from the Admin page first.
            </div>
          )}

          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="grid grid-cols-[52px_88px_170px_1fr_160px] min-w-[680px] border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition-colors group"
            >
              {/* index */}
              <div className="px-4 flex items-center">
                <span className="text-xs font-mono text-gray-300 group-hover:text-gray-400 transition-colors">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              {/* photo */}
              <div className="px-3 py-3 flex items-center">
                <div className="relative overflow-hidden rounded-lg shadow-sm">
                  <img
                    src={photo.url}
                    alt=""
                    loading="lazy"
                    onClick={() => setZoomed(photo.url)}
                    className="w-14 h-[72px] object-cover cursor-zoom-in hover:scale-105 transition-transform duration-200"
                  />
                </div>
              </div>

              {/* date */}
              <div className="px-4 flex items-center border-l border-gray-100">
                <input
                  type="date"
                  value={photo.date || ''}
                  onChange={e => handleChange(photo.id, 'date', e.target.value)}
                  className="w-full text-sm bg-transparent outline-none cursor-pointer text-gray-600 focus:text-gray-900"
                />
              </div>

              {/* caption */}
              <div className="px-4 py-4 border-l border-gray-100">
                <textarea
                  value={photo.caption || ''}
                  onChange={e => handleChange(photo.id, 'caption', e.target.value)}
                  placeholder="Write your caption here…"
                  rows={3}
                  className="w-full text-sm bg-transparent outline-none resize-none text-gray-700 placeholder-gray-300 leading-relaxed focus:placeholder-gray-200"
                />
              </div>

              {/* status */}
              <div className="px-4 flex items-center border-l border-gray-100">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full w-full ${STATUS_STYLES[photo.status] || STATUS_STYLES['Draft']}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[photo.status] || STATUS_DOT['Draft']}`} />
                  <select
                    value={photo.status || 'Draft'}
                    onChange={e => handleChange(photo.id, 'status', e.target.value)}
                    className="text-xs font-medium outline-none cursor-pointer bg-transparent flex-1"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-300 text-right mt-4">Changes save automatically</p>
      </div>
    </div>
  )
}
