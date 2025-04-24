import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/formatters'

export default function PerformanceMetrics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_ads_monitoring')
        .select('spend, leads, purchases, impressions, clicks')
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      return data
    }
  })

  if (isLoading) return <div>Loading metrics...</div>
  if (error) return <div>Error loading metrics</div>

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Spend</p>
          <p className="text-2xl font-bold">{formatCurrency(data?.spend || 0)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Leads</p>
          <p className="text-2xl font-bold">{data?.leads || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Purchases</p>
          <p className="text-2xl font-bold">{data?.purchases || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">CTR</p>
          <p className="text-2xl font-bold">
            {data?.clicks && data?.impressions 
              ? `${((data.clicks / data.impressions) * 100).toFixed(2)}%`
              : '0%'}
          </p>
        </div>
      </div>
    </div>
  )
} 