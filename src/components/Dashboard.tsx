import React, { useState } from 'react'
import DashboardHeader from './DashboardHeader'
import StatsCard from './StatsCard'
import AnalyticsChart from './AnalyticsChart'
import ActivityFeed from './ActivityFeed'
import DateRangePicker from './DateRangePicker'
import FunnelVisualization from './FunnelChart'
import AdAccountMetrics from './AdAccountMetrics'

// Sample data - replace with your actual JSON data
const adAccountData = [
  {
    client: 'Client A',
    teamMember: 'John Doe',
    spend: 5000,
    leads: 250,
    costPerLead: 20,
    purchases: 50,
    costPerPurchase: 100,
    cpa: 100,
    trend: 5.2
  },
  {
    client: 'Client B',
    teamMember: 'Jane Smith',
    spend: 7500,
    leads: 300,
    costPerLead: 25,
    purchases: 75,
    costPerPurchase: 100,
    cpa: 100,
    trend: -2.1
  }
  // Add more clients as needed
]

const Dashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('7d')
  
  const stats = [
    {
      title: 'Total Revenue',
      value: '$45,231',
      trend: 12,
      trendLabel: 'vs last month'
    },
    {
      title: 'Active Users',
      value: '2,345',
      trend: 8.1,
      trendLabel: 'vs last week'
    },
    {
      title: 'Conversion Rate',
      value: '3.6%',
      trend: -2.3,
      trendLabel: 'vs last week'
    },
    {
      title: 'Avg. Order Value',
      value: '$89.00',
      trend: 4.5,
      trendLabel: 'vs last month'
    }
  ]

  const handleRangeChange = (range: string) => {
    setDateRange(range)
    // Here you would typically fetch new data based on the selected range
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
          <DateRangePicker onRangeChange={handleRangeChange} />
        </div>

        {/* Ad Account Metrics */}
        <div className="mb-8">
          <AdAccountMetrics data={adAccountData} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              trend={stat.trend}
              trendLabel={stat.trendLabel}
            />
          ))}
        </div>

        {/* Analytics and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <AnalyticsChart />
          </div>
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <FunnelVisualization />
          </div>
          <div>
            {/* Add another visualization or component here if needed */}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard 