import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { createStockItemSchema } from '@/lib/validation'
import { ok, created, badRequest, handleError } from '@/lib/http'

export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get('userId')
    if (!userId) return badRequest('userId es requerido')
    const repos = getRepositories()
    const items = await repos.stock.findByUserId(userId)
    return ok(items)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const dto = createStockItemSchema.parse(body)
    const repos = getRepositories()
    const item = await repos.stock.create(dto)
    return created(item)
  } catch (err) {
    return handleError(err)
  }
}
