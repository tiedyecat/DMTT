-- Create meta_ads_monitoring table
CREATE TABLE IF NOT EXISTS public.meta_ads_monitoring (
    id uuid PRIMARY KEY,
    ad_id text NOT NULL,
    account_id text NOT NULL,
    business_name text NOT NULL,
    ad_name text,
    campaign_id text,
    campaign_name text,
    impressions integer NOT NULL DEFAULT 0,
    clicks integer NOT NULL DEFAULT 0,
    ctr numeric NOT NULL DEFAULT 0,
    spend numeric NOT NULL DEFAULT 0,
    daily_budget numeric,
    cpc numeric,
    cpm numeric,
    frequency numeric,
    conversions integer NOT NULL DEFAULT 0,
    leads integer NOT NULL DEFAULT 0,
    purchases integer NOT NULL DEFAULT 0,
    cpa numeric,
    date date NOT NULL,
    flagged boolean NOT NULL DEFAULT false,
    flagged_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS meta_ads_monitoring_business_name_idx ON public.meta_ads_monitoring (business_name);
CREATE INDEX IF NOT EXISTS meta_ads_monitoring_date_idx ON public.meta_ads_monitoring (date);
CREATE INDEX IF NOT EXISTS meta_ads_monitoring_ad_id_idx ON public.meta_ads_monitoring (ad_id);
CREATE INDEX IF NOT EXISTS meta_ads_monitoring_campaign_id_idx ON public.meta_ads_monitoring (campaign_id);

-- Set up RLS (Row Level Security)
ALTER TABLE public.meta_ads_monitoring ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON public.meta_ads_monitoring
    FOR SELECT USING (true);

-- Only allow service role to insert/update
CREATE POLICY "Allow service role to insert/update" ON public.meta_ads_monitoring
    FOR ALL USING (auth.role() = 'service_role');

-- Add an updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meta_ads_monitoring_modtime
    BEFORE UPDATE ON public.meta_ads_monitoring
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column(); 