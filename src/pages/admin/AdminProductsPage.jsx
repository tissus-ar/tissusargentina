import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Upload } from 'lucide-react'
import { Button } from '@/core/components/ui/button'
import { Input } from '@/core/components/ui/input'
import { ProductsTable } from '@/features/admin-products/components/ProductsTable'
import { ProductFormSheet } from '@/features/admin-products/components/ProductFormSheet'
import { ProductImagesDialog } from '@/features/admin-products/components/ProductImagesDialog'
import { CsvImportDialog } from '@/features/admin-products/components/CsvImportDialog'
import { useAdminProducts } from '@/core/hooks/queries/useProductsQueries'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select'

export default function AdminProductsPage() {
  const { data: products, isLoading } = useAdminProducts()
  const [editProduct, setEditProduct] = useState(null)
  const [imagesProduct, setImagesProduct] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [imagesOpen, setImagesOpen] = useState(false)
  const [csvOpen, setCsvOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name_asc')
  const [searchParams, setSearchParams] = useSearchParams()
  const filterBy = searchParams.get('filter') || 'all'

  const setFilterBy = (val) => {
    setSearchParams(prev => {
      if (val === 'all') prev.delete('filter')
      else prev.set('filter', val)
      return prev
    }, { replace: true })
  }
  
  // Defer heavy rendering so navigation is instant and loader can be seen
  const [visibleCount, setVisibleCount] = useState(20)
  useEffect(() => {
    if (products && visibleCount < products.length) {
      const t = setTimeout(() => setVisibleCount(products.length), 150)
      return () => clearTimeout(t)
    }
  }, [products, visibleCount])

  const filtered = useMemo(() => {
    let result = products ? [...products] : []
    if (filterBy === 'active') {
      result = result.filter((p) => p.is_active)
    } else if (filterBy === 'inactive') {
      result = result.filter((p) => !p.is_active)
    } else if (filterBy === 'no-stock') {
      result = result.filter((p) => p.is_active && p.stock === 0)
    }
    if (search) {
      result = result.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    }
    result.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
      if (sortBy === 'price_asc') return a.price - b.price
      if (sortBy === 'price_desc') return b.price - a.price
      return 0
    })
    return result
  }, [products, search, sortBy, filterBy])

  const handleEdit = (product) => {
    setEditProduct(product)
    setSheetOpen(true)
  }

  const handleEditImages = (product) => {
    setImagesProduct(product)
    setImagesOpen(true)
  }

  const handleNew = () => {
    setEditProduct(null)
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted-foreground text-sm">{products?.length ?? 0} en total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importar CSV
          </Button>
          <Button size="sm" onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo producto
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="no-stock">Sin stock (Activos)</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name_asc">Alfabético (A-Z)</SelectItem>
              <SelectItem value="price_asc">Precio: Menor a mayor</SelectItem>
              <SelectItem value="price_desc">Precio: Mayor a menor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ProductsTable 
        products={filtered.slice(0, visibleCount)} 
        isLoading={isLoading || visibleCount === 20 && filtered.length > 20} 
        onEdit={handleEdit} 
        onEditImages={handleEditImages}
      />

      <ProductFormSheet
        product={editProduct}
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditProduct(null) }}
      />

      <ProductImagesDialog
        product={imagesProduct}
        open={imagesOpen}
        onClose={() => { setImagesOpen(false); setImagesProduct(null) }}
      />

      <CsvImportDialog open={csvOpen} onClose={() => setCsvOpen(false)} />
    </div>
  )
}
