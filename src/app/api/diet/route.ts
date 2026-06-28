import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { setDietConfigSchema } from '@/lib/validation'
import { ok, badRequest, handleError } from '@/lib/http'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const mealTypeId = url.searchParams.get('mealTypeId')
    if (!userId) return badRequest('userId es requerido')
    if (!mealTypeId) return badRequest('mealTypeId es requerido')
    const repos = getRepositories()
    const config = await repos.diet.getConfig(userId, mealTypeId)
    return ok(config)
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    if (!userId) return badRequest('userId es requerido')
    const body: unknown = await req.json()
    const dto = setDietConfigSchema.parse(body)
    const repos = getRepositories()
    const config = await repos.diet.setConfig(userId, dto)
    return ok(config)
  } catch (err) {
    return handleError(err)
  }
}
