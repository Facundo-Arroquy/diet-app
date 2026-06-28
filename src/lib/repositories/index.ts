import type { Repositories } from './types'
import { getSupabaseClient } from '@/lib/supabase/client'
import { SupabaseUserRepository } from './supabase/SupabaseUserRepository'
import { SupabaseCategoryRepository } from './supabase/SupabaseCategoryRepository'
import { SupabaseIngredientRepository } from './supabase/SupabaseIngredientRepository'
import { SupabaseMealTypeRepository } from './supabase/SupabaseMealTypeRepository'
import { SupabaseDietRepository } from './supabase/SupabaseDietRepository'
import { SupabaseMealLogRepository } from './supabase/SupabaseMealLogRepository'

let _repos: Repositories | null = null

/**
 * Factory de repositorios. Decide la implementación según
 * la variable de entorno STORAGE (default: "supabase").
 *
 * Extender aquí para agregar implementaciones "json" o "sqlite"
 * sin tocar la lógica de negocio.
 */
export function getRepositories(): Repositories {
  if (_repos) return _repos

  const storage = process.env.STORAGE ?? 'supabase'

  if (storage === 'supabase') {
    const db = getSupabaseClient()
    _repos = {
      users: new SupabaseUserRepository(db),
      categories: new SupabaseCategoryRepository(db),
      ingredients: new SupabaseIngredientRepository(db),
      mealTypes: new SupabaseMealTypeRepository(db),
      diet: new SupabaseDietRepository(db),
      mealLogs: new SupabaseMealLogRepository(db),
    }
    return _repos
  }

  throw new Error(`Implementación de storage no soportada: "${storage}". Valores válidos: "supabase"`)
}
