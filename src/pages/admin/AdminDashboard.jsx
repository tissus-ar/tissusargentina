import { useNavigate } from 'react-router-dom'
import { AlertCircle, Package, MessageSquare, Archive } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card'
import { Skeleton } from '@/core/components/ui/skeleton'
import { useAdminProducts } from '@/core/hooks/queries/useProductsQueries'
import { useAdminRequests } from '@/core/hooks/queries/useContactRequestsQueries'
import { PromotionSettingsCard } from './components/PromotionSettingsCard'
import { APP_ROUTES } from '@/core/lib/routes'

function StatCard({ title, value, icon: Icon, description, loading, indicator, onClick }) {
  return (
    <Card
      onClick={onClick}
      className={onClick ? "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 active:scale-[0.98]" : ""}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="relative">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {indicator && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-12" /> : (
          <>
            <p className="text-2xl font-bold">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { data: products, isLoading: productsLoading } = useAdminProducts()
  const { data: requests, isLoading: requestsLoading } = useAdminRequests()

  const activeRequests = requests?.filter((r) => ['pending', 'contacted'].includes(r.status)).length ?? 0
  const lowStock = products?.filter((p) => p.is_active && p.stock === 0).length ?? 0
  const inactiveProducts = products?.filter((p) => !p.is_active).length ?? 0
  const totalProducts = products?.filter((p) => p.is_active).length ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Resumen general del negocio</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Consultas activas"
          value={activeRequests}
          icon={MessageSquare}
          description="Pendientes y en contacto"
          loading={requestsLoading}
          indicator={activeRequests > 0}
          onClick={() => navigate(APP_ROUTES.ADMIN.REQUESTS())}
        />
        <StatCard
          title="Productos activos"
          value={totalProducts}
          icon={Package}
          loading={productsLoading}
          onClick={() => navigate(`${APP_ROUTES.ADMIN.PRODUCTS()}?filter=active`)}
        />
        <StatCard
          title="Sin stock"
          value={lowStock}
          icon={AlertCircle}
          description="Activos en 0"
          loading={productsLoading}
          onClick={() => navigate(`${APP_ROUTES.ADMIN.PRODUCTS()}?filter=no-stock`)}
        />
        <StatCard
          title="Inactivos"
          value={inactiveProducts}
          icon={Archive}
          description="Ocultos al público"
          loading={productsLoading}
          onClick={() => navigate(`${APP_ROUTES.ADMIN.PRODUCTS()}?filter=inactive`)}
        />
      </div>

      <div className="mt-4">
        <PromotionSettingsCard />
      </div>
    </div>
  )
}

