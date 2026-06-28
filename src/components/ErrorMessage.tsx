interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <span className="text-red-500 text-lg" aria-hidden="true">⚠️</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800 focus-visible:outline-red-600"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
