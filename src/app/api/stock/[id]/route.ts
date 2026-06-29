import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { updateStockItemSchema } from '@/lib/validation'
import { ok, noContent, handleError } from '@/lib/http'

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const body: unknown = await req.json()
    const dto = updateStockItemSchema.parse(body)
    const repos = getRepositories()
    const item = await repos.stock.update(params.id, dto)
    return ok(item)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const repos = getRepositories()
    await repos.stock.delete(params.id)
    return noContent()
  } catch (err) {
    return handleError(err)
  }
}
