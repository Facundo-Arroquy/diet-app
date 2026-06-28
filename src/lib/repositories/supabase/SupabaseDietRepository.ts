import { SupabaseClient } from '@supabase/supabase-js'
import type {
  DietCategoryRule, DietMacroTarget, DietConfig, SetDietConfigDto,
} from '@/models'
import type { DietRepository } from '../types'

function toCategoryRule(row: Record<string, unknown>): DietCategoryRule {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    mealTypeId: row.meal_type_id as string,
    categoryId: row.category_id as string,
    requiredPortions: Number(row.required_portions),
    createdAt: row.created_at as string,
  }
}

function toMacroTarget(row: Record<string, unknown>): DietMacroTarget {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    mealTypeId: row.meal_type_id as string,
    calorias: row.calorias != null ? Number(row.calorias) : null,
    proteinas: row.proteinas != null ? Number(row.proteinas) : null,
    carbohidratos: row.carbohidratos != null ? Number(row.carbohidratos) : null,
    grasas: row.grasas != null ? Number(row.grasas) : null,
    fibra: row.fibra != null ? Number(row.fibra) : null,
    createdAt: row.created_at as string,
  }
}

export class SupabaseDietRepository implements DietRepository {
  constructor(private readonly db: SupabaseClient) {}

  async getCategoryRules(userId: string, mealTypeId: string): Promise<DietCategoryRule[]> {
    const { data, error } = await this.db
      .from('diet_category_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('meal_type_id', mealTypeId)
    if (error) throw error
    return (data ?? []).map(toCategoryRule)
  }

  async getMacroTarget(userId: string, mealTypeId: string): Promise<DietMacroTarget | null> {
    const { data, error } = await this.db
      .from('diet_macro_targets')
      .select('*')
      .eq('user_id', userId)
      .eq('meal_type_id', mealTypeId)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return toMacroTarget(data)
  }

  async getConfig(userId: string, mealTypeId: string): Promise<DietConfig> {
    const [categoryRules, macroTarget] = await Promise.all([
      this.getCategoryRules(userId, mealTypeId),
      this.getMacroTarget(userId, mealTypeId),
    ])
    return { mealTypeId, categoryRules, macroTarget }
  }

  async setConfig(userId: string, dto: SetDietConfigDto): Promise<DietConfig> {
    const { mealTypeId, categoryRules, macroTarget } = dto

    // Reemplazar reglas: borrar todas las existentes e insertar las nuevas
    const { error: deleteRulesError } = await this.db
      .from('diet_category_rules')
      .delete()
      .eq('user_id', userId)
      .eq('meal_type_id', mealTypeId)
    if (deleteRulesError) throw deleteRulesError

    if (categoryRules.length > 0) {
      const rows = categoryRules.map(r => ({
        user_id: userId,
        meal_type_id: mealTypeId,
        category_id: r.categoryId,
        required_portions: r.requiredPortions,
      }))
      const { error: insertError } = await this.db
        .from('diet_category_rules')
        .insert(rows)
      if (insertError) throw insertError
    }

    // Upsert macro target
    const macroRow = {
      user_id: userId,
      meal_type_id: mealTypeId,
      calorias: macroTarget.calorias ?? null,
      proteinas: macroTarget.proteinas ?? null,
      carbohidratos: macroTarget.carbohidratos ?? null,
      grasas: macroTarget.grasas ?? null,
      fibra: macroTarget.fibra ?? null,
    }
    const { error: macroError } = await this.db
      .from('diet_macro_targets')
      .upsert(macroRow, { onConflict: 'user_id,meal_type_id' })
    if (macroError) throw macroError

    return this.getConfig(userId, mealTypeId)
  }
}
