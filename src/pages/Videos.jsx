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

function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <circle cx="4" cy="2" r="1.2"/><circle cx="8" cy="2" r="1.2"/>
      <circle cx="4" cy="6" r="1.2"/><circle cx="8" cy="6" r="1.2"/>
      <circle cx="4" cy="10" r="1.2"/><circle cx="8" cy="10" r="1.2"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  )
}

function getYoutubeThumbnail(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null
}

function VideoThumbnail({ url }) {
  const thumb = getYoutubeThumbnail(url || '')

  if (thumb) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block relative flex-shrink-0">
        <img src={thumb} alt="" className="w-20 h-[52px] object-cover rounded-lg shadow-sm" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
              <polygon points="2,1 7,4 2,7"/>
            </svg>
          </div>
        </div>
      </a>
    )
  }

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="w-20 h-[52px] rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 hover:bg-gray-200 transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </a>
    )
  }

  return (
    <div className="w-20 h-[52px] rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center flex-shrink-0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    </div>
  )
}

function SortableRow({ video, onFieldChange, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: video.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 'auto',
    position: 'relative',
  }

  return (
    <div ref={setNodeRef} style={style} className="border-b last:border-0 group relative border-gray-100">
      <div className="grid grid-cols-[32px_180px_160px_1fr_1fr_160px] min-w-[880px] hover:bg-black/[0.01] transition-colors items-center">

        {/* drag + delete */}
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <div
            {...attributes}
            {...listeners}
            style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
            className="text-gray-300 hover:text-gray-500 transition-colors"
          >
            <GripIcon />
          </div>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onDelete(video.id)}
            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <TrashIcon />
          </button>
        </div>

        {/* title */}
        <div className="px-4 py-3 border-l border-gray-100">
          <input
            value={video.title || ''}
            onChange={e => onFieldChange(video.id, 'title', e.target.value)}
            placeholder="Video title…"
            className="w-full text-sm bg-transparent outline-none text-gray-700 font-medium placeholder-gray-300"
          />
        </div>

        {/* date */}
        <div className="px-4 flex items-center border-l border-gray-100">
          <DatePicker
            selected={video.date ? new Date(video.date) : null}
            onChange={date => onFieldChange(video.id, 'date', date ? date.toISOString().split('T')[0] : null)}
            dateFormat="dd MMM yyyy"
            popperPlacement="bottom-start"
            customInput={
              <DateChip
                value={video.date}
                onClear={() => onFieldChange(video.id, 'date', null)}
              />
            }
          />
        </div>

        {/* caption */}
        <div className="px-4 py-3 border-l border-gray-100">
          <textarea
            value={video.caption || ''}
            onChange={e => onFieldChange(video.id, 'caption', e.target.value)}
            placeholder="Write your caption here…"
            rows={2}
            className="w-full text-sm bg-transparent outline-none resize-none text-gray-700 placeholder-gray-300 leading-relaxed"
          />
        </div>

        {/* link */}
        <div className="px-4 py-3 border-l border-gray-100 flex items-center gap-2">
          <input
            value={video.url || ''}
            onChange={e => onFieldChange(video.id, 'url', e.target.value)}
            placeholder="Paste link (YouTube, Drive…)"
            className="w-full text-sm bg-transparent outline-none text-gray-500 placeholder-gray-300"
          />
          {video.url && (
            <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-gray-300 hover:text-gray-600 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          )}
        </div>

        {/* status */}
        <div className="px-4 py-3 border-l border-gray-100">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full w-full ${STATUS_STYLES[video.status] || STATUS_STYLES['Draft']}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[video.status] || STATUS_DOT['Draft']}`} />
            <select
              value={video.status || 'Draft'}
              onChange={e => onFieldChange(video.id, 'status', e.target.value)}
              className="text-xs font-medium outline-none cursor-pointer bg-transparent flex-1"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Videos() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [videos, setVideos] = useState([])
  const [adding, setAdding] = useState(false)
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
    fetchVideos(data.id)

    const channel = supabase
      .channel(`videos-${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' },
        () => { if (!updatingRef.current) fetchVideos(data.id) }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  async function fetchVideos(clientId) {
    const { data } = await supabase
      .from('videos').select('*').eq('client_id', clientId).order('position', { ascending: true })
    setVideos(data || [])
  }

  function handleChange(id, field, value) {
    const dbValue = value === '' ? null : value
    setVideos(prev => prev.map(v => v.id === id ? { ...v, [field]: dbValue } : v))
    const key = id + field
    clearTimeout(timers.current[key])
    updatingRef.current = true
    timers.current[key] = setTimeout(async () => {
      await supabase.from('videos').update({ [field]: dbValue }).eq('id', id)
      updatingRef.current = false
    }, 500)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this video?')) return
    updatingRef.current = true
    await supabase.from('videos').delete().eq('id', id)
    updatingRef.current = false
    if (client) fetchVideos(client.id)
  }

  async function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIndex = videos.findIndex(v => v.id === active.id)
    const newIndex = videos.findIndex(v => v.id === over.id)
    const reordered = arrayMove(videos, oldIndex, newIndex)
    setVideos(reordered)
    updatingRef.current = true
    await Promise.all(reordered.map((video, index) =>
      supabase.from('videos').update({ position: index }).eq('id', video.id)
    ))
    updatingRef.current = false
  }

  async function handleAdd() {
    if (!client) return
    setAdding(true)
    const { data: existing } = await supabase
      .from('videos').select('position').eq('client_id', client.id)
      .order('position', { ascending: false }).limit(1)
    const nextPos = existing?.[0]?.position != null ? existing[0].position + 1 : 0
    await supabase.from('videos').insert({ client_id: client.id, position: nextPos, title: '', url: '', status: 'Draft' })
    setAdding(false)
    fetchVideos(client.id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Videos</h1>
            {client && <p className="text-sm text-gray-400 mt-1">{client.name}</p>}
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="px-4 py-2 text-sm rounded-xl border border-gray-900 hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-40"
          >
            {adding ? 'Adding…' : 'Add Video'}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">

          {/* header */}
          <div className="grid grid-cols-[32px_180px_160px_1fr_1fr_160px] min-w-[880px] bg-gray-50 border-b border-gray-200">
            <div />
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Caption</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Link</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</div>
          </div>

          {videos.length === 0 && (
            <div className="py-20 text-center text-sm text-gray-400">
              No videos yet. Click "Add Video" to get started.
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={videos.map(v => v.id)} strategy={verticalListSortingStrategy}>
              {videos.map(video => (
                <SortableRow
                  key={video.id}
                  video={video}
                  onFieldChange={handleChange}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  )
}
