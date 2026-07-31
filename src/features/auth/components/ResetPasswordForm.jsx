import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/core/components/ui/button'
import { Input } from '@/core/components/ui/input'
import { Label } from '@/core/components/ui/label'
import { supabase } from '@/core/services/supabase'
import { APP_ROUTES } from '@/core/lib/routes'
import { useAuth } from '@/core/context/AuthContext'
import { Eye, EyeOff, Loader2, KeyRound, AlertCircle, ArrowRight } from 'lucide-react'

const schema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmá tu nueva contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const { setIsPasswordRecovery } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ password }) => {
    setErrorMsg('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        let msg = error.message || 'Ocurrió un error al actualizar la contraseña.'
        if (msg.includes('same as the old password')) {
          msg = 'La nueva contraseña debe ser diferente a la anterior.'
        }
        setErrorMsg(msg)
        toast.error('No se pudo cambiar la contraseña.')
        return
      }
      setIsSuccess(true)
      toast.success('¡Contraseña actualizada exitosamente!')
    } catch (err) {
      setErrorMsg('Error de red o conexión al servidor.')
      toast.error('Error de conexión.')
    }
  }

  const handleContinue = () => {
    if (setIsPasswordRecovery) setIsPasswordRecovery(false)
    navigate(APP_ROUTES.HOME(), { replace: true })
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center text-center gap-6 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
          <KeyRound className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-lg">¡Contraseña actualizada!</h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Tu nueva contraseña fue guardada correctamente y tu sesión se encuentra activa.
          </p>
        </div>
        <Button onClick={handleContinue} className="w-full mt-2">
          Continuar a la tienda
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 animate-in fade-in duration-300">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Ingresá tu nueva contraseña para acceder a tu cuenta en Tissus.
      </p>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive dark:bg-destructive/25 border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-password">Nueva contraseña</Label>
        <div className="relative flex items-center">
          <Input
            id="new-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('password')}
            placeholder="••••••"
            disabled={isSubmitting}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-ring"
            disabled={isSubmitting}
            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-password">Confirmar contraseña</Label>
        <div className="relative flex items-center">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword')}
            placeholder="••••••"
            disabled={isSubmitting}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-ring"
            disabled={isSubmitting}
            title={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando contraseña...
          </>
        ) : (
          'Guardar nueva contraseña'
        )}
      </Button>
    </form>
  )
}
