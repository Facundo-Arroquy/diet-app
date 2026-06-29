import { z } from 'zod'

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────

const nonEmptyString = z.string().trim().min(1, 'Campo requerido')
const uuid = z.string().uuid('ID inválido')
const positiveNumber = z.number().nonnegative('Debe ser ≥ 0')
const macrosSchema = z.object({
  calorias: positiveNumber,
  proteinas: positiveNumber,
  carbohidratos: positiveNumber,
  grasas: positiveNumber,
  fibra: positiveNumber,
})

// ─────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────

export const createUserSchema = z.object({ nombre: nonEmptyString })
export const updateUserSchema = z.object({ nombre: nonEmptyString })

// ─────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  nombre: nonEmptyString,
  parentId: uuid.nullable().optional(),
})
export const updateCategorySchema = z.object({
  nombre: nonEmptyString,
  parentId: uuid.nullable().optional(),
})

// ─────────────────────────────────────────────────────────────
// Ingredients
// ─────────────────────────────────────────────────────────────

export const createIngredientSchema = z.object({
  nombre: nonEmptyString,
  categoryId: uuid,
  macros: macrosSchema,
  gramsPerPortion: z.number().positive('Gramos por porción debe ser > 0'),
})
export const updateIngredientSchema = createIngredientSchema

// ─────────────────────────────────────────────────────────────
// Meal types
// ─────────────────────────────────────────────────────────────

export const createMealTypeSchema = z.object({
  userId: uuid,
  nombre: nonEmptyString,
  orden: z.number().int().nonnegative(),
})
export const updateMealTypeSchema = z.object({
  nombre: nonEmptyString,
  orden: z.number().int().nonnegative(),
})

// ─────────────────────────────────────────────────────────────
// Diet config
// ─────────────────────────────────────────────────────────────

const dietCategoryRuleSchema = z.object({
  categoryId: uuid,
  requiredPortions: z.number().nonnegative(),
})

const dietMacroTargetSchema = z.object({
  calorias: positiveNumber.nullable().optional(),
  proteinas: positiveNumber.nullable().optional(),
  carbohidratos: positiveNumber.nullable().optional(),
  grasas: positiveNumber.nullable().optional(),
  fibra: positiveNumber.nullable().optional(),
})

export const setDietConfigSchema = z.object({
  mealTypeId: uuid,
  categoryRules: z.array(dietCategoryRuleSchema),
  macroTarget: dietMacroTargetSchema,
})

// ─────────────────────────────────────────────────────────────
// Meal logs
// ─────────────────────────────────────────────────────────────

const mealLogItemSchema = z.object({
  ingredientId: uuid,
  grams: z.number().positive('Los gramos deben ser > 0'),
})

export const createMealLogSchema = z.object({
  userId: uuid,
  mealTypeId: uuid,
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
  items: z.array(mealLogItemSchema).min(1, 'Debe agregar al menos un ingrediente'),
})

// ─────────────────────────────────────────────────────────────
// Analysis request
// ─────────────────────────────────────────────────────────────

export const analysisRequestSchema = z.object({
  userId: uuid,
  mealTypeId: uuid,
  items: z.array(mealLogItemSchema).min(1),
})

// ─────────────────────────────────────────────────────────────
// Stock
// ─────────────────────────────────────────────────────────────

export const UNIDADES = ['u', 'kg', 'g', 'L', 'ml', 'docena', 'paquete'] as const

export const createStockItemSchema = z.object({
  userId: uuid,
  ingredientId: uuid,
  cantidad: positiveNumber,
  unidad: z.enum(UNIDADES),
  minimo: positiveNumber,
})

export const updateStockItemSchema = z.object({
  cantidad: positiveNumber.optional(),
  unidad: z.enum(UNIDADES).optional(),
  minimo: positiveNumber.optional(),
})

// ─────────────────────────────────────────────────────────────
// Voz (Siri / Atajos) — alta/actualización de stock por nombre
// Los números pueden llegar como string desde Atajos → coerce.
// ─────────────────────────────────────────────────────────────

const coercedNonNegative = z.coerce.number().nonnegative('Debe ser ≥ 0')

const DEFAULT_VOICE_USER_ID = 'ea1884db-eba5-4e7a-bf2c-8a8849ad066f'

export const voiceStockSchema = z.object({
  userId: uuid.optional().default(DEFAULT_VOICE_USER_ID),
  ingrediente: nonEmptyString,
  cantidad: coercedNonNegative.optional(),
  minimo: coercedNonNegative.optional(),
  unidad: z.enum(UNIDADES).optional(),
  modo: z.enum(['set', 'sumar', 'restar']).optional(),
})
