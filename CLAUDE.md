# CLAUDE.md

## Stack (verificado en `package.json`)
- React 19.2.4 + Vite 8.0.1 (JSX puro, sin TypeScript — hay `@types/*` como devDependencies
  y un `jsconfig.json` con paths, pero es solo para autocompletado/IntelliSense; no hay
  `tsconfig.json` ni build de tipos).
- Tailwind CSS 4.2.2 (`@tailwindcss/postcss`, no el plugin de Vite).
- shadcn/ui vía `components.json` (style `radix-nova`, base color `neutral`, `tsx: false`).
  Componentes generados en `src/core/components/ui/`. Aliases propios (no los default de
  shadcn): `components` → `@/core/components`, `ui` → `@/core/components/ui`,
  `hooks` → `@/core/hooks`, `lib`/`utils` → `@/core/lib`.
- TanStack Query 5.100.5 (+ devtools) para todo el fetching. React Router DOM 7.14 (rutas
  por componente `<Routes>`, no file-based routing).
- Supabase (`@supabase/supabase-js` 2.100.1): DB + Auth + Storage + Realtime, sin backend
  propio — el cliente pega directo contra Supabase.
- React Hook Form 7.57 + `@hookform/resolvers` + Zod 3.25 en los formularios (login,
  producto, categoría, contacto).
- `radix-ui` 1.4.3 (paquete unificado, no primitivos sueltos `@radix-ui/react-*`), Papaparse
  + `xlsx` (import CSV/Excel de productos), `@dnd-kit/*` (reordenar destacados),
  `date-fns`, `sonner` (toasts), `next-themes`.

**Diferencias contra lo que decía el plan de estandarización**: coinciden React 19,
Vite 8, Tailwind 4, shadcn, TanStack Query, Supabase y RHF+zod. Lo que el plan no
detallaba y vale la pena tener registrado: versiones exactas arriba, `radix-ui` es el
paquete unificado (no primitivos por separado), y no hay TypeScript real pese a los
`@types/*` instalados.

## Comandos
| Comando | Qué hace |
|---|---|
| `npm run dev` | Vite dev server. |
| `npm run build` | Build de producción. |
| `npm run preview` | Sirve el build localmente. |
| `npm run lint` | ESLint (`eslint.config.js`, flat config). **Ver advertencia abajo — hoy está en rojo.** |
| `npm run db:update:ts` | Regenera `src/types/supabase.ts` desde el schema remoto (`npx supabase gen types typescript --project-id $npm_config_project`). Requiere pasar `--project` (`npm_config_project`), no lee un `project_id` local — no hay `supabase/config.toml` en este repo. |

No hay `npm test` ni `vitest`: no hay carpeta de tests ni ningún `*.test.*`/`*.spec.*` en
el repo. `playwright` está en `devDependencies` pero no hay config (`playwright.config.*`)
ni specs — es una dependencia instalada sin uso activo, no una suite E2E funcionando.

## Estructura del proyecto

`src/` (~80 archivos) se organiza en tres capas:

- **`core/`** — todo lo transversal, reutilizado por más de una feature:
  - `components/ui/`: primitivos shadcn (`button`, `dialog`, `sheet`, `select`, `table`...).
  - `context/`: `AuthContext` (sesión Supabase + perfil + flag `isAdmin`) y `ConfirmContext`
    (diálogo de confirmación genérico).
  - `hooks/queries/`: **todo** el acceso a datos vive acá como hooks de TanStack Query
    (`useProductsQueries.js`, `useCategoriesQueries.js`, `useContactRequestsQueries.js`,
    `useSettingsQueries.js`), que a su vez llaman a `core/services/api.js`.
  - `hooks/useRealtimeSync.js`: se monta una vez en `App.jsx`, suscribe 4 canales
    Supabase Realtime (`products`, `categories`, `contact_requests`, `store_settings`) e
    invalida las queries de TanStack Query correspondientes en cada cambio.
  - `layouts/`: `PublicLayout` y `AdminLayout` (+ sus componentes de header/sidebar/nav).
  - `lib/`: `routes.js` (objeto `APP_ROUTES` con todas las rutas de la app), `utils.js`,
    `constants.js`, `image.js`.
  - `services/`: `supabase.js` (cliente único, `createClient`) y `api.js` (todas las
    queries/mutations de Supabase — SELECT/INSERT/UPDATE/DELETE y Storage — organizadas
    por sección con comentarios `─── SECCIÓN ───`, separando público de admin).
- **`features/`** — un directorio por feature de negocio, cada uno con `components/` y,
  si tiene lógica no trivial, `hooks/`: `admin-categories`, `admin-products` (incluye
  `useCsvImport.js` — importación de productos desde CSV/XLSX), `admin-requests`, `auth`,
  `catalog` (incluye `useCatalogFilters.js`), `product-detail`. No hay `services/` ni
  acceso a datos propio dentro de una feature — eso vive en `core/hooks/queries` +
  `core/services/api.js`.
- **`pages/`** — un archivo por ruta, agrupado por sección (`public/`, `admin/`, `auth/`,
  `account/`). Una page importa y compone componentes de `features/` y `core/`, usa los
  hooks de `core/hooks/queries` para los datos, y prácticamente no tiene lógica propia más
  allá de estado de UI local (filtros, sheets abiertos, paginación).
- **`App.jsx`**: todas las rutas declaradas acá con `react-router-dom` (sin file-based
  routing), páginas cargadas con `React.lazy`. Dos guards: `ProtectedRoute` (requiere
  sesión) y `AdminRoute` (requiere sesión + `isAdmin`, si no cae en una pantalla 403 inline).

**Convención para agregar algo nuevo**: si el acceso a datos es nuevo, la función va en
`core/services/api.js` y el hook de TanStack Query en `core/hooks/queries/`. Si es UI
específica de una sola pantalla/flujo de negocio, va en `features/<nombre>/components/`
(o `hooks/` si tiene lógica). La page en `pages/` solo ensambla.

## Modelo de datos (`supabase/schema.sql`)

Tablas: `categories`, `products` (FK a `categories`, `images text[]`,
`specifications jsonb`, `discount_percentage`, `is_active`/`is_featured`), `profiles`
(1:1 con `auth.users`, se crea automáticamente por el trigger `handle_new_user` al
registrarse), `contact_requests` (consultas de compra, `status` CHECK
`pending|contacted|closed`, `user_id` opcional — un visitante sin cuenta también puede
dejar una consulta), `store_settings` (fila única de configuración de promo: activa,
monto mínimo, % descuento, cuotas).

**RLS: habilitado en las 5 tablas**, sin excepción. Patrón repetido en todas: lectura
pública donde corresponde (`categories`, `products.is_active = true`, `store_settings`) +
policy `FOR ALL` de admin gateada por
`(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`. `profiles` es dueño-o-admin.
`contact_requests` permite INSERT a cualquiera (incluso anónimo) pero el SELECT es
dueño-o-admin. Storage (`tissus-images`, bucket público) tiene sus propias 3 policies
con el mismo chequeo de `app_metadata.role`. No hay `SECURITY DEFINER` salvo
`handle_new_user()` (necesario para poder insertar en `profiles` durante el signup).

**Sin migraciones versionadas**: no existe `supabase/migrations/` ni
`supabase/config.toml`. `schema.sql` es el estado actual aplicado a mano contra el
proyecto Supabase remoto — no hay `supabase db push`/`db diff` en el flujo de trabajo de
este repo. Cualquier cambio de schema se aplica directo en el dashboard/SQL editor y
después se refleja en `schema.sql` a mano.

**Rol admin — asignación manual, sin flujo en la app**: no existe pantalla ni endpoint
para promover un usuario a admin. Se hace a mano en el dashboard de Supabase, seteando
`app_metadata.role = "admin"` sobre el usuario (ver `supabase/set_admin.sql`, que hace
exactamente ese `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data ||
'{"role": "admin"}'::jsonb WHERE email = ...`). El frontend lo lee en
`AuthContext.jsx` como `session.user.app_metadata.role === 'admin'` → `isAdmin`, que
gatea tanto la UI (`AdminRoute` en `App.jsx`) como, de fondo, las policies RLS reales.

## Advertencias conocidas

1. **`npm run lint`: 0 errores, 8 warnings.** Los 12 errores que había (10
   `react-hooks/set-state-in-effect` + 2 `react-hooks/static-components`) se corrigieron;
   los 8 warnings quedan sin tocar a propósito: `react-refresh/only-export-components`
   (×4), `react-hooks/exhaustive-deps` (×2) y `react-hooks/incompatible-library` /
   "Compilation Skipped" (×2, `watch()` de react-hook-form dentro de un Radix Select).
   El gate pre-commit global (`gate-pre-commit.js`) corre lint acá y bloquea el commit si
   falla, así que **el lint tiene que quedar en 0 errores**; los warnings no lo bloquean.

   **Convención que salió de esa corrección — estado local nullable con fallback a la
   prop.** Donde había un `useEffect` copiando una prop (o el resultado de una query) a
   estado local para poder editarlo, ahora el estado vale `null` en reposo y el valor
   mostrado sale directo de la fuente:

   ```js
   const [local, setLocal] = useState(null)   // null = seguir la prop
   const value = local ?? product.stock
   ```

   `local` solo deja de ser `null` mientras se edita el campo o mientras hay una mutación
   optimista en vuelo, y vuelve a `null` cuando la mutación termina. Así un cambio externo
   (Realtime, refetch de TanStack Query) se refleja solo, sin efecto de sincronización.
   Aplicado en `ProductsTable.jsx` (5 celdas), `PromotionSettingsCard.jsx`,
   `ProductImagesDialog.jsx` y `AdminFeaturedProductsPage.jsx`.

   **Corolario para diálogos y sheets**: Radix los mantiene montados al cerrarse (para
   animar la salida), así que el borrador se descarta en un `handleClose` propio. Si no,
   reabrir con otro registro muestra los datos del anterior. Ver `ProductImagesDialog.jsx`
   y `CategoryFormSheet.jsx`.

   **Y no meter la definición de un componente dentro del cuerpo de otro** (era el caso de
   `Loader` en `AdminLayout`/`PublicLayout`): React lo trata como un tipo distinto en cada
   render y remonta el subárbol, perdiendo su estado. Va a nivel de módulo, no memoizado.
2. **No hay `supabase/config.toml`** (en `supabase/` solo hay `schema.sql`, `seed.sql`,
   `set_admin.sql`, SQL suelto sin gestionar por la CLI): las reglas específicas de
   Supabase del hook `guard-git-db.js` (bloqueos sobre comandos `supabase db push`/reset,
   etc.) **no se activan en este repo**, porque su guard de aplicabilidad depende
   puntualmente de ese archivo. Lo único de `guard-git-db.js` que sigue activo acá es el
   bloqueo genérico de `main` (push directo, `gh pr merge`, `git reset --hard`,
   `git rebase`, `--no-verify`), que es universal a los cuatro proyectos.
3. **Sin tests de ningún tipo**: ni `vitest` ni specs de `playwright` pese a tenerlo
   instalado. El gate pre-commit corre solo lint (no hay `vitest` en `devDependencies`
   real que lo dispare... en realidad no hay ninguna suite, así que no hay red de tests
   — no asumir que se puede verificar un cambio corriendo tests).
4. **`db:update:ts` no es autocontenido**: necesita `npm_config_project` (flag
   `--project=<id>`) porque no hay `config.toml` local que lo infiera. **`src/types/` no
   existe en este repo** (verificado): `src/types/supabase.ts` no está generado — el
   comando nunca se corrió, o su salida no se versionó. No asumir tipos de Supabase en
   ningún archivo del repo sin confirmar antes que existan.
5. **`.env*` está enteramente gitignoreado** (no solo `.env.local`). Las variables
   relevantes son `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (nombres, sin valores) —
   `core/services/supabase.js` tiene un fallback a `placeholder.supabase.co` si faltan,
   así que un `.env.local` mal configurado falla en runtime contra Supabase, no al bootear
   Vite.

## Config de Claude Code
- **Sin skills propias**: no hay `.claude/skills/` en este repo. Las únicas skills
  disponibles son las globales: `criterios-aceptacion`, `supabase-postgres-best-practices`,
  `cerrar-tarea`. Agentes globales disponibles: `revisor-seguridad`, `revisor-ui`.
