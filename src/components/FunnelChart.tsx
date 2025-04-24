import React from 'react'
import {
  FunnelChart,
  Funnel,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts'

interface FunnelData {
  name: string
  value: number
  fill: string
  conversionRate?: number
  costPerAction?: number
  roi?: number
}

const data: FunnelData[] = [
  { 
    name: 'Impressions', 
    value: 10000, 
    fill: '#3B82F6',
    conversionRate: 50,
    costPerAction: 0.01,
    roi: 120
  },
  { 
    name: 'Clicks', 
    value: 5000, 
    fill: '#60A5FA',
    conversionRate: 40,
    costPerAction: 0.02,
    roi: 110
  },
  { 
    name: 'Leads', 
    value: 2000, 
    fill: '#93C5FD',
    conversionRate: 25,
    costPerAction: 0.05,
    roi: 95
  },
  { 
    name: 'Purchases', 
    value: 500, 
    fill: '#BFDBFE',
    conversionRate: 5,
    costPerAction: 0.20,
    roi: 80
  }
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
        <p className="font-medium text-gray-900 text-lg mb-2">{data.name}</p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Value:</span>
            <span className="font-medium">{data.value.toLocaleString()}</span>
          </div>
          {data.conversionRate && (
            <div className="flex justify-between">
              <span className="text-gray-600">Conversion Rate:</span>
              <span className="font-medium">{data.conversionRate}%</span>
            </div>
          )}
          {data.costPerAction && (
            <div className="flex justify-between">
              <span className="text-gray-600">Cost per Action:</span>
              <span className="font-medium">${data.costPerAction.toFixed(2)}</span>
            </div>
          )}
          {data.roi && (
            <div className="flex justify-between">
              <span className="text-gray-600">ROI:</span>
              <span className="font-medium">{data.roi}%</span>
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

const FunnelVisualization: React.FC = () => {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Conversion Funnel</h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
            Last 7 Days
          </button>
          <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
            Last 30 Days
          </button>
          <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
            Custom Range
          </button>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip content={<CustomTooltip />} />
            <Funnel
              data={data}
              dataKey="value"
              nameKey="name"
              isAnimationActive
            >
              <LabelList
                position="right"
                fill="#000"
                stroke="none"
                dataKey="name"
                formatter={(value: string) => `${value} (${data.find(d => d.name === value)?.conversionRate}%)`}
              />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-4">
        {data.map((stage, index) => (
          <div key={stage.name} className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900">{stage.name}</h4>
            <p className="text-2xl font-bold text-gray-900">{stage.value.toLocaleString()}</p>
            <p className="text-sm text-gray-500">
              {stage.conversionRate}% conversion
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FunnelVisualization 