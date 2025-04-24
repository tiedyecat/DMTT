import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function AlertsOverview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_ads_with_flags')
        .select('ad_name, flagged_reason, date')
        .eq('flagged', true)
        .order('date', { ascending: false })
        .limit(5)

      if (error) throw error
      return data
    }
  })

  if (isLoading) return <div>Loading alerts...</div>
  if (error) return <div>Error loading alerts</div>

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
      <div className="space-y-4">
        {data?.map((alert) => (
          <div key={alert.ad_name} className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">{alert.ad_name}</p>
              <p className="text-sm text-gray-500">{alert.flagged_reason}</p>
              <p className="text-xs text-gray-400">{new Date(alert.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
        {data?.length === 0 && (
          <p className="text-sm text-gray-500">No recent alerts</p>
        )}
      </div>
    </div>
  )
} 