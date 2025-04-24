import React, { useState } from 'react'
import { Menu } from '@headlessui/react'
import { CalendarIcon } from '@heroicons/react/24/outline'

interface DateRangePickerProps {
  onRangeChange: (range: string) => void
}

const ranges = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'This month', value: 'month' },
  { label: 'Last quarter', value: 'quarter' },
  { label: 'Year to date', value: 'ytd' },
]

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onRangeChange }) => {
  const [selectedRange, setSelectedRange] = useState(ranges[0])

  const handleRangeSelect = (range: typeof ranges[0]) => {
    setSelectedRange(range)
    onRangeChange(range.value)
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
        {selectedRange.label}
      </Menu.Button>

      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
        <div className="py-1">
          {ranges.map((range) => (
            <Menu.Item key={range.value}>
              {({ active }) => (
                <button
                  onClick={() => handleRangeSelect(range)}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } block px-4 py-2 text-sm w-full text-left`}
                >
                  {range.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  )
}

export default DateRangePicker 