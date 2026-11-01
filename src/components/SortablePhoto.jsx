import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <circle cx="4" cy="2" r="1.2"/><circle cx="8" cy="2" r="1.2"/>
      <circle cx="4" cy="6" r="1.2"/><circle cx="8" cy="6" r="1.2"/>
      <circle cx="4" cy="10" r="1.2"/><circle cx="8" cy="10" r="1.2"/>
    </svg>
  )
}

export default function SortablePhoto({ photo, onDelete, editMode, onOpen }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 'auto',
  }

  const isVideo = photo.media_type === 'video'

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => !editMode && onOpen && onOpen()}
      className={`relative group aspect-[4/5] bg-gray-100 ${!editMode ? 'cursor-pointer' : ''}`}
    >
      {isVideo ? (
        <>
          <video src={photo.url} className="w-full h-full object-cover select-none" muted />
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
            <div className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center">
              <svg width="9" height="9" viewBox="0 0 8 8" fill="#111827"><polygon points="2,1 7,4 2,7"/></svg>
            </div>
          </div>
        </>
      ) : (
        <img
          src={photo.url}
          alt=""
          className="w-full h-full object-cover select-none"
          loading="lazy"
          draggable={false}
        />
      )}

      {editMode && (
        <>
          <div
            {...attributes}
            {...listeners}
            style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
            className="absolute top-1 left-1 w-6 h-6 bg-black bg-opacity-50 text-white flex items-center justify-center"
          >
            <GripIcon />
          </div>

          {onDelete && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onDelete(photo.id, photo.storage_path)}
              className="absolute top-1 right-1 w-6 h-6 bg-black bg-opacity-50 text-white text-sm leading-none flex items-center justify-center"
            >
              ×
            </button>
          )}
        </>
      )}
    </div>
  )
}
