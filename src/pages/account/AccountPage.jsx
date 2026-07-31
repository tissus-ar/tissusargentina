import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { ShoppingBag, User, History, Phone, Mail, Loader2, MessageSquare, KeyRound } from 'lucide-react'
import { Button } from '@/core/components/ui/button'
import { Input } from '@/core/components/ui/input'
import { Label } from '@/core/components/ui/label'
import { Skeleton } from '@/core/components/ui/skeleton'
import { useAuth } from '@/core/context/AuthContext'
import { useUserRequests } from '@/core/hooks/queries/useContactRequestsQueries'
import { updateProfile } from '@/core/services/api'
import { RequestStatusBadge } from '@/features/admin-requests/components/RequestStatusBadge'
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm'
import { formatDate, formatPrice } from '@/core/lib/utils'
import { APP_ROUTES } from '@/core/lib/routes'
import { cn } from '@/core/lib/utils'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Ingresá tu nombre'),
  phone: z.string().optional(),
})

export default function AccountPage() {
  const { session, userProfile, fetchProfile } = useAuth()
  const [tab, setTab] = useState('perfil')

  const { data: requests, isLoading: requestsLoading } = useUserRequests(session?.user?.id)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: userProfile?.full_name || '',
      phone: userProfile?.phone || '',
    },
  })

  const onSaveProfile = async (values) => {
    try {
      await updateProfile(session.user.id, values)
      await fetchProfile(session.user.id)
      toast.success('Perfil actualizado correctamente')
    } catch {
      toast.error('Error al actualizar el perfil')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Gestioná tus datos personales y revisá el historial de tus pedidos y cotizaciones.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <button
          onClick={() => setTab('perfil')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-all duration-200',
            tab === 'perfil'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <User className="h-4 w-4" />
          Mis Datos
        </button>
        <button
          onClick={() => setTab('seguridad')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-all duration-200',
            tab === 'seguridad'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <KeyRound className="h-4 w-4" />
          Seguridad
        </button>
        <button
          onClick={() => setTab('compras')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-all duration-200',
            tab === 'compras'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <History className="h-4 w-4" />
          Historial de Compras y Consultas
          {requests?.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Perfil */}
      {tab === 'perfil' && (
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xs animate-in fade-in duration-300">
          <form onSubmit={handleSubmit(onSaveProfile)} className="flex flex-col gap-5 max-w-md">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input id="full_name" {...register('full_name')} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email registrado</Label>
              <div className="relative flex items-center">
                <Input id="email" value={session?.user?.email || ''} disabled className="opacity-60 pr-10" />
                <Mail className="absolute right-3 h-4 w-4 text-muted-foreground opacity-55" />
              </div>
              <p className="text-[11px] text-muted-foreground">Tu dirección de correo no se puede cambiar.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Teléfono / WhatsApp</Label>
              <div className="relative flex items-center">
                <Input id="phone" {...register('phone')} placeholder="+54 9 11 1234 5678" className="pr-10" />
                <Phone className="absolute right-3 h-4 w-4 text-muted-foreground opacity-55" />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-fit mt-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Tab Seguridad / Cambiar contraseña */}
      {tab === 'seguridad' && (
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xs animate-in fade-in duration-300">
          <div className="flex flex-col gap-1 mb-5 max-w-md">
            <h2 className="font-semibold text-base">Cambiar contraseña</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ingresá tu nueva contraseña a continuación. Recordá elegir una combinación segura y diferente a la actual.
            </p>
          </div>
          <div className="max-w-md">
            <ChangePasswordForm />
          </div>
        </div>
      )}

      {/* Tab Historial de Compras (Consultas) */}
      {tab === 'compras' && (
        <div className="animate-in fade-in duration-300">
          {requestsLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 border rounded-xl p-5 bg-card">
                  <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : !requests?.length ? (
            <div className="text-center py-12 border border-dashed rounded-2xl flex flex-col items-center gap-3">
              <div className="p-3 bg-muted rounded-full text-muted-foreground">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-base">No tenés compras ni consultas registradas</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Tus solicitudes de cotización e intenciones de compra de telas y accesorios aparecerán aquí.
                </p>
              </div>
              <Button asChild variant="outline" className="mt-2" size="sm">
                <Link to={APP_ROUTES.CATALOG()}>Ver productos</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 bg-white dark:bg-zinc-950 flex flex-col gap-4 shadow-xs hover:shadow-sm transition-all duration-200"
                >
                  {/* Card Header & Product Details */}
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex gap-4 items-start">
                      {/* Product Image Thumbnail */}
                      <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
                        {r.products?.images?.[0] ? (
                          <img
                            src={r.products.images[0]}
                            alt={r.products.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <h3 className="font-semibold text-base text-foreground hover:underline transition-colors">
                          {r.products ? (
                            <Link to={APP_ROUTES.PRODUCT(r.products.slug)}>
                              {r.products.name}
                            </Link>
                          ) : (
                            'Consulta General'
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Solicitado el {formatDate(r.created_at)}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
                          {r.products?.sku && (
                            <span className="text-muted-foreground font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              SKU: {r.products.sku}
                            </span>
                          )}
                          {r.products && (
                            <span className="font-medium text-foreground">
                              {formatPrice(r.products.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 self-start sm:self-center">
                      <RequestStatusBadge status={r.status} />
                    </div>
                  </div>

                  {/* Message Detail Box */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-100 dark:border-zinc-900 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium mb-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Tu consulta / especificaciones:</span>
                    </div>
                    <p className="text-foreground whitespace-pre-line leading-relaxed pl-5">
                      {r.message}
                    </p>
                  </div>

                  {/* Admin notes (Assesor response) */}
                  {r.admin_notes && (
                    <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-3.5 border border-primary/15 text-xs animate-in slide-in-from-top-1 duration-200">
                      <span className="font-semibold text-primary block mb-1">
                        Respuesta del asesor de Tissus:
                      </span>
                      <p className="text-foreground whitespace-pre-line leading-relaxed">
                        {r.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
