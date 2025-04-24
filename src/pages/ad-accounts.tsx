import React, { useEffect, useState } from 'react'
import AdAccountMetrics from '../components/AdAccountMetrics'
import { getAdAccountMetrics } from '../lib/adAccountData'
import { AppError } from '../lib/errorHandling'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { withRetry, isRetryableError } from '../lib/retry'
import { logError } from '../lib/errorLogging'

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

type TimeRange = '7d' | '14d' | '30d' | '60d' | '90d'

const teamMembers = ['All', 'Derek J', 'Cassi D', 'Heaven P', 'Morgan R', 'Unassigned']

export default function AdAccountsPage() {
  const [metrics, setMetrics] = useState<AdAccountMetric[]>([])
  const [filteredMetrics, setFilteredMetrics] = useState<AdAccountMetric[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [selectedTeamMember, setSelectedTeamMember] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)
        setError(null)
        
        const data = await withRetry(
          () => getAdAccountMetrics(timeRange),
          {
            maxAttempts: 3,
            delayMs: 1000,
            backoffFactor: 2
          }
        )
        
        setMetrics(data)
        setRetryCount(0)
      } catch (err) {
        if (err instanceof AppError) {
          setError(err)
          logError(err, { timeRange, retryCount })
        } else {
          const appError = new AppError('Failed to load ad account metrics')
          setError(appError)
          logError(appError, { timeRange, retryCount, originalError: err })
        }
        
        if (isRetryableError(err)) {
          setRetryCount(prev => prev + 1)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [timeRange, retryCount])

  useEffect(() => {
    if (selectedTeamMember === 'All') {
      setFilteredMetrics(metrics)
    } else {
      setFilteredMetrics(metrics.filter(metric => metric.teamMember === selectedTeamMember))
    }
  }, [metrics, selectedTeamMember])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error {error.statusCode}: {error.code}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error.message}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={handleRetry}
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="p-4">
        <div className="mb-4 flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="7d">Last 7 Days</option>
            <option value="14d">Last 14 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="60d">Last 60 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <select
            value={selectedTeamMember}
            onChange={(e) => setSelectedTeamMember(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            {teamMembers.map(member => (
              <option key={member} value={member}>{member}</option>
            ))}
          </select>
        </div>
        <AdAccountMetrics data={filteredMetrics} />
      </div>
    </ErrorBoundary>
  )
} 