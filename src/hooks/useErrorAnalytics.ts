import { useEffect, useCallback, useState } from 'react'
import { AppError } from '../lib/errorHandling'
import { logError } from '../lib/errorLogging'

interface ErrorAnalytics {
  errorCount: number
  errorTypes: Record<string, number>
  lastError: AppError | null
  clearErrors: () => void
}

export function useErrorAnalytics(): ErrorAnalytics {
  const [errorCount, setErrorCount] = useState(0)
  const [errorTypes, setErrorTypes] = useState<Record<string, number>>({})
  const [lastError, setLastError] = useState<AppError | null>(null)

  const handleError = useCallback((error: unknown, context?: Record<string, unknown>) => {
    if (error instanceof AppError) {
      setLastError(error)
      setErrorCount(prev => prev + 1)
      setErrorTypes(prev => ({
        ...prev,
        [error.code || 'UNKNOWN']: (prev[error.code || 'UNKNOWN'] || 0) + 1
      }))
      logError(error, context)
    } else {
      const appError = new AppError(
        error instanceof Error ? error.message : 'Unknown error',
        500,
        'UNKNOWN_ERROR'
      )
      setLastError(appError)
      setErrorCount(prev => prev + 1)
      setErrorTypes(prev => ({
        ...prev,
        UNKNOWN_ERROR: (prev.UNKNOWN_ERROR || 0) + 1
      }))
      logError(appError, context)
    }
  }, [])

  const clearErrors = useCallback(() => {
    setErrorCount(0)
    setErrorTypes({})
    setLastError(null)
  }, [])

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(event.reason)
    }

    const handleError = (event: ErrorEvent) => {
      handleError(event.error)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [handleError])

  return {
    errorCount,
    errorTypes,
    lastError,
    clearErrors
  }
} 