import MetaAdsOverview from '@/components/dashboard/MetaAdsOverview';
import Link from 'next/link';

export default function MetaAdsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Meta Ads Performance Dashboard</h1>
      
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Getting Real Data</h3>
        <p className="mb-2">To fetch real Meta Ads data, follow these steps:</p>
        <ol className="list-decimal pl-5 mb-3">
          <li className="mb-1">Set up the environment variables in <code className="bg-gray-100 px-1 rounded">.env</code> file</li>
          <li className="mb-1">Configure <code className="bg-gray-100 px-1 rounded">api/ad_accounts_by_team.json</code> with your Meta ad accounts</li>
          <li className="mb-1">Run <code className="bg-gray-100 px-1 rounded">cd scripts && npm run fetch-meta-ads</code></li>
        </ol>
        <p>
          <Link href="/api/README.md" className="text-blue-600 hover:underline">
            See the full documentation for details
          </Link>
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">All Businesses</h2>
        <MetaAdsOverview days={30} />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Fitness Fanatics</h2>
        <MetaAdsOverview businessName="Fitness Fanatics" days={30} />
      </div>
    </div>
  );
} 