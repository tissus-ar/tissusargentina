import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, Upload, GripVertical } from 'lucide-react'
import { Button } from '@/core/components/ui/button'
import { uploadProductImage } from '@/core/services/api'
import { cn } from '@/core/lib/utils'
import { compressImage } from '@/core/lib/image'

function SortableImage({ url, onRemove, isFirst }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url })
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    touchAction: 'none'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group rounded-xl overflow-hidden border border-border aspect-square bg-muted shadow-xs transition-all duration-200 hover:shadow-md hover:border-muted-foreground/30', 
        isDragging && 'opacity-50 z-50 ring-2 ring-primary scale-105'
      )}
    >
      <img src={url} alt="" className="h-full w-full object-cover select-none pointer-events-none" />
      
      {isFirst && (
        <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md select-none">
          Principal
        </span>
      )}

      {/* Hover action overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
        <button 
          type="button"
          {...attributes} 
          {...listeners} 
          className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors cursor-grab active:cursor-grabbing text-white"
          title="Arrastrar para ordenar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button 
          type="button"
          onClick={() => onRemove(url)} 
          className="p-1.5 rounded-lg bg-destructive hover:bg-destructive/90 transition-colors text-white"
          title="Eliminar imagen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ImageUploader({ productId, images = [], onChange }) {
  const [uploading, setUploading] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Avoid accidental drag while clicking buttons
    }
  }))

  const handleFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const compressedFiles = await Promise.all(
        Array.from(files).map((f) => compressImage(f))
      )
      const urls = await Promise.all(
        compressedFiles.map((f) => uploadProductImage(f, productId || 'temp'))
      )
      onChange([...images, ...urls])
    } finally {
      setUploading(false)
    }
  }, [images, onChange, productId])

  const handleDrop = (e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const handleRemove = (url) => onChange(images.filter((u) => u !== url))

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIdx = images.indexOf(active.id)
      const newIdx = images.indexOf(over.id)
      onChange(arrayMove(images, oldIdx, newIdx))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone (Label matches input to make whole area clickable) */}
      <label
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center text-sm text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 group"
      >
        <Upload className="h-7 w-7 text-muted-foreground/70 group-hover:text-primary transition-colors duration-200" />
        <div className="flex flex-col gap-1">
          <p className="font-medium">
            Arrastrá imágenes acá o <span className="text-primary group-hover:underline underline-offset-2">seleccioná archivos</span>
          </p>
          <p className="text-xs text-muted-foreground/80">
            Formatos soportados: PNG, JPG, JPEG. La primera será la principal.
          </p>
        </div>
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
        {uploading && (
          <p className="mt-1 text-xs text-primary animate-pulse font-semibold">
            Subiendo imágenes...
          </p>
        )}
      </label>

      {/* Grid de imágenes */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-4 gap-3">
              {images.map((url) => (
                <SortableImage key={url} url={url} onRemove={handleRemove} isFirst={url === images[0]} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

