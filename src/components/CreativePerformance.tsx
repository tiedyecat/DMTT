import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/formatters'

export default function CreativePerformance() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['creative-performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_ads_monitoring')
        .select('ad_name, headline, ctr, spend, leads, purchases')
        .order('date', { ascending: false })
        .limit(5)

      if (error) throw error
      return data
    }
  })

  if (isLoading) return <div>Loading creative performance...</div>
  if (error) return <div>Error loading creative performance</div>

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Creatives</h2>
      <div className="space-y-4">
        {data?.map((creative) => (
          <div key={creative.ad_name} className="border-b border-gray-200 pb-4 last:border-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-900">{creative.ad_name}</p>
                <p className="text-sm text-gray-500">{creative.headline}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  CTR: {(creative.ctr * 100).toFixed(2)}%
                </p>
                <p className="text-sm text-gray-500">
                  Spend: {formatCurrency(creative.spend)}
                </p>
              </div>
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <span>Leads: {creative.leads}</span>
              <span>Purchases: {creative.purchases}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 