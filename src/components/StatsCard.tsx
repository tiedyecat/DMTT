import React from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

interface StatsCardProps {
  title: string
  value: string
  trend: number
  trendLabel: string
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, trend, trendLabel }) => {
  const isPositive = trend >= 0

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="flex items-center">
          {isPositive ? (
            <ArrowUpIcon className="h-5 w-5 text-green-500" />
          ) : (
            <ArrowDownIcon className="h-5 w-5 text-red-500" />
          )}
          <span className={`text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {Math.abs(trend)}%
          </span>
          <span className="ml-2 text-sm text-gray-500">{trendLabel}</span>
        </div>
      </div>
    </div>
  )
}

export default StatsCard 