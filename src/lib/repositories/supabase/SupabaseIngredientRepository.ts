import { SupabaseClient } from '@supabase/supabase-js'
import type { Ingredient, CreateIngredientDto, UpdateIngredientDto } from '@/models'
import type { IngredientRepository } from '../types'

function toIngredient(row: Record<string, unknown>): Ingredient {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    categoryId: row.category_id as string,
    macros: {
      calorias: Number(row.calorias),
      proteinas: Number(row.proteinas),
      carbohidratos: Number(row.carbohidratos),
      grasas: Number(row.grasas),
      fibra: Number(row.fibra),
    },
    gramsPerPortion: Number(row.grams_per_portion),
    createdAt: row.created_at as string,
  }
}

export class SupabaseIngredientRepository implements IngredientRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findAll(): Promise<Ingredient[]> {
    const { data, error } = await this.db
      .from('ingredients')
      .select('*')
      .order('nombre', { ascending: true })
    if (error) throw error
    return (data ?? []).map(toIngredient)
  }

  async findById(id: string): Promise<Ingredient | null> {
    const { data, error } = await this.db
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return toIngredient(data)
  }

  async findByCategoryIds(categoryIds: string[]): Promise<Ingredient[]> {
    if (categoryIds.length === 0) return []
    const { data, error } = await this.db
      .from('ingredients')
      .select('*')
      .in('category_id', categoryIds)
      .order('nombre', { ascending: true })
    if (error) throw error
    return (data ?? []).map(toIngredient)
  }

  async create(dto: CreateIngredientDto): Promise<Ingredient> {
    const { data, error } = await this.db
      .from('ingredients')
      .insert({
        nombre: dto.nombre,
        category_id: dto.categoryId,
        calorias: dto.macros.calorias,
        proteinas: dto.macros.proteinas,
        carbohidratos: dto.macros.carbohidratos,
        grasas: dto.macros.grasas,
        fibra: dto.macros.fibra,
        grams_per_portion: dto.gramsPerPortion,
      })
      .select()
      .single()
    if (error) throw error
    return toIngredient(data)
  }

  async update(id: string, dto: UpdateIngredientDto): Promise<Ingredient> {
    const { data, error } = await this.db
      .from('ingredients')
      .update({
        nombre: dto.nombre,
        category_id: dto.categoryId,
        calorias: dto.macros.calorias,
        proteinas: dto.macros.proteinas,
        carbohidratos: dto.macros.carbohidratos,
        grasas: dto.macros.grasas,
        fibra: dto.macros.fibra,
        grams_per_portion: dto.gramsPerPortion,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return toIngredient(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('ingredients').delete().eq('id', id)
    if (error) throw error
  }
}
