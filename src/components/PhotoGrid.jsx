import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import SortablePhoto from './SortablePhoto'

export default function PhotoGrid({ photos, onReorder, onDelete, editMode }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  )

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIndex = photos.findIndex((p) => p.id === active.id)
    const newIndex = photos.findIndex((p) => p.id === over.id)
    onReorder(arrayMove(photos, oldIndex, newIndex))
  }

  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
        No photos yet
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      autoScroll={{ enabled: true }}
    >
      <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-px bg-gray-200">
          {photos.map((photo) => (
            <SortablePhoto key={photo.id} photo={photo} onDelete={onDelete} editMode={editMode} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
