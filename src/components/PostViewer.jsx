import { useState, useRef, useEffect } from 'react'

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 000-7.8z"/>
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
    </svg>
  )
}

function CarouselMedia({ slides }) {
  const [index, setIndex] = useState(0)
  const scrollRef = useRef(null)

  function handleScroll(e) {
    const el = e.target
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== index) setIndex(i)
  }

  return (
    <div className="relative bg-black">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {slides.map((s, i) => (
          <div key={i} className="w-full flex-shrink-0 snap-start aspect-[4/5]">
            {s.type === 'video' ? (
              <video src={s.url} className="w-full h-full object-cover" controls playsInline preload="metadata" />
            ) : (
              <img src={s.url} alt="" draggable={false} className="w-full h-full object-cover" />
            )}
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <>
          <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
            {index + 1}/{slides.length}
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {slides.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-blue-500' : 'bg-white/70'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PostCard({ photo, clientName, setRef }) {
  const slides = photo.post_type === 'Carousel' && photo.carousel_images?.length > 0
    ? [{ url: photo.url, type: photo.media_type || 'image' }, ...photo.carousel_images]
    : [{ url: photo.url, type: photo.media_type || 'image' }]

  return (
    <div ref={setRef} className="border-b border-gray-100">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
          {clientName?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="text-xs font-semibold flex-1 truncate">{clientName || 'account'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700 flex-shrink-0">
          <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
        </svg>
      </div>

      <CarouselMedia slides={slides} />

      <div className="flex items-center gap-3 px-3 py-2.5 text-gray-900">
        <HeartIcon />
        <CommentIcon />
        <ShareIcon />
        <div className="flex-1" />
        <BookmarkIcon />
      </div>

      {photo.caption && (
        <p className="px-3 pb-3 text-xs text-gray-800 leading-snug">
          <span className="font-semibold mr-1">{clientName}</span>
          {photo.caption}
        </p>
      )}
    </div>
  )
}

export default function PostViewer({ photos, startIndex, clientName, onClose }) {
  const containerRef = useRef(null)
  const cardRefs = useRef({})

  useEffect(() => {
    const el = cardRefs.current[startIndex]
    if (el) el.scrollIntoView({ block: 'start' })
  }, [startIndex])

  return (
    <div className="absolute inset-0 bg-white z-20 flex flex-col">
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      <div className="flex-shrink-0 flex items-center gap-3 px-3 py-2 border-b border-gray-100">
        <button onClick={onClose} className="text-gray-700">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="text-sm font-semibold">Posts</span>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto overscroll-contain">
        {photos.map((photo, i) => (
          <PostCard
            key={photo.id}
            photo={photo}
            clientName={clientName}
            setRef={el => { cardRefs.current[i] = el }}
          />
        ))}
      </div>
    </div>
  )
}
