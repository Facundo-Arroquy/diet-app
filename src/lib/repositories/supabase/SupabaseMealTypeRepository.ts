import { SupabaseClient } from '@supabase/supabase-js'
import type { MealType, CreateMealTypeDto, UpdateMealTypeDto } from '@/models'
import type { MealTypeRepository } from '../types'

function toMealType(row: Record<string, unknown>): MealType {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    nombre: row.nombre as string,
    orden: Number(row.orden),
    createdAt: row.created_at as string,
  }
}

export class SupabaseMealTypeRepository implements MealTypeRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findByUserId(userId: string): Promise<MealType[]> {
    const { data, error } = await this.db
      .from('meal_types')
      .select('*')
      .eq('user_id', userId)
      .order('orden', { ascending: true })
    if (error) throw error
    return (data ?? []).map(toMealType)
  }

  async findById(id: string): Promise<MealType | null> {
    const { data, error } = await this.db
      .from('meal_types')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return toMealType(data)
  }

  async create(dto: CreateMealTypeDto): Promise<MealType> {
    const { data, error } = await this.db
      .from('meal_types')
      .insert({ user_id: dto.userId, nombre: dto.nombre, orden: dto.orden })
      .select()
      .single()
    if (error) throw error
    return toMealType(data)
  }

  async update(id: string, dto: UpdateMealTypeDto): Promise<MealType> {
    const { data, error } = await this.db
      .from('meal_types')
      .update({ nombre: dto.nombre, orden: dto.orden })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return toMealType(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('meal_types').delete().eq('id', id)
    if (error) throw error
  }
}
