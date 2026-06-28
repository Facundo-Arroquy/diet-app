import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { createUserSchema } from '@/lib/validation'
import { ok, created, handleError } from '@/lib/http'

export async function GET() {
  try {
    const repos = getRepositories()
    const users = await repos.users.findAll()
    return ok(users)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const dto = createUserSchema.parse(body)
    const repos = getRepositories()
    const user = await repos.users.create(dto)
    return created(user)
  } catch (err) {
    return handleError(err)
  }
}
