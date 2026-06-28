import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { createCategorySchema } from '@/lib/validation'
import { ok, created, handleError } from '@/lib/http'

export async function GET() {
  try {
    const repos = getRepositories()
    const categories = await repos.categories.findAll()
    return ok(categories)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const dto = createCategorySchema.parse(body)
    const repos = getRepositories()
    const category = await repos.categories.create(dto)
    return created(category)
  } catch (err) {
    return handleError(err)
  }
}
