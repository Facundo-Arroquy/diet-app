import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { updateCategorySchema } from '@/lib/validation'
import { ok, noContent, notFound, handleError } from '@/lib/http'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const repos = getRepositories()
    const category = await repos.categories.findById(params.id)
    if (!category) return notFound('Categoría no encontrada')
    return ok(category)
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body: unknown = await req.json()
    const dto = updateCategorySchema.parse(body)
    const repos = getRepositories()
    const existing = await repos.categories.findById(params.id)
    if (!existing) return notFound('Categoría no encontrada')
    const category = await repos.categories.update(params.id, dto)
    return ok(category)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const repos = getRepositories()
    const existing = await repos.categories.findById(params.id)
    if (!existing) return notFound('Categoría no encontrada')
    await repos.categories.delete(params.id)
    return noContent()
  } catch (err) {
    return handleError(err)
  }
}
