interface RetryOptions {
  maxAttempts: number
  delayMs: number
  backoffFactor: number
  maxDelayMs: number
}

const defaultOptions: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffFactor: 2,
  maxDelayMs: 10000
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...defaultOptions, ...options }
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === config.maxAttempts) {
        throw lastError
      }

      const delay = Math.min(
        config.delayMs * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelayMs
      )

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return true
    }
    
    // Server errors (5xx)
    if (error.message.includes('500') || error.message.includes('503')) {
      return true
    }
    
    // Rate limiting
    if (error.message.includes('429')) {
      return true
    }
  }
  
  return false
} 