import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { updateUserSchema } from '@/lib/validation'
import { ok, noContent, notFound, handleError } from '@/lib/http'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const repos = getRepositories()
    const user = await repos.users.findById(params.id)
    if (!user) return notFound('Usuario no encontrado')
    return ok(user)
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body: unknown = await req.json()
    const dto = updateUserSchema.parse(body)
    const repos = getRepositories()
    const existing = await repos.users.findById(params.id)
    if (!existing) return notFound('Usuario no encontrado')
    const user = await repos.users.update(params.id, dto)
    return ok(user)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const repos = getRepositories()
    const existing = await repos.users.findById(params.id)
    if (!existing) return notFound('Usuario no encontrado')
    await repos.users.delete(params.id)
    return noContent()
  } catch (err) {
    return handleError(err)
  }
}
