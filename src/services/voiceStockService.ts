/**
 * Alta/actualización de stock por voz (Siri / Atajos de iOS).
 *
 * Resuelve el ingrediente por NOMBRE: si no existe lo crea con macros en
 * sus valores por defecto (cero) y una categoría por defecto. Luego carga
 * o actualiza el item de stock del usuario — el mismo resultado que el
 * botón "+ Agregar" de la planilla, pero hablándole a Siri.
 *
 * Solo se usa en el servidor (route handlers).
 */
import type { Repositories } from '@/lib/repositories/types'
import type { StockItem } from '@/models'

const DEFAULT_CATEGORY = 'Sin categoría'
const DEFAULT_MACROS = { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 }
const DEFAULT_GRAMS_PER_PORTION = 100
const DEFAULT_UNIDAD = 'u'

export interface VoiceStockInput {
  userId: string
  ingrediente: string
  cantidad?: number
  minimo?: number
  unidad?: string
  modo?: 'set' | 'sumar' | 'restar'
}

export interface VoiceStockResult {
  item: StockItem
  ingredienteCreado: boolean
  accion: 'creado' | 'actualizado'
  mensaje: string
}

/** Comparación de nombres tolerante (sin mayúsculas ni espacios sobrantes). */
function normalize(s: string): string {
  return s.trim().toLowerCase()
}

async function findOrCreateDefaultCategory(repos: Repositories): Promise<string> {
  const cats = await repos.categories.findAll()
  const found = cats.find(c => normalize(c.nombre) === normalize(DEFAULT_CATEGORY))
  if (found) return found.id
  const created = await repos.categories.create({ nombre: DEFAULT_CATEGORY })
  return created.id
}

export async function upsertStockByVoice(
  repos: Repositories,
  input: VoiceStockInput,
): Promise<VoiceStockResult> {
  const nombre = input.ingrediente.trim()
  const cantidad = input.cantidad ?? 0
  const minimo = input.minimo ?? 0
  const unidad = input.unidad ?? DEFAULT_UNIDAD

  // 1. Validar usuario
  const user = await repos.users.findById(input.userId)
  if (!user) throw new Error('Usuario no encontrado')

  // 2. Buscar ingrediente por nombre (case-insensitive)
  const allIngredients = await repos.ingredients.findAll()
  let ingredient = allIngredients.find(i => normalize(i.nombre) === normalize(nombre))
  let ingredienteCreado = false

  // 3. Crear el ingrediente si no existe, con macros por defecto (cero)
  if (!ingredient) {
    const categoryId = await findOrCreateDefaultCategory(repos)
    ingredient = await repos.ingredients.create({
      nombre,
      categoryId,
      macros: { ...DEFAULT_MACROS },
      gramsPerPortion: DEFAULT_GRAMS_PER_PORTION,
    })
    ingredienteCreado = true
  }

  // 4. Cargar o actualizar el item de stock del usuario
  const stockItems = await repos.stock.findByUserId(input.userId)
  const existing = stockItems.find(s => s.ingredientId === ingredient!.id)
  const modo = input.modo ?? 'set'

  let item: StockItem
  let accion: 'creado' | 'actualizado'
  if (existing) {
    let nuevaCantidad = cantidad
    if (modo === 'sumar') nuevaCantidad = (existing.cantidad ?? 0) + cantidad
    if (modo === 'restar') nuevaCantidad = Math.max(0, (existing.cantidad ?? 0) - cantidad)
    item = await repos.stock.update(existing.id, { cantidad: nuevaCantidad, unidad, minimo })
    accion = 'actualizado'
  } else {
    item = await repos.stock.create({
      userId: input.userId,
      ingredientId: ingredient.id,
      cantidad,
      unidad,
      minimo,
    })
    accion = 'creado'
  }

  const cantidadFinal = item.cantidad ?? 0
  let mensaje: string
  if (accion === 'creado') {
    mensaje = `Agregué ${item.ingredientNombre} al stock: ${cantidadFinal} ${unidad}, mínimo ${minimo} ${unidad}.`
  } else if (modo === 'sumar') {
    mensaje = `Sumé ${cantidad} ${unidad} de ${item.ingredientNombre}. Stock actual: ${cantidadFinal} ${unidad}.`
  } else if (modo === 'restar') {
    mensaje = `Resté ${cantidad} ${unidad} de ${item.ingredientNombre}. Stock actual: ${cantidadFinal} ${unidad}.`
  } else {
    mensaje = `Actualicé ${item.ingredientNombre}: ${cantidadFinal} ${unidad}, mínimo ${minimo} ${unidad}.`
  }

  return { item, ingredienteCreado, accion, mensaje }
}
