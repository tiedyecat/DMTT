import { AppError } from './errorHandling'

interface NotificationConfig {
  webhookUrl?: string
  emailRecipients?: string[]
  minSeverity?: number
}

class ErrorNotifier {
  private static instance: ErrorNotifier
  private config: NotificationConfig = {
    minSeverity: 500
  }

  private constructor() {}

  static getInstance(): ErrorNotifier {
    if (!ErrorNotifier.instance) {
      ErrorNotifier.instance = new ErrorNotifier()
    }
    return ErrorNotifier.instance
  }

  configure(config: Partial<NotificationConfig>) {
    this.config = { ...this.config, ...config }
  }

  async notify(error: AppError, context?: Record<string, unknown>) {
    if (error.statusCode < (this.config.minSeverity || 500)) {
      return
    }

    const notification = {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      },
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }

    const notifications: Promise<Response>[] = []

    // Send to webhook if configured
    if (this.config.webhookUrl) {
      notifications.push(
        fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notification)
        })
      )
    }

    // Send to ClickUp
    notifications.push(
      fetch('/api/notify-clickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      })
    )

    // Send email if configured
    if (this.config.emailRecipients?.length) {
      notifications.push(
        fetch('/api/send-error-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients: this.config.emailRecipients,
            ...notification
          })
        })
      )
    }

    try {
      await Promise.all(notifications)
    } catch (err) {
      console.error('Error sending notifications:', err)
    }
  }
}

export const errorNotifier = ErrorNotifier.getInstance()

export function notifyError(error: unknown, context?: Record<string, unknown>) {
  if (error instanceof AppError) {
    errorNotifier.notify(error, context)
  } else {
    const appError = new AppError(
      error instanceof Error ? error.message : 'Unknown error',
      500,
      'UNKNOWN_ERROR'
    )
    errorNotifier.notify(appError, context)
  }
} 