import { NextRequest } from 'next/server'
import { getRepositories } from '@/lib/repositories'
import { voiceStockSchema } from '@/lib/validation'
import { ok, unauthorized, serverError, handleError } from '@/lib/http'
import { upsertStockByVoice } from '@/services/voiceStockService'

/**
 * Endpoint pensado para Siri / Atajos de iOS.
 *
 * Recibe el nombre del ingrediente (y opcionalmente cantidad, mínimo y
 * unidad), crea el ingrediente si no existe y lo carga/actualiza en el
 * stock del usuario. Protegido por un token compartido (VOICE_API_TOKEN),
 * que se envía en el header `x-voice-token` o en el query param `token`.
 */
export async function POST(req: NextRequest) {
  try {
    const expected = process.env.VOICE_API_TOKEN
    if (!expected) {
      return serverError('VOICE_API_TOKEN no está configurado en el servidor')
    }

    const provided =
      req.headers.get('x-voice-token') ??
      new URL(req.url).searchParams.get('token')
    if (provided !== expected) {
      return unauthorized('Token inválido')
    }

    const body: unknown = await req.json()
    const dto = voiceStockSchema.parse(body)
    const repos = getRepositories()
    const result = await upsertStockByVoice(repos, dto)
    return ok(result)
  } catch (err) {
    return handleError(err)
  }
}
