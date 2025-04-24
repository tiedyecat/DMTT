import { Suspense } from 'react'
import DashboardHeader from '@/components/DashboardHeader'
import PerformanceMetrics from '@/components/PerformanceMetrics'
import AlertsOverview from '@/components/AlertsOverview'
import DemographicInsights from '@/components/DemographicInsights'
import CreativePerformance from '@/components/CreativePerformance'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <DashboardHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Suspense fallback={<div>Loading...</div>}>
            <PerformanceMetrics />
            <AlertsOverview />
            <DemographicInsights />
            <CreativePerformance />
          </Suspense>
        </div>
      </div>
    </main>
  )
} 