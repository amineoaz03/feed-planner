import { useState, useRef } from 'react'

export default function PostViewer({ photos, startIndex, onClose }) {
  const [postIndex, setPostIndex] = useState(startIndex)
  const [slideIndex, setSlideIndex] = useState(0)
  const pointerStart = useRef(null)

  const photo = photos[postIndex]
  const slides = photo.post_type === 'Carousel' && (photo.carousel_images?.length > 0)
    ? [{ url: photo.url, type: photo.media_type || 'image' }, ...photo.carousel_images]
    : [{ url: photo.url, type: photo.media_type || 'image' }]

  const current = slides[Math.min(slideIndex, slides.length - 1)]

  function handlePointerDown(e) {
    pointerStart.current = { x: e.clientX, y: e.clientY }
  }

  function handlePointerUp(e) {
    if (!pointerStart.current) return
    const dx = e.clientX - pointerStart.current.x
    const dy = e.clientY - pointerStart.current.y
    pointerStart.current = null

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
      if (dx < 0 && slideIndex < slides.length - 1) setSlideIndex(i => i + 1)
      else if (dx > 0 && slideIndex > 0) setSlideIndex(i => i - 1)
    } else if (Math.abs(dy) > 35) {
      if (dy < 0 && postIndex < photos.length - 1) { setPostIndex(i => i + 1); setSlideIndex(0) }
      else if (dy > 0 && postIndex > 0) { setPostIndex(i => i - 1); setSlideIndex(0) }
      else if (dy > 0 && postIndex === 0) onClose()
    }
  }

  return (
    <div
      className="absolute inset-0 bg-black z-20 flex flex-col select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2">
        <button onClick={onClose} className="text-white text-lg w-7 h-7 flex items-center justify-center">×</button>
        {slides.length > 1 && (
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === slideIndex ? 'w-4 bg-white' : 'w-1 bg-white/40'}`} />
            ))}
          </div>
        )}
        <div className="w-7" />
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {current.type === 'video' ? (
          <video src={current.url} className="max-w-full max-h-full object-contain" controls autoPlay playsInline />
        ) : (
          <img src={current.url} alt="" draggable={false} className="max-w-full max-h-full object-contain" />
        )}
      </div>

      <div className="flex-shrink-0 flex justify-center py-2">
        <div className="flex flex-col items-center gap-0.5 text-white/50 text-[9px]">
          {postIndex < photos.length - 1 && <span>swipe up for next post</span>}
        </div>
      </div>
    </div>
  )
}
