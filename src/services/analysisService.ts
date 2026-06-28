import type {
  Macros, Ingredient, Category, DietCategoryRule, DietMacroTarget,
  MealLogItemInput, AnalysisResult, CategoryAnalysis, MacroAnalysis,
  MacroStatus, PortionStatus,
} from '@/models'
import { getDescendantIds } from './categoryService'

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

function roundMacros(m: Macros): Macros {
  return {
    calorias: round(m.calorias, 1),
    proteinas: round(m.proteinas, 2),
    carbohidratos: round(m.carbohidratos, 2),
    grasas: round(m.grasas, 2),
    fibra: round(m.fibra, 2),
  }
}

/**
 * Banda de tolerancia: 5% del objetivo o mínimo 0.05.
 * - "faltante" si actual < target - band
 * - "exceso"   si actual > target + band
 * - "cumplido" si está dentro
 */
function getPortionStatus(actual: number, target: number): PortionStatus {
  const band = Math.max(target * 0.05, 0.05)
  if (actual < target - band) return 'faltante'
  if (actual > target + band) return 'exceso'
  return 'cumplido'
}

function getMacroStatus(actual: number, target: number | null): MacroStatus {
  if (target === null || target === undefined) return 'sin-objetivo'
  const band = Math.max(target * 0.05, 0.05)
  if (actual < target - band) return 'faltante'
  if (actual > target + band) return 'exceso'
  return 'cumplido'
}

// ─────────────────────────────────────────────────────────────
// Core analysis — función pura y testeable
// ─────────────────────────────────────────────────────────────

export function analyzeMeal(
  items: MealLogItemInput[],
  ingredients: Ingredient[],
  categories: Category[],
  categoryRules: DietCategoryRule[],
  macroTarget: DietMacroTarget | null,
): AnalysisResult {
  const ingredientMap = new Map(ingredients.map(i => [i.id, i]))

  // 1. Calcular macros totales
  const totals: Macros = { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 }
  for (const item of items) {
    const ingredient = ingredientMap.get(item.ingredientId)
    if (!ingredient) continue
    const factor = item.grams / 100
    totals.calorias      += ingredient.macros.calorias      * factor
    totals.proteinas     += ingredient.macros.proteinas     * factor
    totals.carbohidratos += ingredient.macros.carbohidratos * factor
    totals.grasas        += ingredient.macros.grasas        * factor
    totals.fibra         += ingredient.macros.fibra         * factor
  }

  // 2. Calcular porciones por categoría hoja
  const portionsByCategoryId = new Map<string, number>()
  for (const item of items) {
    const ingredient = ingredientMap.get(item.ingredientId)
    if (!ingredient) continue
    const portions = item.grams / ingredient.gramsPerPortion
    const current = portionsByCategoryId.get(ingredient.categoryId) ?? 0
    portionsByCategoryId.set(ingredient.categoryId, current + portions)
  }

  // 3. Roll-up jerárquico + comparar contra reglas
  const categoryResults: CategoryAnalysis[] = categoryRules.map(rule => {
    const descendantIds = getDescendantIds(rule.categoryId, categories)
    const allCatIds = [rule.categoryId, ...descendantIds]

    const actual = allCatIds.reduce(
      (sum, catId) => sum + (portionsByCategoryId.get(catId) ?? 0),
      0,
    )

    const category = categories.find(c => c.id === rule.categoryId)
    const status = getPortionStatus(actual, rule.requiredPortions)

    return {
      categoryId: rule.categoryId,
      categoryNombre: category?.nombre ?? 'Desconocida',
      required: rule.requiredPortions,
      actual: round(actual, 2),
      status,
    }
  })

  // 4. Comparar macros vs objetivo
  type MacroKey = keyof Macros
  const macroDefinitions: { nombre: string; key: MacroKey; unit: string }[] = [
    { nombre: 'Calorías',      key: 'calorias',      unit: 'kcal' },
    { nombre: 'Proteínas',     key: 'proteinas',     unit: 'g' },
    { nombre: 'Carbohidratos', key: 'carbohidratos', unit: 'g' },
    { nombre: 'Grasas',        key: 'grasas',        unit: 'g' },
    { nombre: 'Fibra',         key: 'fibra',         unit: 'g' },
  ]

  const macroResults: MacroAnalysis[] = macroDefinitions.map(({ nombre, key }) => {
    const target = macroTarget?.[key] ?? null
    const actual = round(totals[key], key === 'calorias' ? 1 : 2)
    const status = getMacroStatus(actual, target)
    return { nombre, key, target: target ?? null, actual, status }
  })

  return {
    totals: roundMacros(totals),
    categories: categoryResults,
    macros: macroResults,
  }
}
