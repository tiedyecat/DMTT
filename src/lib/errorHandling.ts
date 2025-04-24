export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleApiError(error: unknown): AppError {
  console.error('API Error:', error)

  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message)
  }

  if (typeof error === 'string') {
    return new AppError(error)
  }

  return new AppError('An unexpected error occurred')
}

export function handleDatabaseError(error: unknown): AppError {
  console.error('Database Error:', error)

  if (error instanceof Error) {
    // Handle specific database errors
    if (error.message.includes('connection')) {
      return new AppError('Database connection error', 503, 'DB_CONNECTION_ERROR')
    }
    if (error.message.includes('timeout')) {
      return new AppError('Database query timeout', 504, 'DB_TIMEOUT')
    }
    if (error.message.includes('permission')) {
      return new AppError('Database permission denied', 403, 'DB_PERMISSION_DENIED')
    }
  }

  return new AppError('Database operation failed', 500, 'DB_ERROR')
}

export function handleAuthError(error: unknown): AppError {
  console.error('Authentication Error:', error)

  if (error instanceof Error) {
    if (error.message.includes('token')) {
      return new AppError('Invalid authentication token', 401, 'AUTH_TOKEN_ERROR')
    }
    if (error.message.includes('permission')) {
      return new AppError('Insufficient permissions', 403, 'AUTH_PERMISSION_DENIED')
    }
  }

  return new AppError('Authentication failed', 401, 'AUTH_ERROR')
}

export function handleValidationError(error: unknown): AppError {
  console.error('Validation Error:', error)

  if (error instanceof Error) {
    return new AppError(error.message, 400, 'VALIDATION_ERROR')
  }

  return new AppError('Invalid input data', 400, 'VALIDATION_ERROR')
} 