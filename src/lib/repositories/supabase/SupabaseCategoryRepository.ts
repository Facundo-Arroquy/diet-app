import { SupabaseClient } from '@supabase/supabase-js'
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/models'
import type { CategoryRepository } from '../types'

function toCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    parentId: (row.parent_id as string | null) ?? null,
    createdAt: row.created_at as string,
  }
}

export class SupabaseCategoryRepository implements CategoryRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findAll(): Promise<Category[]> {
    const { data, error } = await this.db
      .from('categories')
      .select('*')
      .order('nombre', { ascending: true })
    if (error) throw error
    return (data ?? []).map(toCategory)
  }

  async findById(id: string): Promise<Category | null> {
    const { data, error } = await this.db
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return toCategory(data)
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const { data, error } = await this.db
      .from('categories')
      .insert({ nombre: dto.nombre, parent_id: dto.parentId ?? null })
      .select()
      .single()
    if (error) throw error
    return toCategory(data)
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const { data, error } = await this.db
      .from('categories')
      .update({ nombre: dto.nombre, parent_id: dto.parentId ?? null })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return toCategory(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('categories').delete().eq('id', id)
    if (error) throw error
  }
}
