import { SupabaseClient } from '@supabase/supabase-js'
import type { StockItem, CreateStockItemDto, UpdateStockItemDto } from '@/models'
import type { StockRepository } from '../types'

function toStockItem(row: Record<string, unknown>): StockItem {
  const ingr = row.ingredients as { nombre: string } | null
  return {
    id: row.id as string,
    userId: row.user_id as string,
    ingredientId: row.ingredient_id as string,
    ingredientNombre: ingr?.nombre ?? '',
    cantidad: Number(row.cantidad),
    unidad: row.unidad as string,
    minimo: Number(row.minimo),
    updatedAt: row.updated_at as string,
  }
}

export class SupabaseStockRepository implements StockRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findByUserId(userId: string): Promise<StockItem[]> {
    const { data, error } = await this.db
      .from('stock_items')
      .select('*, ingredients(nombre)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(toStockItem)
  }

  async create(dto: CreateStockItemDto): Promise<StockItem> {
    const { data, error } = await this.db
      .from('stock_items')
      .insert({
        user_id: dto.userId,
        ingredient_id: dto.ingredientId,
        cantidad: dto.cantidad,
        unidad: dto.unidad,
        minimo: dto.minimo,
      })
      .select('*, ingredients(nombre)')
      .single()
    if (error) throw error
    return toStockItem(data as Record<string, unknown>)
  }

  async update(id: string, dto: UpdateStockItemDto): Promise<StockItem> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (dto.cantidad !== undefined) patch.cantidad = dto.cantidad
    if (dto.unidad !== undefined) patch.unidad = dto.unidad
    if (dto.minimo !== undefined) patch.minimo = dto.minimo

    const { data, error } = await this.db
      .from('stock_items')
      .update(patch)
      .eq('id', id)
      .select('*, ingredients(nombre)')
      .single()
    if (error) throw error
    return toStockItem(data as Record<string, unknown>)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('stock_items').delete().eq('id', id)
    if (error) throw error
  }
}
