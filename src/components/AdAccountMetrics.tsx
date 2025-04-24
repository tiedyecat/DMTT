import React, { useState } from 'react'
import { ArrowUpIcon, ArrowDownIcon, FunnelIcon } from '@heroicons/react/24/solid'
import { Menu } from '@headlessui/react'

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

interface AdAccountMetricsProps {
  data: AdAccountMetric[]
}

const AdAccountMetrics: React.FC<AdAccountMetricsProps> = ({ data }) => {
  const [filters, setFilters] = useState({
    teamMember: '',
    client: '',
    minSpend: '',
    maxSpend: ''
  })

  const teamMembers = Array.from(new Set(data.map(item => item.teamMember)))
  const clients = Array.from(new Set(data.map(item => item.client)))

  const filteredData = data.filter(item => {
    if (filters.teamMember && item.teamMember !== filters.teamMember) return false
    if (filters.client && item.client !== filters.client) return false
    if (filters.minSpend && item.spend < Number(filters.minSpend)) return false
    if (filters.maxSpend && item.spend > Number(filters.maxSpend)) return false
    return true
  })

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Ad Account Performance</h3>
          <div className="flex space-x-4">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
                Filters
              </Menu.Button>
              <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1 px-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Team Member</label>
                    <select
                      value={filters.teamMember}
                      onChange={(e) => handleFilterChange('teamMember', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="">All</option>
                      {teamMembers.map(member => (
                        <option key={member} value={member}>{member}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Client</label>
                    <select
                      value={filters.client}
                      onChange={(e) => handleFilterChange('client', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="">All</option>
                      {clients.map(client => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Min Spend</label>
                    <input
                      type="number"
                      value={filters.minSpend}
                      onChange={(e) => handleFilterChange('minSpend', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      placeholder="Min spend"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Spend</label>
                    <input
                      type="number"
                      value={filters.maxSpend}
                      onChange={(e) => handleFilterChange('maxSpend', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      placeholder="Max spend"
                    />
                  </div>
                </div>
              </Menu.Items>
            </Menu>
            <button
              onClick={() => {
                // Implement export functionality here
                const csvContent = "data:text/csv;charset=utf-8," 
                  + "Client,Team Member,Spend,Leads,CPL,Purchases,CPP,CPA,Trend\n"
                  + filteredData.map(row => 
                    `${row.client},${row.teamMember},${row.spend},${row.leads},${row.costPerLead},${row.purchases},${row.costPerPurchase},${row.cpa},${row.trend}`
                  ).join("\n")
                const encodedUri = encodeURI(csvContent)
                const link = document.createElement("a")
                link.setAttribute("href", encodedUri)
                link.setAttribute("download", "ad_account_metrics.csv")
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchases
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((metric) => (
                <tr key={metric.client} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.teamMember}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${metric.spend.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.leads.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${metric.costPerLead.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.purchases.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${metric.costPerPurchase.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${metric.cpa.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      {metric.trend >= 0 ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`ml-1 ${
                          metric.trend >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {Math.abs(metric.trend)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdAccountMetrics 