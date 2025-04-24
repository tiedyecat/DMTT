import React from 'react'
import { UserCircleIcon, DocumentTextIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid'

interface Activity {
  id: number
  type: 'user' | 'document' | 'payment'
  title: string
  time: string
  description: string
}

const getIcon = (type: Activity['type']) => {
  switch (type) {
    case 'user':
      return <UserCircleIcon className="h-8 w-8 text-blue-500" />
    case 'document':
      return <DocumentTextIcon className="h-8 w-8 text-purple-500" />
    case 'payment':
      return <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
  }
}

const ActivityFeed: React.FC = () => {
  const activities: Activity[] = [
    {
      id: 1,
      type: 'user',
      title: 'New user registered',
      time: '5 minutes ago',
      description: 'John Doe created a new account'
    },
    {
      id: 2,
      type: 'document',
      title: 'Document updated',
      time: '2 hours ago',
      description: 'Sales report for Q2 2024 was updated'
    },
    {
      id: 3,
      type: 'payment',
      title: 'Payment received',
      time: '1 day ago',
      description: 'Received $1,999.00 from Client XYZ'
    }
  ]

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <li key={activity.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.description}
                  </p>
                </div>
                <div className="flex-shrink-0 text-sm text-gray-500">
                  {activity.time}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ActivityFeed 