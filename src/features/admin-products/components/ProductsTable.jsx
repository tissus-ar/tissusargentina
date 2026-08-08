import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Eye, EyeOff, Star, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/core/components/ui/button'
import { Badge } from '@/core/components/ui/badge'
import { Input } from '@/core/components/ui/input'
import { Skeleton } from '@/core/components/ui/skeleton'
import { useConfirm } from '@/core/context/ConfirmContext'
import { useProductMutations } from '@/core/hooks/queries/useProductsQueries'
import { useAdminCategories } from '@/core/hooks/queries/useCategoriesQueries'
import { formatPrice } from '@/core/lib/utils'
import { useEditableCell } from '../hooks/useEditableCell'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select'

// El estado nullable con fallback a la prop y el descarte con Escape viven en `useEditableCell`,
// compartido por las tres celdas editables (stock, precio y descuento).
function StockCell({ product }) {
  const { update } = useProductMutations()
  const { editing, value, startEditing, inputProps } = useEditableCell({
    current: product.stock,
    onSave: async (stock) => {
      try {
        await update.mutateAsync({ id: product.id, stock })
        toast.success('Stock actualizado')
      } catch {
        toast.error('Error al actualizar stock')
      }
    },
  })

  if (editing) {
    return <Input type="number" min="0" className="w-20 h-7 text-xs ml-auto" {...inputProps} />
  }

  return (
    <button
      onClick={startEditing}
      className="text-sm hover:underline underline-offset-2"
    >
      {value}
    </button>
  )
}

function PriceCell({ product }) {
  const { update } = useProductMutations()
  const { editing, value, startEditing, inputProps } = useEditableCell({
    current: product.price,
    onSave: async (price) => {
      try {
        await update.mutateAsync({ id: product.id, price })
        toast.success('Precio actualizado')
      } catch {
        toast.error('Error al actualizar precio')
      }
    },
  })

  if (editing) {
    return (
      <Input type="number" min="0" step="0.01" className="w-24 h-7 text-xs ml-auto" {...inputProps} />
    )
  }

  return (
    <button
      onClick={startEditing}
      className="text-sm font-medium hover:underline underline-offset-2"
    >
      {formatPrice(value)}
    </button>
  )
}

function CategoryCell({ product, categories }) {
  const { update } = useProductMutations()
  const [local, setLocal] = useState(null)
  const value = local ?? (product.category_id || 'none')

  const handleCategoryChange = async (newCategoryId) => {
    setLocal(newCategoryId)
    const categoryId = newCategoryId === 'none' ? null : newCategoryId
    try {
      await update.mutateAsync({ id: product.id, category_id: categoryId })
      toast.success('Categoría actualizada')
    } catch {
      toast.error('Error al actualizar categoría')
    } finally {
      setLocal(null)
    }
  }

  return (
    <div className="w-44 select-none">
      <Select value={value} onValueChange={handleCategoryChange}>
        <SelectTrigger className="h-7 text-xs border bg-background/50 dark:bg-background/20 font-normal py-0">
          <SelectValue placeholder="Sin categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" className="text-xs">Sin categoría</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id} className="text-xs">
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function FeaturedCell({ product }) {
  const { update } = useProductMutations()
  const [local, setLocal] = useState(null)
  const featured = local ?? product.is_featured

  const handleToggleFeatured = async (e) => {
    const isChecked = e.target.checked
    setLocal(isChecked)
    try {
      await update.mutateAsync({ id: product.id, is_featured: isChecked })
      toast.success(isChecked ? 'Marcado como destacado' : 'Removido de destacados')
    } catch {
      toast.error('Error al actualizar destacados')
    } finally {
      setLocal(null)
    }
  }

  return (
    <div className="flex items-center justify-center">
      <input
        type="checkbox"
        checked={featured}
        onChange={handleToggleFeatured}
        className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary accent-primary cursor-pointer transition-transform duration-200 hover:scale-110"
        title="Marcar como destacado"
      />
    </div>
  )
}

function PromotionCell({ product }) {
  const { update } = useProductMutations()
  const { editing, value, startEditing, inputProps } = useEditableCell({
    current: product.discount_percentage || 0,
    onSave: async (discount_percentage) => {
      try {
        await update.mutateAsync({ id: product.id, discount_percentage })
        toast.success(
          discount_percentage > 0
            ? `Descuento del ${discount_percentage}% aplicado`
            : 'Descuento removido'
        )
      } catch {
        toast.error('Error al actualizar descuento')
      }
    },
  })

  if (editing) {
    return (
      <div className="flex items-center gap-1 justify-center">
        <Input type="number" min="0" max="100" className="w-16 h-7 text-xs text-center" {...inputProps} />
        <span className="text-xs text-muted-foreground">%</span>
      </div>
    )
  }

  const hasDiscount = value > 0

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={startEditing}
        className={`text-sm hover:underline underline-offset-2 px-2 py-0.5 rounded ${hasDiscount ? 'bg-red-500/10 text-red-500 font-bold' : 'text-muted-foreground'}`}
      >
        {hasDiscount ? `-${value}%` : '0%'}
      </button>
    </div>
  )
}

export function ProductsTable({ products, isLoading, onEdit, onEditImages }) {
  const confirm = useConfirm()
  const { update, remove } = useProductMutations()
  const { data: categories = [] } = useAdminCategories()

  const handleToggleActive = async (product) => {
    try {
      await update.mutateAsync({ id: product.id, is_active: !product.is_active })
      toast.success(product.is_active ? 'Producto desactivado' : 'Producto activado')
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const handleDelete = async (product) => {
    const ok = await confirm({
      title: 'Eliminar producto',
      description: `¿Eliminás "${product.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'destructive',
      confirmButtonClass: 'cursor-pointer',
      cancelButtonClass: 'cursor-pointer',
    })
    if (!ok) return
    try {
      await remove.mutateAsync(product.id)
      toast.success('Producto eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="relative flex flex-col items-center justify-center mb-6 h-16 w-16">
          <div className="bg-primary ping-pong-ball"></div>
          <div className="bg-primary/20 ping-pong-shadow absolute bottom-0"></div>
        </div>
        <p className="font-medium animate-pulse">Cargando productos...</p>
      </div>
    )
  }

  if (!products?.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No hay productos. Creá uno o importá desde CSV.</p>
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted text-xs">
          <tr>
            <th className="text-left p-3">Producto</th>
            <th className="text-left p-3 hidden md:table-cell">Categoría</th>
            <th className="text-right p-3 hidden md:table-cell">Precio</th>
            <th className="text-right p-3 hidden md:table-cell">Stock</th>
            <th className="text-center p-3 hidden md:table-cell">Destacado</th>
            <th className="text-center p-3 hidden md:table-cell">Descuento</th>
            <th className="text-center p-3 hidden md:table-cell">Estado</th>
            <th className="text-right p-3">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => onEditImages(p)}
                    className="shrink-0 hover:opacity-80 transition-opacity rounded focus:outline-none focus:ring-2 focus:ring-primary ring-offset-1"
                    title="Administrar fotos"
                  >
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                  <span className="font-medium line-clamp-1">{p.name}</span>
                </div>
              </td>
              <td className="p-3 hidden md:table-cell">
                <CategoryCell product={p} categories={categories} />
              </td>
              <td className="p-3 text-right hidden md:table-cell"><PriceCell product={p} /></td>
              <td className="p-3 text-right hidden md:table-cell"><StockCell product={p} /></td>
              <td className="p-3 text-center hidden md:table-cell">
                <FeaturedCell product={p} />
              </td>
              <td className="p-3 text-center hidden md:table-cell">
                <PromotionCell product={p} />
              </td>
              <td className="p-3 text-center hidden md:table-cell">
                <Badge variant={p.is_active ? 'default' : 'secondary'}>
                  {p.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </td>
              <td className="p-3">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hidden md:inline-flex"
                    title={p.is_active ? 'Desactivar' : 'Activar'}
                    onClick={() => handleToggleActive(p)}
                  >
                    {p.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hidden md:inline-flex"
                    onClick={() => handleDelete(p)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
