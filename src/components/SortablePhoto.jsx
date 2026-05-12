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

export default function SortablePhoto({ photo, onDelete, editMode }) {
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

  return (
    <div ref={setNodeRef} style={style} className="relative group aspect-[4/5] bg-gray-100">
      <img
        src={photo.url}
        alt=""
        className="w-full h-full object-cover select-none"
        loading="lazy"
        draggable={false}
      />

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
