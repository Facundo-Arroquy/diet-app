import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { updateIngredientSchema } from '@/lib/validation'
import { ok, noContent, notFound, handleError } from '@/lib/http'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const repos = getRepositories()
    const ingredient = await repos.ingredients.findById(params.id)
    if (!ingredient) return notFound('Ingrediente no encontrado')
    return ok(ingredient)
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body: unknown = await req.json()
    const dto = updateIngredientSchema.parse(body)
    const repos = getRepositories()
    const existing = await repos.ingredients.findById(params.id)
    if (!existing) return notFound('Ingrediente no encontrado')
    const ingredient = await repos.ingredients.update(params.id, dto)
    return ok(ingredient)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const repos = getRepositories()
    const existing = await repos.ingredients.findById(params.id)
    if (!existing) return notFound('Ingrediente no encontrado')
    await repos.ingredients.delete(params.id)
    return noContent()
  } catch (err) {
    return handleError(err)
  }
}
