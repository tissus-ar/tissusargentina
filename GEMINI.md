# GEMINI.md

## Pendientes
GitHub Issues del repo (`tissus-ar/tissusargentina`) es la fuente de verdad.

## Stack
- React 19.2.4 + Vite 8.0.1 (JSX puro, sin TypeScript real, solo para IntelliSense).
- Tailwind CSS 4.2.2.
- shadcn/ui. Componentes en `src/core/components/ui/`.
- TanStack Query 5.100.5 para fetching. React Router DOM 7.14.
- Supabase: DB + Auth + Storage + Realtime directo desde cliente.
- React Hook Form 7.57 + zod en formularios.
- `radix-ui` unificado, Papaparse, `dnd-kit`, `date-fns`, `sonner`, `next-themes`.

## Comandos
| Comando | Qué hace |
|---|---|
| `npm run dev` | Vite dev server. |
| `npm run build` | Build de producción. |
| `npm run preview` | Sirve el build localmente. |
| `npm run lint` | ESLint (`eslint.config.js`). |
| `npm run db:update:ts` | Regenera `src/types/supabase.ts` desde el schema remoto. Requiere `--project`. |

No hay tests E2E ni unitarios reales corriendo.

## Estructura del proyecto
- **`core/`** — todo lo transversal: `components/ui/`, `context/`, `hooks/queries/` (donde vive TODO el fetching a Supabase), `hooks/useRealtimeSync.js`, `layouts/`, `lib/`, `services/api.js`.
- **`features/`** — por feature de negocio, solo UI y lógica de componente, el fetching lo importan de `core/hooks/queries`.
- **`pages/`** — un archivo por ruta que ensambla las vistas de features.
- **`App.jsx`**: enrutamiento y guards (Auth, Admin).

## Modelo de datos
Tablas: `categories`, `products`, `profiles`, `contact_requests`, `store_settings`.
**RLS:** habilitado en las 5 tablas, sin excepción. Patrón: Lectura pública donde corresponde + policy FOR ALL gateada por admin role (`app_metadata.role = 'admin'`).
No hay migraciones versionadas en `supabase/`. `schema.sql` es el estado remoto.
El rol de Admin se asigna a mano en Supabase, no hay flujo de UI para ello.

## Advertencias conocidas
1. **`npm run lint`**: Dejar en 0 errores. Hay warnings no bloqueantes. Para el estado local que sobreescribe props temporalmente, se recomienda setear el valor inicial como null (ej `local ?? product.stock`). Y nunca meter la definición de un componente dentro del cuerpo de otro.
2. **No hay `supabase/config.toml`**: las reglas de Supabase CLI de bloqueo no aplican.
3. **Sin tests**: El pre-commit hook evalúa lint solamente.
4. **`db:update:ts`**: necesita config `--project`. No hay config.toml.
5. **`.env*` ignorado**: variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## Config de Antigravity
- **Sin skills propias**: no hay locales. Usar las de `~/.gemini/config/skills/`.
- Agentes globales disponibles en `~/.gemini/config/AGENTS.md` (`revisor-seguridad`, `revisor-ui`).
