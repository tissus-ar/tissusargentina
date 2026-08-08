import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card'
import { Button } from '@/core/components/ui/button'
import { Input } from '@/core/components/ui/input'
import { Label } from '@/core/components/ui/label'
import { useStoreSettings, useUpdateStoreSettings } from '@/core/hooks/queries/useSettingsQueries'
import { Megaphone, Save } from 'lucide-react'

const DEFAULT_SETTINGS = {
  promo_active: false,
  promo_min_amount: 120000,
  promo_discount_percentage: 15,
  promo_installments: 3
}

export function PromotionSettingsCard() {
  const { data: settings, isLoading } = useStoreSettings()
  const { mutate: updateSettings, isPending } = useUpdateStoreSettings()

  // `draft` vale null mientras el admin no tocó nada: el form muestra lo que hay guardado y se
  // actualiza solo si la query revalida. Solo pasa a no-null al editar, y vuelve a null al guardar.
  const [draft, setDraft] = useState(null)
  const formData = draft ?? settings ?? DEFAULT_SETTINGS

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setDraft({
      ...formData,
      [name]: type === 'checkbox' ? checked : Number(value)
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    updateSettings(formData, { onSuccess: () => setDraft(null) })
  }

  if (isLoading) return <div>Cargando...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Promoción Global
        </CardTitle>
        <CardDescription>
          Configura el banner de promoción que aparece en la parte superior del sitio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
            <div className="space-y-0.5">
              <Label className="text-base cursor-pointer" htmlFor="promo_active">Activar Promoción</Label>
              <p className="text-sm text-muted-foreground">
                Muestra u oculta el banner en todo el sitio.
              </p>
            </div>
            <div className="flex items-center h-5">
              <input
                id="promo_active"
                name="promo_active"
                type="checkbox"
                checked={formData.promo_active}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="promo_min_amount">Monto Mínimo ($)</Label>
              <Input
                id="promo_min_amount"
                name="promo_min_amount"
                type="number"
                value={formData.promo_min_amount}
                onChange={handleChange}
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo_discount_percentage">Descuento (%)</Label>
              <Input
                id="promo_discount_percentage"
                name="promo_discount_percentage"
                type="number"
                value={formData.promo_discount_percentage}
                onChange={handleChange}
                min="0"
                max="100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo_installments">Cuotas sin interés</Label>
              <Input
                id="promo_installments"
                name="promo_installments"
                type="number"
                value={formData.promo_installments}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto mt-2">
              <Save className="h-4 w-4 mr-2" />
              {isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
