import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { updateMealTypeSchema } from '@/lib/validation'
import { ok, noContent, notFound, handleError } from '@/lib/http'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const repos = getRepositories()
    const mealType = await repos.mealTypes.findById(params.id)
    if (!mealType) return notFound('Tipo de comida no encontrado')
    return ok(mealType)
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body: unknown = await req.json()
    const dto = updateMealTypeSchema.parse(body)
    const repos = getRepositories()
    const existing = await repos.mealTypes.findById(params.id)
    if (!existing) return notFound('Tipo de comida no encontrado')
    const mealType = await repos.mealTypes.update(params.id, dto)
    return ok(mealType)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const repos = getRepositories()
    const existing = await repos.mealTypes.findById(params.id)
    if (!existing) return notFound('Tipo de comida no encontrado')
    await repos.mealTypes.delete(params.id)
    return noContent()
  } catch (err) {
    return handleError(err)
  }
}
