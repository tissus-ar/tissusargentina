import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/core/components/ui/sheet'
import { Button } from '@/core/components/ui/button'
import { Input } from '@/core/components/ui/input'
import { Label } from '@/core/components/ui/label'
import { Textarea } from '@/core/components/ui/textarea'
import { useCategoryMutations } from '@/core/hooks/queries/useCategoriesQueries'
import { uploadCategoryImage } from '@/core/services/api'
import { slugify } from '@/core/lib/utils'
import { compressImage } from '@/core/lib/image'
import { 
  Sparkles, 
  Layers, 
  Tag, 
  ArrowUpDown, 
  Image as ImageIcon, 
  Upload, 
  AlertCircle,
  FileText
} from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  position: z.preprocess((v) => Number(v) || 0, z.number().int().min(0)),
})

export function CategoryFormSheet({ category, open, onClose }) {
  const { create, update } = useCategoryMutations()
  const [imageFile, setImageFile] = useState(null)
  // `previewDraft` vale null mientras no se eligió un archivo nuevo: el preview sale directo de la
  // categoría, así que abrir el sheet ya muestra su banner sin copiarlo al estado en un efecto.
  const [previewDraft, setPreviewDraft] = useState(null)
  const preview = previewDraft ?? (category?.image_url || '')
  const isEditing = Boolean(category)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      position: category?.position ?? 0,
    },
  })

  // `reset` es una API imperativa de react-hook-form (estado externo a React), no un setState:
  // sincronizar el form con la categoría al abrir es justamente para lo que sirve un efecto.
  useEffect(() => {
    if (open) {
      reset({
        name: category?.name || '',
        description: category?.description || '',
        position: category?.position ?? 0,
      })
    }
  }, [open, category, reset])

  // El sheet no se desmonta al cerrarse (Radix lo mantiene para animar la salida), así que la
  // imagen elegida se descarta acá; si no, reabrirlo con otra categoría mostraría la anterior.
  const handleClose = () => {
    setPreviewDraft(null)
    setImageFile(null)
    onClose()
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreviewDraft(URL.createObjectURL(file))
  }

  const onSubmit = async (values) => {
    try {
      let image_url = category?.image_url || null
      if (imageFile) {
        const compressed = await compressImage(imageFile)
        image_url = await uploadCategoryImage(compressed, category?.id)
      }
      const payload = { ...values, slug: slugify(values.name), image_url }
      if (isEditing) {
        await update.mutateAsync({ id: category.id, ...payload })
        toast.success('Categoría actualizada con éxito')
      } else {
        await create.mutateAsync(payload)
        toast.success('Categoría creada con éxito')
      }
      handleClose()
    } catch (e) {
      toast.error(e.message || 'Error al guardar la categoría')
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="w-full sm:max-w-xl h-full flex flex-col p-0 gap-0 overflow-hidden">
        <SheetHeader className="px-6 py-5 border-b border-border flex-shrink-0">
          <SheetTitle className="text-lg font-bold flex items-center gap-2">
            {isEditing ? (
              <>
                <Sparkles className="h-5 w-5 text-primary" />
                Editar Categoría
              </>
            ) : (
              <>
                <Layers className="h-5 w-5 text-primary" />
                Nueva Categoría
              </>
            )}
          </SheetTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {isEditing 
              ? 'Edita los detalles de la categoría seleccionada.' 
              : 'Agrega una nueva categoría al listado de productos del sitio.'}
          </p>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Tag className="h-4 w-4 text-muted-foreground/75" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Información General</h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-sm">Nombre de la Categoría *</Label>
              <Input {...register('name')} placeholder="Ej. Mesas de Pool, Accesorios" className="focus-visible:ring-primary" />
              {errors.name && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-sm">Descripción</Label>
              <Textarea 
                {...register('description')} 
                rows={3} 
                placeholder="Breve descripción de los productos incluidos en esta categoría..." 
                className="focus-visible:ring-primary resize-y min-h-[80px]"
              />
            </div>
          </div>

          {/* SECCIÓN 2: ORDEN Y POSICIÓN */}
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground/75" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Posicionamiento</h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-sm">Posición (Orden de visualización)</Label>
              <Input type="number" min="0" {...register('position')} className="focus-visible:ring-primary" />
              <p className="text-[11px] text-muted-foreground leading-normal">
                Determina el orden de visualización de la categoría en el menú principal (números más bajos se muestran primero).
              </p>
            </div>
          </div>

          {/* SECCIÓN 3: IMAGEN DE BANNER */}
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <ImageIcon className="h-4 w-4 text-muted-foreground/75" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Imagen de Banner</h3>
            </div>

            <div className="flex flex-col gap-3">
              {preview ? (
                <div className="relative group aspect-video rounded-xl overflow-hidden border border-border bg-muted shadow-xs">
                  <img src={preview} alt="Banner Preview" className="w-full h-full object-cover select-none" />
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer text-white">
                    <Upload className="h-6 w-6" />
                    <span className="text-xs font-medium">Hacé clic para cambiar la imagen</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
              ) : (
                <label className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center text-sm text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 group">
                  <Upload className="h-7 w-7 text-muted-foreground/70 group-hover:text-primary transition-colors duration-200" />
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">Subir imagen de banner</p>
                    <p className="text-xs text-muted-foreground/80">Formatos recomendados: PNG, JPG (relación 16:9)</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>
        </form>

        <SheetFooter className="px-6 py-4 border-t border-border bg-muted/20 dark:bg-muted/10 flex-shrink-0 flex-row justify-end gap-3 mt-0">
          <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} onClick={handleSubmit(onSubmit)} className="min-w-[120px]">
            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

