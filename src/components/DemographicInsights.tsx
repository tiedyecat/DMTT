import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function DemographicInsights() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['demographics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_ads_demographics')
        .select('age, gender, impressions, clicks, spend')
        .order('date', { ascending: false })
        .limit(100)

      if (error) throw error
      return data
    }
  })

  if (isLoading) return <div>Loading demographics...</div>
  if (error) return <div>Error loading demographics</div>

  // Process data for chart
  const chartData = {
    labels: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
    datasets: [
      {
        label: 'Impressions',
        data: data?.reduce((acc, curr) => {
          const index = chartData.labels.indexOf(curr.age)
          if (index !== -1) {
            acc[index] = (acc[index] || 0) + curr.impressions
          }
          return acc
        }, [] as number[]) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
      {
        label: 'Clicks',
        data: data?.reduce((acc, curr) => {
          const index = chartData.labels.indexOf(curr.age)
          if (index !== -1) {
            acc[index] = (acc[index] || 0) + curr.clicks
          }
          return acc
        }, [] as number[]) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
      },
    ],
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Demographic Insights</h2>
      <div className="h-64">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          }}
        />
      </div>
    </div>
  )
} 