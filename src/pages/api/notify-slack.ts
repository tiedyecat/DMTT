import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { channel, error, context, timestamp, environment } = req.body

    if (!channel || !error) {
      return res.status(400).json({ message: 'Channel and error are required' })
    }

    const message = {
      channel,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Error Alert',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Error Code:*\n${error.code || 'UNKNOWN'}`
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n${error.statusCode}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Message:*\n${error.message}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Environment:* ${environment || 'development'}`
            },
            {
              type: 'mrkdwn',
              text: `*Time:* ${timestamp || new Date().toISOString()}`
            }
          ]
        }
      ]
    }

    if (context) {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Context:*\n\`\`\`${JSON.stringify(context, null, 2)}\`\`\``
        }
      })
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
      },
      body: JSON.stringify(message)
    })

    if (!response.ok) {
      throw new Error('Failed to send Slack notification')
    }

    return res.status(200).json({ message: 'Notification sent successfully' })
  } catch (err) {
    console.error('Error sending Slack notification:', err)
    return res.status(500).json({ message: 'Failed to send notification' })
  }
} 