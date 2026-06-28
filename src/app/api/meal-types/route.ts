import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { createMealTypeSchema } from '@/lib/validation'
import { ok, created, badRequest, handleError } from '@/lib/http'

export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get('userId')
    if (!userId) return badRequest('userId es requerido')
    const repos = getRepositories()
    const mealTypes = await repos.mealTypes.findByUserId(userId)
    return ok(mealTypes)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const dto = createMealTypeSchema.parse(body)
    const repos = getRepositories()
    const mealType = await repos.mealTypes.create(dto)
    return created(mealType)
  } catch (err) {
    return handleError(err)
  }
}
