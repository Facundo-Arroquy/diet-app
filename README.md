# DietApp

App de gestión de dieta y planificación alimentaria. Combina control de porciones por categoría de alimento + macronutrientes vs objetivo.

## Requisitos

- Node.js 18+
- npm / pnpm
- Cuenta de [Supabase](https://supabase.com) (plan gratuito alcanza)

---

## 1. Crear el proyecto Supabase

1. Ingresá a [app.supabase.com](https://app.supabase.com) y creá un nuevo proyecto.
2. Anotá:
   - **Project URL** (ej: `https://abcdefgh.supabase.co`)
   - **Service Role Key** (en Settings → API → `service_role`)

---

## 2. Aplicar el schema

En el **SQL Editor** de tu proyecto Supabase:

1. Abrí `supabase/schema.sql` y ejecutalo completo.
2. Abrí `supabase/seed.sql` y ejecutalo completo (datos de ejemplo).

---

## 3. Variables de entorno

```bash
cp .env.example .env.local
```

Editá `.env.local`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
STORAGE=supabase
```

> ⚠️ Nunca commitees `.env.local`. Ya está en `.gitignore`.

---

## 4. Correr en local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

---

## 5. Verificación de tipos y build

```bash
npm run typecheck   # tsc --noEmit (debe pasar sin errores)
npm run build       # next build (para verificar antes de deploy)
```

---

## 6. Desplegar en Vercel

### A. Via CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### B. Via dashboard

1. Importá el repositorio en [vercel.com/new](https://vercel.com/new).
2. En **Environment Variables**, agregá:
   | Variable | Valor |
   |---|---|
   | `SUPABASE_URL` | Tu URL de Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | Tu service role key |
   | `STORAGE` | `supabase` |
3. Deploy.

> Las variables se pueden agregar también con `vercel env add`.

---

## Estructura del proyecto

```
diet-app/
├── supabase/
│   ├── schema.sql          # DDL completo con RLS
│   └── seed.sql            # Datos de ejemplo
└── src/
    ├── models/index.ts     # Entidades + DTOs + tipos de análisis
    ├── lib/
    │   ├── supabase/       # Cliente service-role (server-only)
    │   ├── repositories/   # Interfaces + implementaciones Supabase
    │   ├── api-client.ts   # Fetch tipado para el frontend
    │   ├── validation.ts   # Schemas Zod
    │   └── http.ts         # Helpers de respuesta HTTP
    ├── services/
    │   ├── analysisService.ts      # analyzeMeal() — función pura
    │   ├── categoryService.ts      # Jerarquía de categorías
    │   └── mealAnalysisService.ts  # Orquestación
    ├── hooks/useUser.tsx   # Contexto de usuario (localStorage)
    ├── components/         # UI reutilizable
    └── app/
        ├── page.tsx        # Selector de usuario
        ├── (panel)/        # Layout autenticado + páginas
        └── api/            # Route handlers (CRUD + analysis)
```

## Lógica de análisis

La función `analyzeMeal()` en `src/services/analysisService.ts` es pura y testeable:

1. Calcula macros totales (macros_por_100g × gramos / 100).
2. Calcula porciones por categoría (gramos / gramsPerPortion).
3. Roll-up jerárquico: una regla sobre "Carnes" suma las porciones de "Pollo" y "Vacuna".
4. Compara contra objetivos con banda de tolerancia del 5%.

## Arquitectura de persistencia

- Repositorios con interfaces en `src/lib/repositories/types.ts`.
- Implementaciones Supabase en `src/lib/repositories/supabase/`.
- Factory `getRepositories()` en `src/lib/repositories/index.ts` selecciona la implementación según `STORAGE`.
- El frontend nunca habla con Supabase directamente; usa `/api/*` internas.

## Scripts npm

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar build producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin emitir |
