import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { createIngredientSchema } from '@/lib/validation'
import { ok, created, handleError } from '@/lib/http'

export async function GET() {
  try {
    const repos = getRepositories()
    const ingredients = await repos.ingredients.findAll()
    return ok(ingredients)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const dto = createIngredientSchema.parse(body)
    const repos = getRepositories()
    const ingredient = await repos.ingredients.create(dto)
    return created(ingredient)
  } catch (err) {
    return handleError(err)
  }
}
