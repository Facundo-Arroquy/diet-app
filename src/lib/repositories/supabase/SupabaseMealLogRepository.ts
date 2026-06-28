import { SupabaseClient } from '@supabase/supabase-js'
import type { MealLog, MealLogItem, CreateMealLogDto } from '@/models'
import type { MealLogRepository } from '../types'

function toMealLogItem(row: Record<string, unknown>): MealLogItem {
  return {
    id: row.id as string,
    ingredientId: row.ingredient_id as string,
    grams: Number(row.grams),
    createdAt: row.created_at as string,
  }
}

function toMealLog(row: Record<string, unknown>): MealLog {
  const items = Array.isArray(row.meal_log_items)
    ? (row.meal_log_items as Record<string, unknown>[]).map(toMealLogItem)
    : []
  return {
    id: row.id as string,
    userId: row.user_id as string,
    mealTypeId: row.meal_type_id as string,
    fecha: row.fecha as string,
    items,
    createdAt: row.created_at as string,
  }
}

export class SupabaseMealLogRepository implements MealLogRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findByUserId(userId: string, limit = 20): Promise<MealLog[]> {
    const { data, error } = await this.db
      .from('meal_logs')
      .select('*, meal_log_items(*)')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []).map(toMealLog)
  }

  async findById(id: string): Promise<MealLog | null> {
    const { data, error } = await this.db
      .from('meal_logs')
      .select('*, meal_log_items(*)')
      .eq('id', id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return toMealLog(data)
  }

  async create(dto: CreateMealLogDto): Promise<MealLog> {
    // Insert meal_log
    const { data: logData, error: logError } = await this.db
      .from('meal_logs')
      .insert({
        user_id: dto.userId,
        meal_type_id: dto.mealTypeId,
        fecha: dto.fecha,
      })
      .select()
      .single()
    if (logError) throw logError

    const logId: string = (logData as Record<string, unknown>).id as string

    // Insert items
    if (dto.items.length > 0) {
      const itemRows = dto.items.map(item => ({
        meal_log_id: logId,
        ingredient_id: item.ingredientId,
        grams: item.grams,
      }))
      const { error: itemsError } = await this.db
        .from('meal_log_items')
        .insert(itemRows)
      if (itemsError) throw itemsError
    }

    // Fetch complete record
    const created = await this.findById(logId)
    if (!created) throw new Error('Error al crear el registro de comida')
    return created
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('meal_logs').delete().eq('id', id)
    if (error) throw error
  }
}
