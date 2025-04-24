import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { error, context, timestamp, environment } = req.body

    if (!error) {
      return res.status(400).json({ message: 'Error object is required' })
    }

    // Create a task in ClickUp
    const task = {
      name: `Error Alert: ${error.code || 'UNKNOWN'} - ${error.message}`,
      description: `
## Error Details
- **Code:** ${error.code || 'UNKNOWN'}
- **Status:** ${error.statusCode}
- **Message:** ${error.message}
- **Environment:** ${environment || 'development'}
- **Time:** ${timestamp || new Date().toISOString()}

${context ? `## Context\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\`` : ''}
      `,
      status: 'to do',
      priority: error.statusCode >= 500 ? 1 : 2, // High priority for 5xx errors
      tags: ['error', error.code || 'UNKNOWN', environment || 'development']
    }

    const response = await fetch(`https://api.clickup.com/api/v2/list/${process.env.CLICKUP_LIST_ID}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: process.env.CLICKUP_API_KEY || ''
      },
      body: JSON.stringify(task)
    })

    if (!response.ok) {
      throw new Error('Failed to create ClickUp task')
    }

    return res.status(200).json({ message: 'Task created successfully' })
  } catch (err) {
    console.error('Error creating ClickUp task:', err)
    return res.status(500).json({ message: 'Failed to create task' })
  }
} 