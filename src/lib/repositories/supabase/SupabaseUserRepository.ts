import { SupabaseClient } from '@supabase/supabase-js'
import type { User, CreateUserDto, UpdateUserDto } from '@/models'
import type { UserRepository } from '../types'

function toUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    createdAt: row.created_at as string,
  }
}

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findAll(): Promise<User[]> {
    const { data, error } = await this.db
      .from('users')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(toUser)
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.db
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return toUser(data)
  }

  async create(dto: CreateUserDto): Promise<User> {
    const { data, error } = await this.db
      .from('users')
      .insert({ nombre: dto.nombre })
      .select()
      .single()
    if (error) throw error
    return toUser(data)
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const { data, error } = await this.db
      .from('users')
      .update({ nombre: dto.nombre })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return toUser(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('users').delete().eq('id', id)
    if (error) throw error
  }
}
