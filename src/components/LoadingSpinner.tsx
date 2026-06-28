export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={`${sizes[size]} animate-spin rounded-full border-2 border-gray-300 border-t-brand-600`}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  )
}
