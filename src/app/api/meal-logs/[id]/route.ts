import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { ok, noContent, notFound, handleError } from '@/lib/http'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const repos = getRepositories()
    const log = await repos.mealLogs.findById(params.id)
    if (!log) return notFound('Registro no encontrado')
    return ok(log)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const repos = getRepositories()
    const existing = await repos.mealLogs.findById(params.id)
    if (!existing) return notFound('Registro no encontrado')
    await repos.mealLogs.delete(params.id)
    return noContent()
  } catch (err) {
    return handleError(err)
  }
}
