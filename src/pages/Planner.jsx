import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/compress'
import { generateCaption } from '../lib/gemini'
import Nav from '../components/Nav'

const LANGUAGES = ['English', 'French', 'Spanish', 'Arabic', 'Italian']

const POST_TYPES = ['Photo', 'Carousel', 'Video']

const TYPE_STYLES = {
  'Photo':    'bg-blue-50 text-blue-600 border-blue-200',
  'Carousel': 'bg-purple-50 text-purple-600 border-purple-200',
  'Video':    'bg-rose-50 text-rose-600 border-rose-200',
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

function CarouselStrip({ images = [], photoId, onUpdate }) {
  const [uploading, setUploading] = useState(false)
  const [zoomed, setZoomed] = useState(null)

  async function handleUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)

    const newImages = [...images]
    for (const file of files) {
      const compressed = await compressImage(file)
      const path = `carousel/${photoId}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const { error } = await supabase.storage
        .from('feed-photos')
        .upload(path, compressed, { contentType: 'image/jpeg', cacheControl: '3600' })
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
    if (img?.path) {
      await supabase.storage.from('feed-photos').remove([img.path])
    }
  }

  return (
    <>
      {zoomed && <Lightbox url={zoomed} onClose={() => setZoomed(null)} />}
      <div className="px-6 py-4 bg-purple-50/40 border-t border-purple-100">
        <p className="text-xs font-semibold text-purple-500 mb-3 uppercase tracking-wider">
          Carousel — {images.length} slide{images.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2 flex-wrap items-center">
          {images.map((img, i) => (
            <div key={i} className="relative group flex-shrink-0">
              <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full z-10">
                {i + 1}
              </div>
              <img
                src={img.url}
                alt=""
                loading="lazy"
                onClick={() => setZoomed(img.url)}
                className="w-16 h-20 object-cover rounded-lg cursor-zoom-in shadow-sm hover:scale-105 transition-transform duration-200"
              />
              <button
                onClick={() => handleRemove(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 z-10"
              >
                ×
              </button>
            </div>
          ))}

          {/* upload button */}
          <label className="flex-shrink-0 w-16 h-20 border-2 border-dashed border-purple-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
            {uploading
              ? <span className="text-purple-400 text-xs">…</span>
              : <>
                  <span className="text-purple-400 text-xl leading-none">+</span>
                  <span className="text-purple-400 text-[10px] mt-1">Add</span>
                </>
            }
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
      </div>
    </>
  )
}

export default function Planner() {
  const [photos, setPhotos] = useState([])
  const [zoomed, setZoomed] = useState(null)
  const [generating, setGenerating] = useState(null)
  const [language, setLanguage] = useState('French')
  const timers = useRef({})
  const updatingRef = useRef(false)

  useEffect(() => {
    fetchPhotos()
    const channel = supabase
      .channel('planner-photos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' },
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

  function handleCarouselUpdate(id, newImages) {
    handleChange(id, 'carousel_images', newImages)
  }

  async function handleGenerate(id, imageUrl) {
    setGenerating(id)
    try {
      const caption = await generateCaption(imageUrl, language)
      handleChange(id, 'caption', caption)
    } catch (err) {
      alert('Failed to generate caption. Check your Gemini API key.')
      console.error(err)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {zoomed && <Lightbox url={zoomed} onClose={() => setZoomed(null)} />}
      <Nav />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Content Planner</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Caption language:</span>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none bg-white text-gray-700"
            >
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">

          {/* header */}
          <div className="grid grid-cols-[88px_170px_1fr_150px_160px] min-w-[700px] bg-gray-50 border-b border-gray-200">
            <div className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Photo</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Caption</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</div>
            <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</div>
          </div>

          {photos.length === 0 && (
            <div className="py-20 text-center text-sm text-gray-400">
              No photos yet — upload from the Admin page first.
            </div>
          )}

          {photos.map((photo) => (
            <div key={photo.id} className="border-b border-gray-100 last:border-0 group">

              {/* main row */}
              <div className="grid grid-cols-[88px_170px_1fr_150px_160px] min-w-[700px] hover:bg-gray-50/70 transition-colors">

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
                <div className="px-4 py-3 border-l border-gray-100">
                  <textarea
                    value={photo.caption || ''}
                    onChange={e => handleChange(photo.id, 'caption', e.target.value)}
                    placeholder="Write your caption here…"
                    rows={3}
                    className="w-full text-sm bg-transparent outline-none resize-none text-gray-700 placeholder-gray-300 leading-relaxed"
                  />
                  <button
                    onClick={() => handleGenerate(photo.id, photo.url)}
                    disabled={generating === photo.id}
                    className="mt-1 text-xs text-gray-400 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {generating === photo.id ? 'Generating…' : 'Generate with Gemini'}
                  </button>
                </div>

                {/* post type */}
                <div className="px-4 flex items-center border-l border-gray-100">
                  <div className={`flex items-center px-3 py-1.5 rounded-full border w-full ${TYPE_STYLES[photo.post_type] || TYPE_STYLES['Photo']}`}>
                    <select
                      value={photo.post_type || 'Photo'}
                      onChange={e => handleChange(photo.id, 'post_type', e.target.value)}
                      className="text-xs font-medium outline-none cursor-pointer bg-transparent flex-1"
                    >
                      {POST_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
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

              {/* carousel strip */}
              {(photo.post_type === 'Carousel') && (
                <CarouselStrip
                  images={photo.carousel_images || []}
                  photoId={photo.id}
                  onUpdate={(imgs) => handleCarouselUpdate(photo.id, imgs)}
                />
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
