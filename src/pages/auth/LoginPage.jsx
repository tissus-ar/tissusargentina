import { useState, useEffect } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { ForgotForm } from '@/features/auth/components/ForgotForm'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'
import { useAuth } from '@/core/context/AuthContext'
import { APP_ROUTES } from '@/core/lib/routes'
import { cn } from '@/core/lib/utils'
import { Toaster } from '@/core/components/ui/sonner'

export default function LoginPage() {
  const { session, isPasswordRecovery } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedTab, setSelectedTab] = useState(() => {
    const t = searchParams.get('tab')
    return (t === 'register' || t === 'forgot' || t === 'reset-password') ? t : 'login'
  })

  // El flujo de recuperación manda sobre la pestaña elegida a mano: mientras esté activo, la
  // pantalla es la de reset. Derivarlo en vez de forzarlo desde un efecto evita el render
  // intermedio en el que se veía el login antes de que el efecto corrigiera la pestaña.
  const tab = isPasswordRecovery ? 'reset-password' : selectedTab

  // Sync tab changes to URL search parameters for linkability
  useEffect(() => {
    const currentTab = searchParams.get('tab')
    if (tab === 'login' && currentTab) {
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('tab')
      setSearchParams(newParams)
    } else if (tab !== 'login' && currentTab !== tab) {
      setSearchParams({ tab })
    }
  }, [tab, searchParams, setSearchParams])

  if (session && tab !== 'reset-password' && !isPasswordRecovery) {
    return <Navigate to={APP_ROUTES.HOME()} replace />
  }

  const getHeaderText = () => {
    switch (tab) {
      case 'register':
        return {
          title: 'Creá tu cuenta',
          subtitle: 'Registrate para acceder a beneficios exclusivos y realizar tus compras más rápido.',
        }
      case 'forgot':
        return {
          title: 'Recuperar contraseña',
          subtitle: 'Te enviaremos un correo con las instrucciones para restablecer tu cuenta.',
        }
      case 'reset-password':
        return {
          title: 'Crear nueva contraseña',
          subtitle: 'Elegí una nueva contraseña segura para proteger tu cuenta de Tissus.',
        }
      case 'login':
      default:
        return {
          title: '¡Te damos la bienvenida!',
          subtitle: 'Ingresá con tus credenciales para continuar tu experiencia en Tissus.',
        }
    }
  }

  const { title, subtitle } = getHeaderText()

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-zinc-50 dark:bg-zinc-900 overflow-x-hidden">
      {/* Back to shop button (floating on mobile, static on desktop) */}
      <div className="absolute top-4 left-4 z-50">
        <Link
          to={APP_ROUTES.HOME()}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md py-1.5 px-3 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a la tienda
        </Link>
      </div>

      {/* Visual panel (Desktop only) */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-white bg-zinc-950 select-none overflow-hidden">
        {/* Background Image with elegant overlay */}
        <div className="absolute inset-0 z-0 scale-105 hover:scale-100 transition-transform duration-10000 ease-out">
          <img
            src="/login_gameroom_bg.jpg"
            alt="Tissus Premium Game Room"
            className="h-full w-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/40 z-10" />
        </div>

        {/* Logo */}
        <Link to={APP_ROUTES.HOME()} className="relative z-20 flex items-center gap-2.5">
          <img src="/logo.png" alt="Tissus" className="h-10 w-auto object-contain invert" />
        </Link>

        {/* Inspiring blockquote */}
        <div className="relative z-20 mt-auto max-w-lg">
          <blockquote className="space-y-4">
            <p className="text-xl font-light leading-relaxed italic text-zinc-100 font-sans">
              "Fabricamos momentos de encuentro. Mesas de ping pong, pool y accesorios premium diseñados para elevar tu sala de juegos."
            </p>
            <footer className="flex flex-col gap-0.5 text-sm font-medium text-zinc-300">
              <span>Tissus Argentina</span>
              <span className="text-xs text-zinc-400 font-light">Equipamiento Premium para Salas de Juego</span>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 lg:p-16 min-h-screen">
        <div className="w-full max-w-[420px] flex flex-col gap-6">
          {/* Logo on mobile only */}
          <div className="flex flex-col items-center gap-2 text-center lg:hidden">
            <Link to={APP_ROUTES.HOME()} className="flex items-center gap-2">
              <img src="/logo.png" alt="Tissus" className="h-10 w-auto object-contain dark:invert" />
            </Link>
          </div>

          {/* Card Container */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-zinc-100/50 dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-none transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-6">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground transition-all duration-300">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed transition-all duration-300">
                {subtitle}
              </p>
            </div>

            {/* Tab selector (Only visible for Login / Register) */}
            {tab !== 'forgot' && tab !== 'reset-password' && (
              <div className="grid w-full grid-cols-2 rounded-lg bg-muted p-1 text-muted-foreground mb-6">
                <button
                  onClick={() => setSelectedTab('login')}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none",
                    tab === 'login'
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "hover:bg-background/40 hover:text-foreground text-muted-foreground"
                  )}
                >
                  Ingresar
                </button>
                <button
                  onClick={() => setSelectedTab('register')}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none",
                    tab === 'register'
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "hover:bg-background/40 hover:text-foreground text-muted-foreground"
                  )}
                >
                  Registrarse
                </button>
              </div>
            )}

            {/* Dynamic Form Content */}
            <div className="relative">
              {tab === 'login' && (
                <LoginForm onForgotPassword={() => setSelectedTab('forgot')} />
              )}
              {tab === 'register' && (
                <RegisterForm onSwitchToLogin={() => setSelectedTab('login')} />
              )}
              {tab === 'forgot' && (
                <ForgotForm onBackToLogin={() => setSelectedTab('login')} />
              )}
              {tab === 'reset-password' && (
                <ResetPasswordForm />
              )}
            </div>
          </div>

          {/* Additional info footer / policy link */}
          <p className="px-8 text-center text-xs text-muted-foreground leading-relaxed">
            Al continuar, aceptas nuestras{' '}
            <Link to={APP_ROUTES.HOME()} className="underline underline-offset-4 hover:text-primary">
              Condiciones de Servicio
            </Link>{' '}
            y{' '}
            <Link to={APP_ROUTES.HOME()} className="underline underline-offset-4 hover:text-primary">
              Políticas de Privacidad
            </Link>.
          </p>
        </div>
      </div>

      {/* Render toaster for validation and connection toast notifications */}
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
