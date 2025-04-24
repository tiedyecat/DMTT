import React from 'react'
import { useErrorAnalytics } from '../hooks/useErrorAnalytics'
import { AppError } from '../lib/errorHandling'

export function ErrorDashboard() {
  const { errorCount, errorTypes, lastError, clearErrors } = useErrorAnalytics()

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Error Monitoring</h2>
        <button
          onClick={clearErrors}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Clear Errors
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Errors</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{errorCount}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Error Types</h3>
          <div className="mt-2">
            {Object.entries(errorTypes).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">{type}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {lastError && (
        <div className="mt-4 bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Last Error</h3>
          <div className="mt-2">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Code</span>
              <span className="text-sm font-medium text-gray-900">{lastError.code || 'UNKNOWN'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Status</span>
              <span className="text-sm font-medium text-gray-900">{lastError.statusCode}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Message</span>
              <span className="text-sm font-medium text-gray-900">{lastError.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 