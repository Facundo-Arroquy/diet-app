import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 })
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

export function badRequest(message: string, details?: unknown): NextResponse {
  return NextResponse.json({ error: message, details }, { status: 400 })
}

export function notFound(message = 'No encontrado'): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function serverError(message: string, err?: unknown): NextResponse {
  console.error('[API Error]', message, err)
  return NextResponse.json({ error: message }, { status: 500 })
}

export function handleZodError(err: ZodError): NextResponse {
  return badRequest('Datos inválidos', err.flatten().fieldErrors)
}

export function handleError(err: unknown): NextResponse {
  if (err instanceof ZodError) return handleZodError(err)
  if (err instanceof Error) return serverError(err.message)
  return serverError('Error inesperado')
}

export function requireQueryParam(
  url: URL,
  param: string,
): string | null {
  return url.searchParams.get(param)
}
