import { Pool } from 'pg'
import dotenv from 'dotenv'
import { handleDatabaseError, AppError } from './errorHandling'

// Load environment variables
dotenv.config()

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingEnvVars.length > 0) {
  throw new AppError(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`,
    500,
    'MISSING_ENV_VARS'
  )
}

// Initialize the database connection pool
const pool = new Pool({
  connectionString: process.env.SUPABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

// Test database connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

interface AdAccountMetric {
  client: string
  teamMember: string
  spend: number
  leads: number
  costPerLead: number
  purchases: number
  costPerPurchase: number
  cpa: number
  trend: number
}

// Map of account IDs to team members
const teamMemberMap = {
  'view_derek_j': 'Derek J',
  'view_cassi_d': 'Cassi D',
  'view_heaven_p': 'Heaven P',
  'view_morgan_r': 'Morgan R'
}

export async function getAdAccountMetrics(timeRange: '7d' | '14d' | '30d' | '60d' | '90d'): Promise<AdAccountMetric[]> {
  const viewName = `last_${timeRange}_totals`
  
  try {
    // Validate timeRange
    if (!['7d', '14d', '30d', '60d', '90d'].includes(timeRange)) {
      throw new AppError('Invalid time range', 400, 'INVALID_TIME_RANGE')
    }

    // First get the metrics from the time range view
    const metricsResult = await pool.query(`
      SELECT 
        business_name as client,
        spend,
        leads,
        CASE 
          WHEN leads > 0 THEN spend / leads 
          ELSE 0 
        END as cost_per_lead,
        purchases,
        CASE 
          WHEN purchases > 0 THEN spend / purchases 
          ELSE 0 
        END as cost_per_purchase,
        avg_cpa as cpa,
        0 as trend -- You'll need to calculate this based on previous period
      FROM ${viewName}
    `)

    if (!metricsResult.rows.length) {
      throw new AppError('No data found for the specified time range', 404, 'NO_DATA_FOUND')
    }

    // Then get the team member information
    const teamResults = await Promise.all(
      Object.keys(teamMemberMap).map(view => 
        pool.query(`
          SELECT DISTINCT business_name, account_id
          FROM ${view}
        `)
      )
    )

    // Create a map of business names to team members
    const businessToTeamMap = new Map()
    teamResults.forEach((result, index) => {
      const teamMember = Object.values(teamMemberMap)[index]
      result.rows.forEach(row => {
        businessToTeamMap.set(row.business_name, teamMember)
      })
    })

    // Combine the metrics with team member information
    return metricsResult.rows.map(row => ({
      client: row.client,
      teamMember: businessToTeamMap.get(row.client) || 'Unassigned',
      spend: parseFloat(row.spend),
      leads: parseInt(row.leads),
      costPerLead: parseFloat(row.cost_per_lead),
      purchases: parseInt(row.purchases),
      costPerPurchase: parseFloat(row.cost_per_purchase),
      cpa: parseFloat(row.cpa),
      trend: parseFloat(row.trend)
    }))
  } catch (error) {
    throw handleDatabaseError(error)
  }
}

// Helper function to calculate trend percentage
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
} 