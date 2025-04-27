export interface MetaAdsMonitoring {
  id: string;
  ad_id: string;
  account_id: string;
  business_name: string;
  ad_name: string;
  campaign_id: string;
  campaign_name: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  daily_budget: number;
  cpc: number;
  cpm: number;
  frequency: number;
  conversions: number;
  leads: number;
  purchases: number;
  cpa: number;
  date: string;
  flagged: boolean;
  flagged_reason: string | null;
} 