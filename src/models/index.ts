// ============================================================
// DOMAIN MODELS — shared front/back
// ============================================================

// ─────────────────────────────────────────────────────────────
// Core entities
// ─────────────────────────────────────────────────────────────

export interface User {
  id: string
  nombre: string
  createdAt?: string
}

export interface Category {
  id: string
  nombre: string
  parentId: string | null
  createdAt?: string
}

/** Macros ALWAYS per 100 g */
export interface Macros {
  calorias: number
  proteinas: number
  carbohidratos: number
  grasas: number
  fibra: number
}

export interface Ingredient {
  id: string
  nombre: string
  categoryId: string
  macros: Macros
  gramsPerPortion: number
  createdAt?: string
}

export interface MealType {
  id: string
  userId: string
  nombre: string
  orden: number
  createdAt?: string
}

export interface DietCategoryRule {
  id: string
  userId: string
  mealTypeId: string
  categoryId: string
  requiredPortions: number
  createdAt?: string
}

export interface DietMacroTarget {
  id: string
  userId: string
  mealTypeId: string
  calorias: number | null
  proteinas: number | null
  carbohidratos: number | null
  grasas: number | null
  fibra: number | null
  createdAt?: string
}

export interface MealLogItem {
  id: string
  ingredientId: string
  grams: number
  createdAt?: string
}

export interface MealLog {
  id: string
  userId: string
  mealTypeId: string
  fecha: string   // ISO date string YYYY-MM-DD
  items: MealLogItem[]
  createdAt?: string
}

// ─────────────────────────────────────────────────────────────
// DTOs — entrada validada con zod
// ─────────────────────────────────────────────────────────────

export interface CreateUserDto { nombre: string }
export interface UpdateUserDto { nombre: string }

export interface CreateCategoryDto { nombre: string; parentId?: string | null }
export interface UpdateCategoryDto { nombre: string; parentId?: string | null }

export interface CreateIngredientDto {
  nombre: string
  categoryId: string
  macros: Macros
  gramsPerPortion: number
}
export interface UpdateIngredientDto {
  nombre: string
  categoryId: string
  macros: Macros
  gramsPerPortion: number
}

export interface CreateMealTypeDto { userId: string; nombre: string; orden: number }
export interface UpdateMealTypeDto { nombre: string; orden: number }

export interface MealLogItemInput { ingredientId: string; grams: number }

export interface CreateMealLogDto {
  userId: string
  mealTypeId: string
  fecha: string
  items: MealLogItemInput[]
}

export interface SetDietCategoryRuleDto {
  categoryId: string
  requiredPortions: number
}

export interface SetDietMacroTargetDto {
  calorias?: number | null
  proteinas?: number | null
  carbohidratos?: number | null
  grasas?: number | null
  fibra?: number | null
}

export interface SetDietConfigDto {
  mealTypeId: string
  categoryRules: SetDietCategoryRuleDto[]
  macroTarget: SetDietMacroTargetDto
}

// ─────────────────────────────────────────────────────────────
// Analysis types
// ─────────────────────────────────────────────────────────────

export type MacroStatus = 'cumplido' | 'faltante' | 'exceso' | 'sin-objetivo'
export type PortionStatus = 'cumplido' | 'faltante' | 'exceso'

export interface CategoryAnalysis {
  categoryId: string
  categoryNombre: string
  required: number
  actual: number
  status: PortionStatus
}

export interface MacroAnalysis {
  nombre: string
  key: keyof Macros
  target: number | null
  actual: number
  status: MacroStatus
}

export interface AnalysisResult {
  totals: Macros
  categories: CategoryAnalysis[]
  macros: MacroAnalysis[]
}

export interface AnalysisRequest {
  userId: string
  mealTypeId: string
  items: MealLogItemInput[]
}

export interface MealLogWithAnalysis {
  mealLog: MealLog
  analysis: AnalysisResult
}

// ─────────────────────────────────────────────────────────────
// Diet config (aggregate view)
// ─────────────────────────────────────────────────────────────

export interface DietConfig {
  mealTypeId: string
  categoryRules: DietCategoryRule[]
  macroTarget: DietMacroTarget | null
}

// ─────────────────────────────────────────────────────────────
// Stock de cocina
// ─────────────────────────────────────────────────────────────

export interface StockItem {
  id: string
  userId: string
  ingredientId: string
  ingredientNombre: string
  cantidad: number
  unidad: string
  minimo: number
  updatedAt: string
}

export interface CreateStockItemDto {
  userId: string
  ingredientId: string
  cantidad: number
  unidad: string
  minimo: number
}

export interface UpdateStockItemDto {
  cantidad?: number
  unidad?: string
  minimo?: number
}
