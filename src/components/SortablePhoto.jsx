import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function SortablePhoto({ photo, onDelete }) {
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
    <div ref={setNodeRef} style={style} className="relative group aspect-square bg-gray-100">
      <img
        src={photo.url}
        alt=""
        className="w-full h-full object-cover select-none"
        style={{ touchAction: 'none' }}
        draggable={false}
        {...attributes}
        {...listeners}
      />
      {onDelete && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(photo.id, photo.storage_path)}
          className="absolute top-0 right-0 w-5 h-5 bg-black bg-opacity-60 text-white text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  )
}
