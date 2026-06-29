/**
 * Wrapper tipado de fetch para el frontend.
 * El browser NUNCA habla con Supabase; solo usa estas rutas /api/*.
 */

import type {
  User, Category, Ingredient, MealType,
  DietConfig, MealLog, AnalysisResult, MealLogWithAnalysis,
  StockItem, CreateStockItemDto, UpdateStockItemDto,
  CreateUserDto, UpdateUserDto,
  CreateCategoryDto, UpdateCategoryDto,
  CreateIngredientDto, UpdateIngredientDto,
  CreateMealTypeDto, UpdateMealTypeDto,
  SetDietConfigDto,
  CreateMealLogDto,
  AnalysisRequest,
} from '@/models'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const body = await res.json() as { error?: string }
      if (body.error) message = body.error
    } catch { /* ignore */ }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ─── Users ────────────────────────────────────────────────────

export const usersApi = {
  list: () => apiFetch<User[]>('/api/users'),
  get: (id: string) => apiFetch<User>(`/api/users/${id}`),
  create: (dto: CreateUserDto) =>
    apiFetch<User>('/api/users', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateUserDto) =>
    apiFetch<User>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  delete: (id: string) =>
    apiFetch<void>(`/api/users/${id}`, { method: 'DELETE' }),
}

// ─── Categories ────────────────────────────────────────────────

export const categoriesApi = {
  list: () => apiFetch<Category[]>('/api/categories'),
  get: (id: string) => apiFetch<Category>(`/api/categories/${id}`),
  create: (dto: CreateCategoryDto) =>
    apiFetch<Category>('/api/categories', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateCategoryDto) =>
    apiFetch<Category>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  delete: (id: string) =>
    apiFetch<void>(`/api/categories/${id}`, { method: 'DELETE' }),
}

// ─── Ingredients ──────────────────────────────────────────────

export const ingredientsApi = {
  list: () => apiFetch<Ingredient[]>('/api/ingredients'),
  get: (id: string) => apiFetch<Ingredient>(`/api/ingredients/${id}`),
  create: (dto: CreateIngredientDto) =>
    apiFetch<Ingredient>('/api/ingredients', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateIngredientDto) =>
    apiFetch<Ingredient>(`/api/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  delete: (id: string) =>
    apiFetch<void>(`/api/ingredients/${id}`, { method: 'DELETE' }),
}

// ─── Meal Types ───────────────────────────────────────────────

export const mealTypesApi = {
  list: (userId: string) => apiFetch<MealType[]>(`/api/meal-types?userId=${userId}`),
  get: (id: string) => apiFetch<MealType>(`/api/meal-types/${id}`),
  create: (dto: CreateMealTypeDto) =>
    apiFetch<MealType>('/api/meal-types', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateMealTypeDto) =>
    apiFetch<MealType>(`/api/meal-types/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  delete: (id: string) =>
    apiFetch<void>(`/api/meal-types/${id}`, { method: 'DELETE' }),
}

// ─── Diet ─────────────────────────────────────────────────────

export const dietApi = {
  getConfig: (userId: string, mealTypeId: string) =>
    apiFetch<DietConfig>(`/api/diet?userId=${userId}&mealTypeId=${mealTypeId}`),
  setConfig: (userId: string, dto: SetDietConfigDto) =>
    apiFetch<DietConfig>(`/api/diet?userId=${userId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),
}

// ─── Meal Logs ────────────────────────────────────────────────

export const mealLogsApi = {
  list: (userId: string) => apiFetch<MealLog[]>(`/api/meal-logs?userId=${userId}`),
  get: (id: string) => apiFetch<MealLog>(`/api/meal-logs/${id}`),
  create: (dto: CreateMealLogDto) =>
    apiFetch<MealLogWithAnalysis>('/api/meal-logs', { method: 'POST', body: JSON.stringify(dto) }),
  delete: (id: string) =>
    apiFetch<void>(`/api/meal-logs/${id}`, { method: 'DELETE' }),
}

// ─── Analysis ─────────────────────────────────────────────────

export const analysisApi = {
  preview: (req: AnalysisRequest) =>
    apiFetch<AnalysisResult>('/api/analysis', { method: 'POST', body: JSON.stringify(req) }),
}

// ─── Stock ────────────────────────────────────────────────────

export const stockApi = {
  list: (userId: string) => apiFetch<StockItem[]>(`/api/stock?userId=${userId}`),
  create: (dto: CreateStockItemDto) =>
    apiFetch<StockItem>('/api/stock', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateStockItemDto) =>
    apiFetch<StockItem>(`/api/stock/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  delete: (id: string) =>
    apiFetch<void>(`/api/stock/${id}`, { method: 'DELETE' }),
}
