import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { createMealLogSchema } from '@/lib/validation'
import { ok, created, badRequest, handleError } from '@/lib/http'
import { previewAnalysis } from '@/services/mealAnalysisService'
import type { MealLogWithAnalysis } from '@/models'

export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get('userId')
    if (!userId) return badRequest('userId es requerido')
    const repos = getRepositories()
    const logs = await repos.mealLogs.findByUserId(userId)
    return ok(logs)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const dto = createMealLogSchema.parse(body)
    const repos = getRepositories()

    // Crear el log
    const mealLog = await repos.mealLogs.create(dto)

    // Calcular análisis y devolverlo junto con el log
    const analysis = await previewAnalysis(repos, {
      userId: dto.userId,
      mealTypeId: dto.mealTypeId,
      items: dto.items,
    })

    const result: MealLogWithAnalysis = { mealLog, analysis }
    return created(result)
  } catch (err) {
    return handleError(err)
  }
}
