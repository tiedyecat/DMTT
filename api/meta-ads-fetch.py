import os
import json
import hashlib
import uuid
import logging
import traceback
import time
from datetime import datetime, timedelta
import requests
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('meta-ads-fetch')

# Optional: Enable debug mode from environment variable
DEBUG_MODE = os.environ.get('DEBUG', 'false').lower() in ('true', '1', 't')
if DEBUG_MODE:
    logger.setLevel(logging.DEBUG)
    logger.debug("DEBUG mode enabled")

# Function for deterministic UUID generation
def generate_deterministic_uuid(ad_id, date_str):
    """Generate a stable UUID from ad_id and date combination"""
    base = f"{ad_id}-{date_str}"
    return str(uuid.UUID(hashlib.md5(base.encode()).hexdigest()))

# Generate a request ID for tracing API calls
REQUEST_ID = str(uuid.uuid4())
logger.info(f"Starting script execution with request ID: {REQUEST_ID}")

# ========== CONFIGURATION ==========
ACCESS_TOKEN = os.environ.get("ACCESS_TOKEN")
BASE_URL = "https://graph.facebook.com/v22.0"
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Log configuration (redacted)
if ACCESS_TOKEN:
    redacted_token = ACCESS_TOKEN[:4] + "..." + ACCESS_TOKEN[-4:] if len(ACCESS_TOKEN) > 8 else "********"
    logger.debug(f"Using ACCESS_TOKEN: {redacted_token}")
if SUPABASE_URL:
    logger.debug(f"Using SUPABASE_URL: {SUPABASE_URL}")
if SUPABASE_KEY:
    redacted_key = SUPABASE_KEY[:4] + "..." + SUPABASE_KEY[-4:] if len(SUPABASE_KEY) > 8 else "********"
    logger.debug(f"Using SUPABASE_KEY: {redacted_key}")

# Check required environment variables
missing_vars = []
if not ACCESS_TOKEN:
    missing_vars.append("ACCESS_TOKEN")
if not SUPABASE_URL:
    missing_vars.append("SUPABASE_URL")
if not SUPABASE_KEY:
    missing_vars.append("SUPABASE_KEY")

if missing_vars:
    for var in missing_vars:
        logger.error(f"❌ ERROR: Missing {var} environment variable")
    logger.error("Required environment variables are missing. Please set them and try again.")
    sys.exit(1)

# ========== SUPABASE VALIDATION FUNCTIONS ==========
def validate_supabase_connection():
    """Validate Supabase connection and permissions"""
    logger.info("Validating Supabase connection...")
    
    # Prepare headers
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    try:
        # Test connection with a simple query
        url = f"{SUPABASE_URL}/rest/v1/"
        
        response = requests.get(
            url,
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            logger.error(f"❌ Failed to connect to Supabase: HTTP {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
            
        logger.info("✅ Successfully connected to Supabase")
        return True
        
    except Exception as e:
        logger.error(f"❌ Exception while validating Supabase connection: {e}")
        logger.error(traceback.format_exc())
        return False

def check_table_exists(table_name):
    """Check if a table exists in Supabase"""
    logger.info(f"Checking if table '{table_name}' exists...")
    
    # Prepare headers
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    try:
        # Make a HEAD request to check table existence
        url = f"{SUPABASE_URL}/rest/v1/{table_name}"
        response = requests.head(
            url,
            headers=headers,
            timeout=10
        )
        
        # 200 means table exists, 404 means it doesn't
        if response.status_code == 200:
            logger.info(f"✅ Table '{table_name}' exists")
            return True
        elif response.status_code == 404:
            logger.error(f"❌ Table '{table_name}' does not exist")
            return False
        else:
            logger.error(f"❌ Error checking table existence: HTTP {response.status_code}")
            logger.error(f"Response: {response.text if hasattr(response, 'text') else 'No response text'}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Exception while checking table existence: {e}")
        logger.error(traceback.format_exc())
        return False

def get_table_schema(table_name):
    """Get the schema of a table to validate before inserting"""
    logger.info(f"Retrieving schema for table '{table_name}'...")
    
    # Prepare headers
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept": "application/json"
    }
    
    try:
        # Query the table with limit=0 to get column info from response
        url = f"{SUPABASE_URL}/rest/v1/{table_name}?limit=0"
        response = requests.get(
            url,
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            logger.error(f"❌ Failed to retrieve schema: HTTP {response.status_code}")
            logger.error(f"Response: {response.text}")
            return None
            
        # For Supabase, we can get column info from response headers
        range_header = response.headers.get('Content-Range', '')
        if range_header:
            logger.info(f"Table has records. Content-Range: {range_header}")
            
        # Make a second request to get the column definitions using OPTIONS
        options_response = requests.options(
            url,
            headers=headers,
            timeout=10
        )
        
        if options_response.status_code == 204:
            # Extract column information from Access-Control-Expose-Headers
            logger.info("✅ Schema information retrieved successfully")
            
            # Get column definitions from the response body if available
            definitions = None
            try:
                if options_response.text:
                    definitions = json.loads(options_response.text)
            except:
                pass
                
            # Get the column names from the Prefer header
            columns_header = options_response.headers.get('Access-Control-Expose-Headers', '')
            columns = [c.strip() for c in columns_header.split(',') if c.strip()]
            
            return {
                "columns": columns,
                "definitions": definitions
            }
        else:
            logger.warning(f"⚠️ Could not retrieve detailed schema information: HTTP {options_response.status_code}")
            return {"columns": []}
            
    except Exception as e:
        logger.error(f"❌ Exception while retrieving schema: {e}")
        logger.error(traceback.format_exc())
        return None

def validate_record_against_schema(record, schema):
    """Validate a record against the table schema"""
    if not schema or not schema.get("columns"):
        logger.warning("⚠️ No schema available for validation, skipping")
        return True
        
    # Check for required columns
    missing_columns = []
    for column in ["id", "ad_id", "business_name", "date"]:
        if column not in record:
            missing_columns.append(column)
            
    if missing_columns:
        logger.error(f"❌ Record missing required columns: {', '.join(missing_columns)}")
        return False
        
    return True

# ========== LOAD AD ACCOUNT MAPPING ==========
AD_ACCOUNT_JSON_PATH = os.environ.get("AD_ACCOUNT_JSON_PATH", "ad_accounts_by_team.json")
logger.info(f"Loading ad accounts from: {AD_ACCOUNT_JSON_PATH}")

try:
    with open(AD_ACCOUNT_JSON_PATH) as f:
        AD_ACCOUNT_MAP = json.load(f)
        
    # Extract tuples of (business_name, account_id)
    AD_ACCOUNTS = [
        (business_name, account_id)
        for team_accounts in AD_ACCOUNT_MAP.values()
        for business_name, account_id in team_accounts
    ]
    
    logger.info(f"Loaded {len(AD_ACCOUNTS)} ad accounts from {len(AD_ACCOUNT_MAP)} teams")
    
except FileNotFoundError:
    logger.error(f"❌ ERROR: Ad accounts file not found at {AD_ACCOUNT_JSON_PATH}")
    logger.error(f"Current working directory: {os.getcwd()}")
    logger.error(f"Directory contents: {os.listdir('.')}")
    sys.exit(1)
except json.JSONDecodeError as e:
    logger.error(f"❌ ERROR: Invalid JSON in ad accounts file at {AD_ACCOUNT_JSON_PATH}")
    logger.error(f"JSON Error: {str(e)}")
    sys.exit(1)
except Exception as e:
    logger.error(f"❌ ERROR: Failed to load ad accounts: {e}")
    logger.error(traceback.format_exc())
    sys.exit(1)

# ========== API REQUEST HELPERS ==========
def make_api_request(url, params, method="GET", max_retries=3, retry_delay=2):
    """Make API request with retry mechanism and detailed error handling"""
    headers = {
        "Accept": "application/json",
        "User-Agent": f"MetaAdsETL/{REQUEST_ID}"
    }
    
    retry_count = 0
    while retry_count <= max_retries:
        try:
            start_time = time.time()
            if method == "GET":
                response = requests.get(url, params=params, headers=headers, timeout=30)
            else:
                response = requests.post(url, json=params, headers=headers, timeout=30)
                
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Log request details at debug level
            if DEBUG_MODE:
                logger.debug(f"API Request: {method} {url}")
                logger.debug(f"Request Params: {json.dumps({k: v for k, v in params.items() if k != 'access_token'})}")
                logger.debug(f"Response Status: {response.status_code}, Duration: {duration_ms}ms")
                
            # Check for API errors
            if response.status_code >= 400:
                error_data = response.json() if response.content else {"message": "No error details available"}
                logger.error(f"API Error ({response.status_code}): {error_data.get('message', 'Unknown error')}")
                
                # Determine if we should retry
                if response.status_code in [429, 500, 502, 503, 504] and retry_count < max_retries:
                    retry_count += 1
                    sleep_time = retry_delay * (2 ** retry_count)  # Exponential backoff
                    logger.warning(f"Rate limited or server error. Retrying in {sleep_time}s (attempt {retry_count}/{max_retries})...")
                    time.sleep(sleep_time)
                    continue
                    
                # Not retryable or max retries exceeded
                return {"error": error_data.get("message", "API Error"), "code": response.status_code}
                
            # Success case - return parsed JSON
            return response.json()
            
        except requests.exceptions.Timeout:
            logger.error(f"Timeout error connecting to {url}")
            if retry_count < max_retries:
                retry_count += 1
                sleep_time = retry_delay * (2 ** retry_count)
                logger.warning(f"Retrying in {sleep_time}s (attempt {retry_count}/{max_retries})...")
                time.sleep(sleep_time)
            else:
                return {"error": "Request timed out after multiple retries", "code": "TIMEOUT"}
                
        except requests.exceptions.ConnectionError:
            logger.error(f"Connection error to {url}")
            if retry_count < max_retries:
                retry_count += 1
                sleep_time = retry_delay * (2 ** retry_count)
                logger.warning(f"Retrying in {sleep_time}s (attempt {retry_count}/{max_retries})...")
                time.sleep(sleep_time)
            else:
                return {"error": "Connection failed after multiple retries", "code": "CONNECTION_ERROR"}
                
        except Exception as e:
            logger.error(f"Unexpected error in API request: {str(e)}")
            logger.error(traceback.format_exc())
            return {"error": str(e), "code": "UNEXPECTED_ERROR"}
    
    # This should not be reached, but just in case
    return {"error": "Maximum retries exceeded", "code": "MAX_RETRIES"}

# ========== FETCH FUNCTIONS ==========
def fetch_ads(ad_account_id):
    url = f"{BASE_URL}/act_{ad_account_id}/ads"
    params = {
        "access_token": ACCESS_TOKEN,
        "fields": "id,name,adset_id,campaign_id",
        "limit": 100
    }
    
    logger.info(f"Fetching ads for account {ad_account_id}")
    response = make_api_request(url, params)
    
    if "error" in response:
        logger.error(f"❌ Meta API Error fetching ads: {response.get('error')}")
        return []
        
    ads = response.get("data", [])
    logger.info(f"Fetched {len(ads)} ads for account {ad_account_id}")
    
    # Handle pagination (in debug mode, limit to first page)
    if not DEBUG_MODE and "paging" in response and "next" in response["paging"]:
        logger.debug(f"Pagination detected, would fetch more ads")
        # TODO: Implement pagination for production
    
    return ads

def fetch_campaigns(ad_account_id):
    url = f"{BASE_URL}/act_{ad_account_id}/campaigns"
    params = {
        "access_token": ACCESS_TOKEN,
        "fields": "id,name,daily_budget",
        "limit": 100
    }
    
    logger.info(f"Fetching campaigns for account {ad_account_id}")
    response = make_api_request(url, params)
    
    if "error" in response:
        logger.error(f"❌ Meta API Error fetching campaigns: {response.get('error')}")
        return {}
    
    campaigns = response.get("data", [])
    logger.info(f"Fetched {len(campaigns)} campaigns for account {ad_account_id}")
    
    return {c["id"]: {
        "campaign_name": c["name"],
        "daily_budget": float(c.get("daily_budget", 0)) / 1_000_000
    } for c in campaigns}

def fetch_insights(ad_account_id, time_range):
    url = f"{BASE_URL}/act_{ad_account_id}/insights"
    params = {
        "access_token": ACCESS_TOKEN,
        "fields": "date_start,date_stop,ad_id,impressions,clicks,ctr,spend,frequency,actions",
        "level": "ad",
        "time_range[since]": time_range["since"],
        "time_range[until]": time_range["until"],
        "time_increment": 1,  # Daily breakdown enabled
        "limit": 50
    }
    
    logger.info(f"Fetching insights for account {ad_account_id} from {time_range['since']} to {time_range['until']}")
    response = make_api_request(url, params)
    
    if "error" in response:
        logger.error(f"❌ Meta API Error fetching insights: {response.get('error')}")
        return {"data": []}
    
    insights = response.get("data", [])
    logger.info(f"Fetched {len(insights)} insight records for account {ad_account_id}")
    
    return {"data": insights}

# ========== SUPABASE FUNCTIONS ==========
def insert_data_to_supabase(rows, schema=None):
    """Insert data into Supabase using REST API with schema validation"""
    if not rows:
        logger.info("No rows to insert")
        return 0, 0
    
    # Validate schema
    table_name = "meta_ads_monitoring"
    
    # Performance metrics
    start_time = time.time()
    
    # Prepare headers
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "resolution=merge-duplicates",
        "X-Request-ID": REQUEST_ID
    }
    
    # Supabase REST endpoint for the meta_ads_monitoring table
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    
    # Validate rows against schema if available
    valid_rows = []
    invalid_rows = []
    
    for row in rows:
        if schema and not validate_record_against_schema(row, schema):
            invalid_rows.append(row)
        else:
            valid_rows.append(row)
    
    if invalid_rows:
        logger.warning(f"⚠️ {len(invalid_rows)} records failed schema validation and will not be inserted")
        
    if not valid_rows:
        logger.warning("No valid rows to insert after schema validation")
        return 0, len(invalid_rows)
    
    # Batch insert in groups of 100
    batch_size = 100
    success_count = 0
    error_count = 0
    
    for i in range(0, len(valid_rows), batch_size):
        batch = valid_rows[i:i+batch_size]
        batch_num = i//batch_size + 1
        batch_start = time.time()
        
        try:
            # Log batch details
            logger.debug(f"Inserting batch {batch_num} with {len(batch)} rows")
            
            # Send request to Supabase
            response = requests.post(
                url,
                headers=headers,
                json=batch,
                timeout=30
            )
            
            batch_duration_ms = int((time.time() - batch_start) * 1000)
            
            if response.status_code in [200, 201]:
                success_count += len(batch)
                logger.info(f"✅ Successfully inserted batch {batch_num} ({len(batch)} rows) in {batch_duration_ms}ms")
            else:
                error_count += len(batch)
                error_text = response.text[:500] + "..." if len(response.text) > 500 else response.text
                logger.error(f"❌ Error inserting batch {batch_num}: {response.status_code}")
                logger.error(f"Response: {error_text}")
                
                # Detailed error analysis
                content_type = response.headers.get('Content-Type', '')
                if 'application/json' in content_type:
                    try:
                        error_json = response.json()
                        error_msg = error_json.get('message', 'Unknown error')
                        error_code = error_json.get('code', 'unknown')
                        error_details = error_json.get('details', 'No details')
                        logger.error(f"Error details - Code: {error_code}, Message: {error_msg}, Details: {error_details}")
                    except:
                        logger.error("Could not parse error JSON")
                
        except requests.exceptions.Timeout:
            error_count += len(batch)
            logger.error(f"❌ Timeout inserting batch {batch_num}")
        except requests.exceptions.ConnectionError:
            error_count += len(batch)
            logger.error(f"❌ Connection error inserting batch {batch_num}")
        except Exception as e:
            error_count += len(batch)
            logger.error(f"❌ Exception inserting batch {batch_num}: {e}")
            logger.error(traceback.format_exc())
    
    # Log final statistics
    total_duration = time.time() - start_time
    logger.info(f"Supabase insertion complete: {success_count} rows succeeded, {error_count} rows failed, took {total_duration:.2f}s")
    
    # Include the invalid rows in the error count
    return success_count, error_count + len(invalid_rows)

# ========== PROCESS + SAVE ==========
def process_data(ad_account_id, time_range, business_name):
    try:
        logger.info(f"Processing data for {business_name} (account ID: {ad_account_id})")
        start_time = time.time()
        
        # Track timings for each step
        timings = {}
        
        fetch_start = time.time()
        insights = fetch_insights(ad_account_id, time_range)
        timings['fetch_insights'] = time.time() - fetch_start
        
        ads_start = time.time()
        ads = fetch_ads(ad_account_id)
        timings['fetch_ads'] = time.time() - ads_start
        
        campaigns_start = time.time()
        campaigns = fetch_campaigns(ad_account_id)
        timings['fetch_campaigns'] = time.time() - campaigns_start
        
        # Log performance metrics
        logger.debug(f"API fetch timing (seconds): {json.dumps(timings)}")
        
    except Exception as api_error:
        logger.error(f"❌ API Fetch Error for {business_name}: {api_error}")
        logger.error(traceback.format_exc())
        return []

    processing_start = time.time()
    
    ad_map = {ad["id"]: ad for ad in ads}
    rows_to_insert = []
    
    insight_count = len(insights.get("data", []))
    logger.info(f"Processing {insight_count} insights for {business_name}")
    
    # Track error counts by type for debugging
    processing_errors = {
        "missing_ad_id": 0,
        "division_by_zero": 0,
        "type_error": 0,
        "other": 0
    }

    for insight in insights.get("data", []):
        try:
            ad_id = insight.get("ad_id")
            if not ad_id:
                processing_errors["missing_ad_id"] += 1
                continue
                
            date_str = insight.get("date_start")
            
            ad_data = ad_map.get(ad_id, {})
            ad_name = ad_data.get("name", "Unknown")
            campaign_id = ad_data.get("campaign_id")
            campaign_info = campaigns.get(campaign_id, {})
            campaign_name = campaign_info.get("campaign_name")
            daily_budget = campaign_info.get("daily_budget")

            # Convert string values to appropriate types, with robust error handling
            try:
                impressions = int(insight.get("impressions", 0))
            except (ValueError, TypeError):
                impressions = 0
                
            try:
                clicks = int(insight.get("clicks", 0))
            except (ValueError, TypeError):
                clicks = 0
                
            try:
                spend = float(insight.get("spend", 0))
            except (ValueError, TypeError):
                spend = 0.0
                
            try:
                frequency = float(insight.get("frequency", 0))
            except (ValueError, TypeError):
                frequency = 0.0
            
            # Calculate derived metrics with error prevention
            try:
                ctr = (clicks / impressions * 100) if impressions else 0
            except ZeroDivisionError:
                processing_errors["division_by_zero"] += 1
                ctr = 0
                
            try:
                cpc = (spend / clicks) if clicks else 0
            except ZeroDivisionError:
                cpc = 0
                
            try:
                cpm = (spend / impressions * 1000) if impressions else 0
            except ZeroDivisionError:
                cpm = 0

            # Process actions with validation
            actions = insight.get("actions", [])
            if not isinstance(actions, list):
                actions = []
                
            try:
                leads = sum(int(a.get("value", 0)) for a in actions if a.get("action_type") == "lead")
            except (ValueError, TypeError):
                leads = 0
                
            try:
                purchases = sum(int(a.get("value", 0)) for a in actions if a.get("action_type") == "purchase")
            except (ValueError, TypeError):
                purchases = 0
                
            conversions = leads + purchases
            
            try:
                cpa = (spend / conversions) if conversions else 0
            except ZeroDivisionError:
                cpa = 0

            rows_to_insert.append({
                "id": generate_deterministic_uuid(ad_id, date_str),  # Deterministic UUID
                "ad_id": ad_id,  # Store ad_id for filtering/grouping
                "account_id": ad_account_id,
                "business_name": business_name,
                "ad_name": ad_name,
                "campaign_id": campaign_id,
                "campaign_name": campaign_name,
                "impressions": impressions,
                "clicks": clicks,
                "ctr": ctr,
                "spend": spend,
                "daily_budget": daily_budget,
                "cpc": cpc,
                "cpm": cpm,
                "frequency": frequency,
                "conversions": conversions,
                "leads": leads,
                "purchases": purchases,
                "cpa": cpa,
                "date": date_str,
                "flagged": False,
                "flagged_reason": None,
                "request_id": REQUEST_ID,  # Add request ID for tracing
                "processed_at": datetime.now().isoformat()
            })
        except Exception as row_err:
            # Count error types
            if isinstance(row_err, ZeroDivisionError):
                processing_errors["division_by_zero"] += 1
            elif isinstance(row_err, TypeError):
                processing_errors["type_error"] += 1
            else:
                processing_errors["other"] += 1
                
            logger.warning(f"⚠️ Error processing insight row for {business_name}: {row_err}")
            if DEBUG_MODE:
                logger.debug(f"Error details: {traceback.format_exc()}")
                logger.debug(f"Problematic insight data: {json.dumps(insight)}")

    processing_time = time.time() - processing_start
    logger.info(f"Processed {len(rows_to_insert)} rows for {business_name} in {processing_time:.2f}s")
    
    if sum(processing_errors.values()) > 0:
        logger.warning(f"Processing errors: {json.dumps(processing_errors)}")
    
    return rows_to_insert

# ========== MAIN ==========
def main():
    script_start = time.time()
    
    # Validate Supabase connection first
    if not validate_supabase_connection():
        logger.error("Failed to validate Supabase connection. Aborting.")
        sys.exit(1)
        
    # Verify the target table exists
    table_name = "meta_ads_monitoring"
    if not check_table_exists(table_name):
        logger.error(f"Target table '{table_name}' does not exist in Supabase. Aborting.")
        sys.exit(1)
        
    # Get table schema for validation
    schema = get_table_schema(table_name)
    if schema:
        logger.info(f"Retrieved schema for '{table_name}', will validate records before insertion")
    else:
        logger.warning(f"Could not retrieve schema for '{table_name}', will proceed without schema validation")
    
    # Calculate time range (last 30 days)
    today = datetime.today()
    past_30_days = today - timedelta(days=30)
    time_range = {
        "since": past_30_days.strftime("%Y-%m-%d"),
        "until": today.strftime("%Y-%m-%d")
    }
    
    logger.info(f"Fetching data for time range: {time_range['since']} to {time_range['until']}")
    
    # Performance tracking per account
    account_stats = {}
    total_rows = 0
    successful_rows = 0
    failed_rows = 0
    
    for i, (business_name, ad_account_id) in enumerate(AD_ACCOUNTS):
        logger.info(f"\n🔄 [{i+1}/{len(AD_ACCOUNTS)}] Processing: {business_name} (act_{ad_account_id})")
        account_start = time.time()
        
        try:
            # Process data for this account
            rows = process_data(ad_account_id, time_range, business_name)
            
            # Insert into Supabase
            if rows:
                logger.info(f"Inserting {len(rows)} rows into Supabase for {business_name}")
                success, errors = insert_data_to_supabase(rows, schema)
                successful_rows += success
                failed_rows += errors
                total_rows += len(rows)
            else:
                logger.info(f"No data to insert for {business_name}")
            
            account_stats[business_name] = {
                "account_id": ad_account_id,
                "rows_processed": len(rows),
                "time_seconds": time.time() - account_start
            }
                
        except Exception as e:
            logger.error(f"⚠️ Skipping {business_name} due to error: {e}")
            logger.error(traceback.format_exc())
            account_stats[business_name] = {
                "account_id": ad_account_id,
                "error": str(e),
                "time_seconds": time.time() - account_start
            }
    
    # Log final statistics
    total_time = time.time() - script_start
    
    logger.info("\n=== Meta Ads Fetch Summary ===")
    logger.info(f"Total execution time: {total_time:.2f} seconds")
    logger.info(f"Accounts processed: {len(AD_ACCOUNTS)}")
    logger.info(f"Total rows processed: {total_rows}")
    logger.info(f"Successful inserts: {successful_rows}")
    logger.info(f"Failed inserts: {failed_rows}")
    
    if DEBUG_MODE:
        logger.debug("Per-account statistics:")
        for business, stats in account_stats.items():
            logger.debug(f"  {business}: {json.dumps(stats)}")
    
    logger.info("Script execution complete!")

# Entry point
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Script interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.critical(f"Unhandled exception: {e}")
        logger.critical(traceback.format_exc())
        sys.exit(1) 