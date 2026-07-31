import { Link, NavLink, useNavigate } from 'react-router-dom'
import { User, LogOut, Settings } from 'lucide-react'
import { Button } from '@/core/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu'
import { useAuth } from '@/core/context/AuthContext'
import { APP_ROUTES } from '@/core/lib/routes'
import { cn } from '@/core/lib/utils'

const NAV_LINKS = [
  { to: APP_ROUTES.HOME(), label: 'Inicio', exact: true },
  { to: APP_ROUTES.PROMOTIONS(), label: 'Promociones', highlight: true },
  { to: APP_ROUTES.CATALOG(), label: 'Productos' },
  { to: APP_ROUTES.CONTACT(), label: 'Contacto' },
]

export function PublicHeader() {
  const { session, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(APP_ROUTES.HOME())
  }

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to={APP_ROUTES.HOME()} className="flex items-center gap-2">
          <img src="/logo-compacto.png" alt="Tissus" className="h-8 w-auto object-contain dark:invert" />
          <span className="font-bold text-lg tracking-tight">Tissus</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {NAV_LINKS.map(({ to, label, exact, highlight }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn(
                  'transition-colors',
                  highlight
                    ? 'text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full hover:text-primary font-medium'
                    : isActive
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(APP_ROUTES.ACCOUNT())}>
                  <User className="mr-2 h-4 w-4 text-muted-foreground" /> Mi cuenta
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(APP_ROUTES.ADMIN.DASHBOARD())}>
                      <Settings className="mr-2 h-4 w-4 text-muted-foreground" /> Panel admin
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive font-medium">
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate(APP_ROUTES.LOGIN())}>
              Ingresar
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
