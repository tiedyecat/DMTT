import React, { useState } from 'react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Tab } from '@headlessui/react'

const data = [
  { name: 'Jan', revenue: 4000, users: 2400, orders: 400 },
  { name: 'Feb', revenue: 3000, users: 1398, orders: 210 },
  { name: 'Mar', revenue: 5000, users: 3800, orders: 480 },
  { name: 'Apr', revenue: 2780, users: 3908, orders: 390 },
  { name: 'May', revenue: 1890, users: 4800, orders: 480 },
  { name: 'Jun', revenue: 2390, users: 3800, orders: 380 },
  { name: 'Jul', revenue: 3490, users: 4300, orders: 430 }
]

const metrics = [
  { key: 'revenue', name: 'Revenue', color: '#3B82F6' },
  { key: 'users', name: 'Users', color: '#10B981' },
  { key: 'orders', name: 'Orders', color: '#6366F1' }
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry: any) => (
          <p
            key={entry.name}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const AnalyticsChart: React.FC = () => {
  const [activeMetrics, setActiveMetrics] = useState(
    new Set(metrics.map(m => m.key))
  )

  const toggleMetric = (metric: string) => {
    const newActiveMetrics = new Set(activeMetrics)
    if (newActiveMetrics.has(metric)) {
      newActiveMetrics.delete(metric)
    } else {
      newActiveMetrics.add(metric)
    }
    setActiveMetrics(newActiveMetrics)
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Analytics Overview</h3>
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-lg bg-gray-100 p-1">
            {['Area', 'Line', 'Bar'].map((chart) => (
              <Tab
                key={chart}
                className={({ selected }) =>
                  `px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none ${
                    selected
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-500 hover:text-gray-900'
                  }`
                }
              >
                {chart}
              </Tab>
            ))}
          </Tab.List>
        </Tab.Group>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {metrics.map((metric) => (
            <button
              key={metric.key}
              onClick={() => toggleMetric(metric.key)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                activeMetrics.has(metric.key)
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-gray-50 text-gray-500'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: metric.color }}
              />
              {metric.name}
            </button>
          ))}
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <Tab.Panels>
              <Tab.Panel>
                <AreaChart
                  data={data}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  {metrics.map(
                    (metric) =>
                      activeMetrics.has(metric.key) && (
                        <Area
                          key={metric.key}
                          type="monotone"
                          dataKey={metric.key}
                          name={metric.name}
                          stroke={metric.color}
                          fill={metric.color}
                          fillOpacity={0.3}
                        />
                      )
                  )}
                </AreaChart>
              </Tab.Panel>

              <Tab.Panel>
                <LineChart
                  data={data}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  {metrics.map(
                    (metric) =>
                      activeMetrics.has(metric.key) && (
                        <Line
                          key={metric.key}
                          type="monotone"
                          dataKey={metric.key}
                          name={metric.name}
                          stroke={metric.color}
                          strokeWidth={2}
                        />
                      )
                  )}
                </LineChart>
              </Tab.Panel>

              <Tab.Panel>
                <BarChart
                  data={data}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  {metrics.map(
                    (metric) =>
                      activeMetrics.has(metric.key) && (
                        <Bar
                          key={metric.key}
                          dataKey={metric.key}
                          name={metric.name}
                          fill={metric.color}
                          fillOpacity={0.8}
                        />
                      )
                  )}
                </BarChart>
              </Tab.Panel>
            </Tab.Panels>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsChart 