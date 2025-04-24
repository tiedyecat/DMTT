import { NextApiRequest, NextApiResponse } from 'next'
import { AppError } from '../../lib/errorHandling'
import { notifyError } from '../../lib/errorNotifications'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Create a test error
    const testError = new AppError(
      'This is a test error for ClickUp integration',
      500,
      'TEST_ERROR'
    )

    // Add some test context
    const context = {
      testId: '123',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      testData: {
        sample: 'data',
        numbers: [1, 2, 3],
        nested: {
          field: 'value'
        }
      }
    }

    // Notify about the error
    await notifyError(testError, context)

    return res.status(200).json({
      message: 'Test error created successfully',
      error: {
        message: testError.message,
        code: testError.code,
        statusCode: testError.statusCode
      },
      context
    })
  } catch (err) {
    console.error('Error in test endpoint:', err)
    return res.status(500).json({ message: 'Failed to create test error' })
  }
} 