import { useState, useEffect, useRef, forwardRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/compress'
import Nav from '../components/Nav'

const DateChip = forwardRef(({ value, onClick, onClear }, ref) => {
  const formatted = value
    ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  return formatted ? (
    <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5 w-fit">
      <button ref={ref} onClick={onClick} className="text-xs text-gray-700 font-medium whitespace-nowrap">
        {formatted}
      </button>
      <button onClick={e => { e.stopPropagation(); onClear() }} className="text-gray-400 hover:text-gray-700 text-xs leading-none">
        ×
      </button>
    </div>
  ) : (
    <button ref={ref} onClick={onClick} className="text-xs text-gray-300 hover:text-gray-500 transition-colors">
      Add date
    </button>
  )
})

function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <circle cx="4" cy="2" r="1.2"/><circle cx="8" cy="2" r="1.2"/>
      <circle cx="4" cy="6" r="1.2"/><circle cx="8" cy="6" r="1.2"/>
      <circle cx="4" cy="10" r="1.2"/><circle cx="8" cy="10" r="1.2"/>
    </svg>
  )
}

const POST_TYPES = ['Photo', 'Carousel', 'Reel', 'Story', 'Event']

const TYPE_STYLES = {
  'Photo':    'bg-blue-50 text-blue-600 border-blue-200',
  'Carousel': 'bg-purple-50 text-purple-600 border-purple-200',
  'Reel':     'bg-orange-50 text-orange-600 border-orange-200',
  'Story':    'bg-green-50 text-green-600 border-green-200',
  'Event':    'bg-red-50 text-red-600 border-red-200',
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

function Lightbox({ url, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center rounded-full border border-white/20">×</button>
      <img src={url} alt="" onClick={e => e.stopPropagation()} className="max-h-[88vh] max-w-[88vw] object-contain rounded-lg shadow-2xl" />
    </div>
  )
}

function CarouselStrip({ images = [], photoId, slug, onUpdate }) {
  const [uploading, setUploading] = useState(false)
  const [zoomed, setZoomed] = useState(null)

  async function handleUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const newImages = [...images]
    for (const file of files) {
      const compressed = await compressImage(file)
      const path = `${slug}/carousel/${photoId}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const { error } = await supabase.storage.from('feed-photos').upload(path, compressed, { contentType: 'image/jpeg', cacheControl: '3600' })
      if (error) continue
      const { data: { publicUrl } } = supabase.storage.from('feed-photos').getPublicUrl(path)
      newImages.push({ url: publicUrl, path })
    }
    e.target.value = ''
    setUploading(false)
    onUpdate(newImages)
  }

  async function handleRemove(index) {
    const img = images[index]
    const updated = images.filter((_, i) => i !== index)
    onUpdate(updated)
    if (img?.path) await supabase.storage.from('feed-photos').remove([img.path])
  }

  return (
    <>
      {zoomed && <Lightbox url={zoomed} onClose={() => setZoomed(null)} />}
      <div className="px-6 py-4 bg-purple-50/40 border-t border-purple-100">
        <p className="text-xs font-semibold text-purple-500 mb-3 uppercase tracking-wider">
          Carousel · {images.length} slide{images.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2 flex-wrap items-center">
          {images.map((img, i) => (
            <div key={i} className="relative group flex-shrink-0">
              <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full z-10">{i + 1}</div>
              <img src={img.url} alt="" loading="lazy" onClick={() => setZoomed(img.url)} className="w-16 h-20 object-cover rounded-lg cursor-zoom-in shadow-sm hover:scale-105 transition-transform duration-200" />
              <button onClick={() => handleRemove(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 z-10">×</button>
            </div>
          ))}
          <label className="flex-shrink-0 w-16 h-20 border-2 border-dashed border-purple-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
            {uploading ? <span className="text-purple-400 text-xs">…</span> : <><span className="text-purple-400 text-xl leading-none">+</span><span className="text-purple-400 text-[10px] mt-1">Add</span></>}
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>
    </>
  )
}

function SortableRow({ photo, slug, onZoom, onChange, onCarouselUpdate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 'auto',
    position: 'relative',
  }

  const isEvent = photo.post_type === 'Event'
  const isStory = photo.post_type === 'Story'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border-b last:border-0 group ${
        isEvent ? 'border-red-100 bg-red-50/30 border-l-4 border-l-red-400' :
        isStory ? 'border-green-100 bg-green-50/30 border-l-4 border-l-green-400' :
        'border-gray-100'
      }`}
    >
      <div className="grid grid-cols-[32px_88px_170px_1fr_150px_160px] min-w-[750px] hover:bg-black/[0.01] transition-colors">

        {/* drag handle */}
        <div
          {...attributes}
          {...listeners}
          style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
          className="flex items-center justify-center text-gray-300 hover:text-gray-500"
        >
          <GripIcon />
        </div>

        {/* photo */}
        <div className="px-2 py-3 flex items-center">
          <div className="relative overflow-hidden rounded-lg shadow-sm">
            <img
              src={photo.url}
              alt=""
              loading="lazy"
              onClick={() => onZoom(photo.url)}
              className="w-14 h-[72px] object-cover cursor-zoom-in hover:scale-105 transition-transform duration-200"
            />
          </div>
        </div>

        {/* date */}
        <div className="px-4 flex items-center border-l border-gray-100">
          <DatePicker
            selected={photo.date ? new Date(photo.date) : null}
            onChange={date => onChange(photo.id, 'date', date ? date.toISOString().split('T')[0] : null)}
            dateFormat="dd MMM yyyy"
            popperPlacement="bottom-start"
            customInput={
              <DateChip
                value={photo.date}
                onClear={() => onChange(photo.id, 'date', null)}
              />
            }
          />
        </div>

        {/* caption / name */}
        <div className={`px-4 py-3 border-l ${isEvent ? 'border-red-100' : isStory ? 'border-green-100' : 'border-gray-100'}`}>
          {isEvent && (
            <input
              value={photo.event_name || ''}
              onChange={e => onChange(photo.id, 'event_name', e.target.value)}
              placeholder="Event name…"
              className="w-full text-sm bg-transparent outline-none text-red-700 font-semibold placeholder-red-200 mb-2"
            />
          )}
          {isStory && (
            <input
              value={photo.event_name || ''}
              onChange={e => onChange(photo.id, 'event_name', e.target.value)}
              placeholder="Story name…"
              className="w-full text-sm bg-transparent outline-none text-green-700 font-semibold placeholder-green-200 mb-2"
            />
          )}
          <textarea
            value={photo.caption || ''}
            onChange={e => onChange(photo.id, 'caption', e.target.value)}
            placeholder="Write your caption here…"
            rows={isEvent || isStory ? 2 : 3}
            className="w-full text-sm bg-transparent outline-none resize-none text-gray-700 placeholder-gray-300 leading-relaxed"
          />
        </div>

        {/* type */}
        <div className="px-4 flex items-center border-l border-gray-100">
          <div className={`flex items-center px-3 py-1.5 rounded-full border w-full ${TYPE_STYLES[photo.post_type] || TYPE_STYLES['Photo']}`}>
            <select
              value={photo.post_type || 'Photo'}
              onChange={e => onChange(photo.id, 'post_type', e.target.value)}
              className="text-xs font-medium outline-none cursor-pointer bg-transparent flex-1"
            >
              {POST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* status */}
        <div className="px-4 flex items-center border-l border-gray-100">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full w-full ${STATUS_STYLES[photo.status] || STATUS_STYLES['Draft']}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[photo.status] || STATUS_DOT['Draft']}`} />
            <select
              value={photo.status || 'Draft'}
              onChange={e => onChange(photo.id, 'status', e.target.value)}
              className="text-xs font-medium outline-none cursor-pointer bg-transparent flex-1"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {photo.post_type === 'Carousel' && (
        <CarouselStrip
          images={photo.carousel_images || []}
          photoId={photo.id}
          slug={slug}
          onUpdate={imgs => onCarouselUpdate(photo.id, imgs)}
        />
      )}
    </div>
  )
}

export default function Planner() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [photos, setPhotos] = useState([])
  const [zoomed, setZoomed] = useState(null)
  const [uploading, setUploading] = useState(false)
  const timers = useRef({})
  const updatingRef = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  useEffect(() => {
    fetchClient()
  }, [slug])

  async function fetchClient() {
    const { data } = await supabase.from('clients').select('*').eq('slug', slug).single()
    if (!data) { navigate('/admin'); return }
    setClient(data)
    fetchPhotos(data.id)

    const channel = supabase
      .channel(`planner-${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' },
        () => { if (!updatingRef.current) fetchPhotos(data.id) }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  async function fetchPhotos(clientId) {
    const { data } = await supabase
      .from('photos').select('*').eq('client_id', clientId).order('position', { ascending: true })
    setPhotos(data || [])
  }

  function handleChange(id, field, value) {
    const dbValue = value === '' ? null : value
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, [field]: dbValue } : p))
    const key = id + field
    clearTimeout(timers.current[key])
    updatingRef.current = true
    timers.current[key] = setTimeout(async () => {
      await supabase.from('photos').update({ [field]: dbValue }).eq('id', id)
      updatingRef.current = false
    }, 500)
  }

  async function handleCarouselUpdate(id, newImages) {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, carousel_images: newImages } : p))
    updatingRef.current = true
    await supabase.from('photos').update({ carousel_images: newImages }).eq('id', id)
    updatingRef.current = false
  }

  async function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIndex = photos.findIndex(p => p.id === active.id)
    const newIndex = photos.findIndex(p => p.id === over.id)
    const reordered = arrayMove(photos, oldIndex, newIndex)
    setPhotos(reordered)
    updatingRef.current = true
    await Promise.all(reordered.map((photo, index) =>
      supabase.from('photos').update({ position: index }).eq('id', photo.id)
    ))
    updatingRef.current = false
  }

  async function handleUpload(e) {
    if (!client) return
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    updatingRef.current = true

    const { data: existing } = await supabase
      .from('photos').select('position').eq('client_id', client.id)
      .order('position', { ascending: false }).limit(1)

    let nextPos = existing?.[0]?.position != null ? existing[0].position + 1 : 0

    for (const file of files) {
      const compressed = await compressImage(file)
      const storagePath = `${client.slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const { error } = await supabase.storage.from('feed-photos')
        .upload(storagePath, compressed, { contentType: 'image/jpeg', cacheControl: '3600' })
      if (error) continue
      const { data: { publicUrl } } = supabase.storage.from('feed-photos').getPublicUrl(storagePath)
      await supabase.from('photos').insert({ url: publicUrl, storage_path: storagePath, position: nextPos++, client_id: client.id })
    }

    e.target.value = ''
    setUploading(false)
    updatingRef.current = false
    fetchPhotos(client.id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {zoomed && <Lightbox url={zoomed} onClose={() => setZoomed(null)} />}
      <Nav />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Content Planner</h1>
            {client && <p className="text-sm text-gray-400 mt-1">{client.name}</p>}
          </div>
          <label className={`cursor-pointer px-4 py-2 text-sm rounded-xl border border-gray-900 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-900 hover:text-white'}`}>
            {uploading ? 'Uploading…' : 'Add Photo'}
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">

          {/* header */}
          <div className="grid grid-cols-[32px_88px_170px_1fr_150px_160px] min-w-[750px] bg-gray-50 border-b border-gray-200">
            <div />
            <div className="px-2 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Photo</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Caption</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</div>
          </div>

          {photos.length === 0 && (
            <div className="py-20 text-center text-sm text-gray-400">
              No photos yet. Click "Add Photo" to get started.
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={photos.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {photos.map(photo => (
                <SortableRow
                  key={photo.id}
                  photo={photo}
                  slug={slug}
                  onZoom={setZoomed}
                  onChange={handleChange}
                  onCarouselUpdate={handleCarouselUpdate}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  )
}
