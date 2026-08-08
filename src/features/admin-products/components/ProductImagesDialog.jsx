import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/core/components/ui/dialog'
import { Button } from '@/core/components/ui/button'
import { useProductMutations } from '@/core/hooks/queries/useProductsQueries'
import { ImageUploader } from './ImageUploader'
import { Image as ImageIcon } from 'lucide-react'

export function ProductImagesDialog({ product, open, onClose }) {
  const { update } = useProductMutations()
  // `draft` vale null mientras no se tocó nada: las imágenes salen directo del producto, así que
  // abrir el diálogo ya muestra las cargadas sin necesidad de un efecto que las copie al estado.
  const [draft, setDraft] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const images = draft ?? product?.images ?? []

  // El diálogo no se desmonta al cerrarse (Radix lo mantiene para animar la salida), así que el
  // borrador se descarta acá; si no, reabrirlo con otro producto mostraría lo del anterior.
  const handleClose = () => {
    setDraft(null)
    onClose()
  }

  const handleSave = async () => {
    if (!product) return
    setIsSaving(true)
    try {
      await update.mutateAsync({ id: product.id, images })
      toast.success('Imágenes actualizadas con éxito')
      handleClose()
    } catch (e) {
      toast.error(e.message || 'Error al actualizar imágenes')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Imágenes de {product?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <ImageUploader 
            productId={product?.id} 
            images={images}
            onChange={setDraft}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Imágenes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
