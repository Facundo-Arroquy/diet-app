import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { analysisRequestSchema } from '@/lib/validation'
import { ok, handleError } from '@/lib/http'
import { previewAnalysis } from '@/services/mealAnalysisService'

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const dto = analysisRequestSchema.parse(body)
    const repos = getRepositories()
    const analysis = await previewAnalysis(repos, dto)
    return ok(analysis)
  } catch (err) {
    return handleError(err)
  }
}
