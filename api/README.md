# Meta Ads API Integration

This directory contains the code needed to integrate Meta/Facebook Ads API data fetching with the DMT Dashboard.

## Getting Real Data

### Step 1: Set Up Environment Variables

Create a `.env` file in the project root with the following variables:

```
# Meta API
META_API_ACCESS_TOKEN=your_meta_api_access_token

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 2: Configure Ad Accounts

The first time you run the fetch script, it will create a template `ad_accounts_by_team.json` file in the `api` directory. Edit this file with your actual Meta ad account IDs:

```json
{
  "Team Name": [
    ["Business Name 1", "account_id_1"],
    ["Business Name 2", "account_id_2"]
  ],
  "Another Team": [
    ["Business Name 3", "account_id_3"]
  ]
}
```

### Step 3: Run the Fetch Script

```bash
cd scripts
npm run fetch-meta-ads
```

This will:
1. Execute the Python script to fetch data from Meta/Facebook Ads API
2. Process the data (calculate metrics, etc.)
3. Insert the data into your Supabase `meta_ads_monitoring` table

### Step 4: View the Data

After the data is loaded, you can view it in the dashboard at:
```
/meta-ads
```

## Integration Options

### Option 1: Vercel Edge Functions with Python (Recommended)

1. **Create a Vercel Edge Function**:
   - Use the `meta-ads-fetch.py` script as a starting point
   - Deploy it as a Vercel Edge Function (Vercel supports Python runtime)
   - Set up environment variables for Meta API credentials in Vercel

2. **Schedule Regular Data Fetching**:
   - Use Vercel Cron Jobs to schedule regular execution (daily/hourly)
   - Data will be fetched and stored directly in Supabase

3. **Access Data via Next.js API Routes**:
   - The frontend will use `/api/meta-ads` to get data from Supabase
   - No need to call Meta API directly from the frontend

### Option 2: Supabase Edge Functions

1. **Convert the Python Script**:
   - Adapt `meta-ads-fetch.py` to work as a Supabase Edge Function
   - Deploy it directly to your Supabase project

2. **Schedule with Supabase**:
   - Use Supabase scheduled functions to run the data fetching

### Option 3: Standalone Service

1. **Run as Separate Service**:
   - Keep the original Python script as-is
   - Run it on a server with a scheduler (cron)
   - It will push data to the same Supabase database

## Current Implementation

We've started with:

1. A TypeScript API endpoint (`/api/meta-ads`) that reads from Supabase
2. A React component (`MetaAdsOverview`) to display the data
3. A Python script (`meta-ads-fetch.py`) to fetch data from Meta API and insert it into Supabase
4. A TypeScript script (`fetch-meta-ads.ts`) to execute the Python script from Node.js

## Required Environment Variables

```
# Meta API
ACCESS_TOKEN=your_meta_api_access_token

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Ad Account Mapping

The Python script expects an `ad_accounts_by_team.json` file with this structure:

```json
{
  "Team Name": [
    ["Business Name 1", "account_id_1"],
    ["Business Name 2", "account_id_2"]
  ],
  "Another Team": [
    ["Business Name 3", "account_id_3"]
  ]
}
```

## Next Steps

1. Create the Supabase `meta_ads_monitoring` table if it doesn't exist
2. Set up the Edge Function deployment
3. Configure the scheduling for regular data updates
4. Add more detailed views and filters to the dashboard 