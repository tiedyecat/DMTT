import { NextApiRequest, NextApiResponse } from 'next'
import { AppError } from '../../lib/errorHandling'
import { logError } from '../../lib/errorLogging'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { error, context } = req.body

    if (!error) {
      return res.status(400).json({ message: 'Error object is required' })
    }

    const appError = new AppError(
      error.message || 'Unknown error',
      error.statusCode || 500,
      error.code || 'UNKNOWN_ERROR'
    )

    logError(appError, context)

    return res.status(200).json({ message: 'Error reported successfully' })
  } catch (err) {
    console.error('Error in error-report endpoint:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
} 