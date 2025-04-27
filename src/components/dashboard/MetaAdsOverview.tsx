'use client';

import { useState, useEffect } from 'react';
import { MetaAdsMonitoring } from '@/types/database';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface MetaAdsOverviewProps {
  businessName?: string;
  days?: number;
}

export default function MetaAdsOverview({ businessName, days = 30 }: MetaAdsOverviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MetaAdsMonitoring[]>([]);
  const [timeRange, setTimeRange] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (businessName) params.append('business', businessName);
        if (days) params.append('days', days.toString());
        
        const response = await fetch(`/api/meta-ads?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching Meta ads data: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result.data);
        setTimeRange(result.timeRange);
      } catch (err) {
        console.error('Failed to fetch Meta ads data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [businessName, days]);

  // Calculate totals
  const totals = data.reduce((acc, item) => {
    acc.spend += item.spend;
    acc.clicks += item.clicks;
    acc.impressions += item.impressions;
    acc.leads += item.leads;
    acc.purchases += item.purchases;
    acc.conversions += item.conversions;
    return acc;
  }, {
    spend: 0,
    clicks: 0,
    impressions: 0,
    leads: 0,
    purchases: 0,
    conversions: 0
  });

  // Calculate derived metrics
  const metrics = {
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
    cpl: totals.leads > 0 ? totals.spend / totals.leads : 0,
    cpp: totals.purchases > 0 ? totals.spend / totals.purchases : 0
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-red-500">
          <h3 className="font-medium">Error loading Meta ads data</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Meta Ads Performance</h2>
          {timeRange && (
            <p className="text-sm text-gray-500">
              {formatDate(timeRange.start)} - {formatDate(timeRange.end)}
            </p>
          )}
        </div>
        {businessName && (
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {businessName}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">Spend</p>
          <p className="text-lg font-bold">{formatCurrency(totals.spend)}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">Impressions</p>
          <p className="text-lg font-bold">{totals.impressions.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">Clicks</p>
          <p className="text-lg font-bold">{totals.clicks.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">CTR</p>
          <p className="text-lg font-bold">{metrics.ctr.toFixed(2)}%</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">CPC</p>
          <p className="text-lg font-bold">{formatCurrency(metrics.cpc)}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">Leads</p>
          <p className="text-lg font-bold">{totals.leads.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">Purchases</p>
          <p className="text-lg font-bold">{totals.purchases.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">CPA</p>
          <p className="text-lg font-bold">{formatCurrency(metrics.cpa)}</p>
        </div>
      </div>

      <h3 className="font-medium text-gray-700 mb-2">Recent Ads Performance</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spend</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impressions</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPA</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.slice(0, 10).map((ad) => (
              <tr key={ad.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(ad.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ad.ad_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(ad.spend)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ad.impressions.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ad.clicks.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ad.ctr.toFixed(2)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ad.conversions.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(ad.cpa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 