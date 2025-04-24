import { AppError } from './errorHandling'
import * as Sentry from '@sentry/nextjs'

interface ErrorLog {
  timestamp: string
  error: AppError
  context?: Record<string, unknown>
  userAgent?: string
  url?: string
}

class ErrorLogger {
  private static instance: ErrorLogger
  private logs: ErrorLog[] = []
  private readonly maxLogs = 100

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  log(error: AppError, context?: Record<string, unknown>) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      error,
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }

    this.logs.unshift(log)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Log:', log)
    }

    // Send to Sentry
    Sentry.withScope(scope => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value)
        })
      }
      
      if (log.userAgent) {
        scope.setUser({ userAgent: log.userAgent })
      }
      
      if (log.url) {
        scope.setTag('url', log.url)
      }

      scope.setTag('errorCode', error.code || 'UNKNOWN')
      scope.setLevel('error')
      
      Sentry.captureException(error)
    })
  }

  getRecentLogs(): ErrorLog[] {
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }
}

export const errorLogger = ErrorLogger.getInstance()

export function logError(error: unknown, context?: Record<string, unknown>) {
  if (error instanceof AppError) {
    errorLogger.log(error, context)
  } else {
    const appError = new AppError(
      error instanceof Error ? error.message : 'Unknown error',
      500,
      'UNKNOWN_ERROR'
    )
    errorLogger.log(appError, context)
  }
} 