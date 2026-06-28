/**
 * Orquesta repositorios + analyzeMeal.
 * Solo se usa en el servidor (route handlers).
 */
import type { MealLogItemInput, AnalysisResult, AnalysisRequest } from '@/models'
import type { Repositories } from '@/lib/repositories/types'
import { analyzeMeal } from './analysisService'

export async function previewAnalysis(
  repos: Repositories,
  req: AnalysisRequest,
): Promise<AnalysisResult> {
  const { userId, mealTypeId, items } = req

  const [allIngredients, allCategories, categoryRules, macroTarget] = await Promise.all([
    repos.ingredients.findAll(),
    repos.categories.findAll(),
    repos.diet.getCategoryRules(userId, mealTypeId),
    repos.diet.getMacroTarget(userId, mealTypeId),
  ])

  // Only include ingredients referenced in items
  const ingredientIds = new Set(items.map(i => i.ingredientId))
  const usedIngredients = allIngredients.filter(i => ingredientIds.has(i.id))

  const itemInputs: MealLogItemInput[] = items.map(i => ({
    ingredientId: i.ingredientId,
    grams: i.grams,
  }))

  return analyzeMeal(itemInputs, usedIngredients, allCategories, categoryRules, macroTarget)
}
