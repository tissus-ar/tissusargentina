import { useMemo, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/core/components/ui/button'
import { useFeaturedProducts, useProductMutations } from '@/core/hooks/queries/useProductsQueries'
import { supabase } from '@/core/services/supabase'

function SortableItem({ id, product }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 mb-2 bg-card border rounded-lg shadow-sm ${
        isDragging ? 'opacity-50 z-10 border-primary ring-1 ring-primary' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-primary transition-colors touch-none"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      {product.images?.[0] ? (
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-12 w-12 rounded-md object-cover border bg-muted"
        />
      ) : (
        <div className="h-12 w-12 rounded-md border bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Sin img</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{product.name}</h3>
        <p className="text-xs text-muted-foreground truncate">{product.sku || 'Sin SKU'}</p>
      </div>
    </div>
  )
}

export default function AdminFeaturedProductsPage() {
  const { data: featuredProducts, isLoading } = useFeaturedProducts()
  // `reordered` vale null mientras no se arrastró nada: la lista sale directo de la query, así que
  // los destacados ya guardados se ven al entrar sin un efecto que los copie al estado.
  const [reordered, setReordered] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const { update } = useProductMutations()

  // Sort items by their featured_order if they have it
  const sorted = useMemo(
    () => [...(featuredProducts || [])].sort((a, b) => (a.featured_order || 0) - (b.featured_order || 0)),
    [featuredProducts]
  )
  const items = reordered ?? sorted

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      setReordered(arrayMove(items, oldIndex, newIndex))
    }
  }

  const handleSaveOrder = async () => {
    setIsSaving(true)
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        featured_order: index + 1
      }))

      for (const updateObj of updates) {
        await supabase
          .from('products')
          .update({ featured_order: updateObj.featured_order })
          .eq('id', updateObj.id)
      }
      
      // Invalidate queries to refresh UI by doing a dummy update call if items exist
      if (items.length > 0) {
        await update.mutateAsync({ id: items[0].id, featured_order: 1 })
      }

      // El orden ya está persistido: se descarta el borrador y la lista vuelve a salir de la query.
      setReordered(null)
      toast.success('Orden actualizado con éxito')
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar el orden')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Productos Destacados</h1>
        <p className="text-muted-foreground mt-1">
          Arrastrá y soltá los productos para cambiar el orden en el que aparecen en la página de inicio.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center border rounded-xl bg-card">
          <p className="text-muted-foreground">No hay productos marcados como destacados.</p>
        </div>
      ) : (
        <div className="max-w-2xl bg-card border rounded-xl p-4 shadow-xs">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((product) => (
                <SortableItem key={product.id} id={product.id} product={product} />
              ))}
            </SortableContext>
          </DndContext>

          <div className="mt-6 flex justify-end pt-4 border-t">
            <Button onClick={handleSaveOrder} disabled={isSaving || items.length === 0}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Orden
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
