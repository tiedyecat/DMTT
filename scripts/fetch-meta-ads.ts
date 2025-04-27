import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Enhanced error handling with error categories
enum ErrorCategory {
  ENV_CONFIG = 'ENVIRONMENT_CONFIG',
  FILE_SYSTEM = 'FILE_SYSTEM',
  PROCESS_EXECUTION = 'PROCESS_EXECUTION',
  PYTHON = 'PYTHON_ERROR',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
  DATABASE = 'DATABASE'
}

type EnhancedError = {
  message: string;
  category?: ErrorCategory;
  timestamp: string;
  context?: Record<string, unknown>;
  originalError?: unknown;
}

// Logger with timestamps and categories
class Logger {
  static error(message: string, category: ErrorCategory = ErrorCategory.UNKNOWN, context?: Record<string, unknown>, originalError?: unknown): void {
    const timestamp = new Date().toISOString();
    console.error(`❌ [${timestamp}] [${category}] ${message}`);
    
    if (context) {
      console.error(`  Context:`, JSON.stringify(context, null, 2));
    }
    
    if (originalError && originalError instanceof Error) {
      console.error(`  Original Error: ${originalError.message}`);
      if (originalError.stack) {
        console.error(`  Stack Trace: ${originalError.stack.split('\n').slice(1, 4).join('\n    ')}`);
      }
    }
  }
  
  static warn(message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    console.warn(`⚠️ [${timestamp}] ${message}`);
    if (context) {
      console.warn(`  Context:`, JSON.stringify(context, null, 2));
    }
  }
  
  static info(message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    console.log(`ℹ️ [${timestamp}] ${message}`);
    if (context) {
      console.log(`  Context:`, JSON.stringify(context, null, 2));
    }
  }
  
  static success(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`✅ [${timestamp}] ${message}`);
  }
}

function createError(message: string, category: ErrorCategory, context?: Record<string, unknown>, originalError?: unknown): EnhancedError {
  return {
    message,
    category,
    timestamp: new Date().toISOString(),
    context,
    originalError
  };
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) return error.message;
  
  try {
    return `Unknown error: ${JSON.stringify(error)}`;
  } catch {
    return `Non-serializable error: ${String(error)}`;
  }
}

// Load environment variables from different possible locations
function loadEnv(): void {
  Logger.info('Loading environment variables...');
  
  // Try loading from different possible locations
  const rootEnvPath = path.resolve(process.cwd(), '..', '.env');
  const scriptsEnvPath = path.resolve(process.cwd(), '.env');
  
  const dotenvPaths = [
    { path: rootEnvPath, description: 'project root' },
    { path: scriptsEnvPath, description: 'scripts directory' }
  ];
  
  let envLoaded = false;
  for (const { path: envPath, description } of dotenvPaths) {
    if (fs.existsSync(envPath)) {
      Logger.info(`Found .env file at ${description}: ${envPath}`);
      
      try {
        const result = dotenv.config({ path: envPath });
        if (result.error) {
          Logger.warn(`Error parsing .env file at ${envPath}`, { 
            error: result.error.message 
          });
        } else {
          envLoaded = true;
          Logger.success(`Loaded environment variables from ${description}`);
          break;
        }
      } catch (err) {
        Logger.error(
          `Failed to load .env file from ${envPath}`, 
          ErrorCategory.ENV_CONFIG, 
          { path: envPath },
          err
        );
      }
    }
  }
  
  if (!envLoaded) {
    Logger.info('No .env files found or loaded, using existing environment variables');
  }
  
  // Check required environment variables
  const requiredVars = [
    'ACCESS_TOKEN', 
    'SUPABASE_URL', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    Logger.error(
      'Missing required environment variables', 
      ErrorCategory.ENV_CONFIG,
      { missingVars }
    );
    
    console.error('\nPlease add these to your .env file or environment:');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    
    throw createError(
      `Missing environment variables: ${missingVars.join(', ')}`,
      ErrorCategory.ENV_CONFIG,
      { missingVars }
    );
  }
  
  // Set SUPABASE_KEY for the Python script (use service role key)
  process.env.SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Log redacted values for debugging (show first/last few chars only)
  const redactedEnv: Record<string, string> = {};
  requiredVars.forEach(varName => {
    const value = process.env[varName] || '';
    redactedEnv[varName] = value.length > 8 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '********';
  });
  
  Logger.info('Environment variables loaded successfully', { env: redactedEnv });
}

// Check that Python is installed and has required packages
function checkPythonInstallation(): Promise<void> {
  Logger.info('Checking Python installation...');
  
  return new Promise<void>((resolve, reject) => {
    // First try python3 (common on macOS and newer systems)
    exec('python3 --version', (error, stdout, stderr) => {
      if (error) {
        Logger.info('python3 not found, trying python...');
        
        // If python3 fails, try regular python
        exec('python --version', (error2, stdout2, stderr2) => {
          if (error2) {
            const errorObj = createError(
              'Neither python3 nor python is installed or in PATH',
              ErrorCategory.PYTHON,
              { 
                python3Error: error.message,
                pythonError: error2.message,
                python3Stderr: stderr,
                pythonStderr: stderr2
              }
            );
            
            Logger.error(
              'Neither python3 nor python is installed or in PATH', 
              ErrorCategory.PYTHON,
              { stderr: stderr2 },
              error2
            );
            
            return reject(errorObj);
          }
          
          const pythonVersion = stdout2.trim();
          Logger.success(`Found Python: ${pythonVersion}`);
          process.env.PYTHON_CMD = 'python';
          checkPythonPackages(resolve, reject);
        });
      } else {
        const pythonVersion = stdout.trim();
        Logger.success(`Found Python: ${pythonVersion}`);
        process.env.PYTHON_CMD = 'python3';
        checkPythonPackages(resolve, reject);
      }
    });
  });
}

// Helper function to check Python packages
function checkPythonPackages(resolve: () => void, reject: (error: any) => void): void {
  const pythonCmd = process.env.PYTHON_CMD || 'python';
  const requiredPackages = ['requests'];
  const missingPackages: string[] = [];
  
  const checkPackage = (index: number) => {
    if (index >= requiredPackages.length) {
      if (missingPackages.length > 0) {
        Logger.warn('Some Python packages may be missing', { 
          missingPackages,
          installCommand: `${pythonCmd} -m pip install ${missingPackages.join(' ')}` 
        });
      } else {
        Logger.success('All required Python packages are available');
      }
      return resolve();
    }
    
    const pkg = requiredPackages[index];
    exec(`${pythonCmd} -c "import ${pkg}"`, (error) => {
      if (error) {
        missingPackages.push(pkg);
      }
      checkPackage(index + 1);
    });
  };
  
  checkPackage(0);
}

// Set up ad accounts file
function setupAdAccountsFile(adAccountsPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    Logger.info('Setting up ad accounts file', { path: adAccountsPath });
    
    // Create ad_accounts_by_team.json if it doesn't exist
    try {
      if (!fs.existsSync(adAccountsPath)) {
        Logger.info(`Creating sample ad accounts file`, { path: adAccountsPath });
        
        // Ensure directory exists
        const dir = path.dirname(adAccountsPath);
        if (!fs.existsSync(dir)) {
          try {
            fs.mkdirSync(dir, { recursive: true });
            Logger.info(`Created directory for ad accounts file`, { directory: dir });
          } catch (err) {
            Logger.error(
              `Failed to create directory for ad accounts file`, 
              ErrorCategory.FILE_SYSTEM, 
              { directory: dir },
              err
            );
            return reject(createError(
              `Failed to create directory: ${dir}`,
              ErrorCategory.FILE_SYSTEM,
              { directory: dir },
              err
            ));
          }
        }
        
        // Create sample file
        const sampleData = {
          "default": [
            ["Sample Business 1", "123456789"],
            ["Sample Business 2", "987654321"]
          ]
        };
        
        try {
          fs.writeFileSync(adAccountsPath, JSON.stringify(sampleData, null, 2));
          Logger.success('Created sample ad accounts file');
          Logger.warn('Please update it with your actual ad account IDs before running again');
        } catch (err) {
          Logger.error(
            `Failed to write ad accounts file`, 
            ErrorCategory.FILE_SYSTEM, 
            { path: adAccountsPath },
            err
          );
          return reject(createError(
            `Failed to write ad accounts file: ${adAccountsPath}`,
            ErrorCategory.FILE_SYSTEM,
            { path: adAccountsPath },
            err
          ));
        }
      } else {
        // Validate the existing file is valid JSON
        try {
          const fileContent = fs.readFileSync(adAccountsPath, 'utf8');
          const data = JSON.parse(fileContent);
          
          // Basic validation that it has the expected structure
          let accountCount = 0;
          for (const teamName in data) {
            if (!Array.isArray(data[teamName])) {
              throw new Error(`Team "${teamName}" does not contain an array of accounts`);
            }
            accountCount += data[teamName].length;
          }
          
          Logger.info(`Found existing ad accounts file`, { 
            path: adAccountsPath, 
            teamCount: Object.keys(data).length,
            accountCount
          });
        } catch (err) {
          Logger.error(
            `Existing ad accounts file is invalid`, 
            ErrorCategory.FILE_SYSTEM,
            { path: adAccountsPath },
            err
          );
          Logger.warn(`Problematic ad accounts file will be used, but may cause errors`);
        }
      }
      
      process.env.AD_ACCOUNT_JSON_PATH = adAccountsPath;
      resolve();
    } catch (err) {
      Logger.error(
        `Error setting up ad accounts file`, 
        ErrorCategory.FILE_SYSTEM,
        { path: adAccountsPath },
        err
      );
      reject(createError(
        `Error setting up ad accounts file: ${getErrorMessage(err)}`,
        ErrorCategory.FILE_SYSTEM,
        { path: adAccountsPath },
        err
      ));
    }
  });
}

// Execute the Python script
function executePythonScript(pythonScriptPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    Logger.info(`Executing Python script`, { path: pythonScriptPath });
    
    // Check if the Python script exists
    if (!fs.existsSync(pythonScriptPath)) {
      const errorObj = createError(
        `Python script not found: ${pythonScriptPath}`,
        ErrorCategory.FILE_SYSTEM,
        { path: pythonScriptPath }
      );
      
      Logger.error(
        `Python script not found`, 
        ErrorCategory.FILE_SYSTEM,
        { path: pythonScriptPath }
      );
      
      return reject(errorObj);
    }
    
    // Use the correct Python command
    const pythonCmd = process.env.PYTHON_CMD || 'python';
    
    // Copy environment and add specific variables for the Python process
    const childProcess = exec(`${pythonCmd} "${pythonScriptPath}"`, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer for output
      env: {
        ...process.env, // This correctly maintains the ProcessEnv type
        // Explicitly ensure these values are passed to Python
        ACCESS_TOKEN: process.env.ACCESS_TOKEN || '',
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        SUPABASE_KEY: process.env.SUPABASE_KEY || '',
        AD_ACCOUNT_JSON_PATH: process.env.AD_ACCOUNT_JSON_PATH || ''
      }
    });
    
    // Collect output for potential error analysis
    let stdoutChunks: string[] = [];
    let stderrChunks: string[] = [];
    
    // Log output in real-time
    childProcess.stdout?.on('data', (data: Buffer | string) => {
      const output = data.toString().trim();
      stdoutChunks.push(output);
      console.log(output); // Direct passthrough without timestamp
    });
    
    childProcess.stderr?.on('data', (data: Buffer | string) => {
      const output = data.toString().trim();
      stderrChunks.push(output);
      console.error(output); // Direct passthrough without timestamp
    });
    
    // Handle completion
    childProcess.on('close', (code) => {
      if (code === 0) {
        Logger.success('Python script executed successfully');
        resolve();
      } else {
        // Collect the last few lines of output for the error
        const lastStdoutLines = stdoutChunks
          .join('\n')
          .split('\n')
          .slice(-10)
          .join('\n');
          
        const lastStderrLines = stderrChunks
          .join('\n')
          .split('\n')
          .slice(-10)
          .join('\n');
        
        Logger.error(
          `Python script failed with exit code: ${code}`, 
          ErrorCategory.PYTHON,
          {
            exitCode: code,
            lastStdoutLines,
            lastStderrLines
          }
        );
        
        reject(createError(
          `Python script exited with code ${code}`,
          ErrorCategory.PYTHON,
          {
            exitCode: code,
            lastStdoutLines,
            lastStderrLines
          }
        ));
      }
    });
  });
}

// Supabase validation function to check if target table exists
async function validateSupabaseTable(): Promise<boolean> {
  Logger.info('Validating Supabase table...');
  
  // Make sure we have Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    Logger.error(
      'Missing Supabase credentials for table validation',
      ErrorCategory.ENV_CONFIG,
      { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey }
    );
    return false;
  }
  
  try {
    // Check if table exists
    const tableName = 'meta_ads_monitoring';
    const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
    
    if (!response.ok) {
      Logger.error(
        'Could not connect to Supabase',
        ErrorCategory.NETWORK,
        { 
          status: response.status,
          statusText: response.statusText,
          url: `${supabaseUrl}/rest/v1/`
        }
      );
      return false;
    }
    
    Logger.info('Connected to Supabase successfully');
    
    // Now check if the specific table exists
    const tableResponse = await fetch(
      `${supabaseUrl}/rest/v1/${tableName}?limit=0`,
      {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    
    if (tableResponse.status === 200) {
      Logger.success(`Table '${tableName}' exists`);
      return true;
    } 
    
    if (tableResponse.status === 404) {
      Logger.warn(`Table '${tableName}' does not exist, will attempt to create it`);
      
      // Create the table using SQL
      return await createMetaAdsTable();
    }
    
    Logger.error(
      `Unexpected response checking table existence`,
      ErrorCategory.NETWORK,
      {
        status: tableResponse.status,
        statusText: tableResponse.statusText,
        tableName
      }
    );
    return false;
    
  } catch (error) {
    Logger.error(
      'Error validating Supabase table',
      ErrorCategory.NETWORK,
      {},
      error
    );
    return false;
  }
}

// Create the meta_ads_monitoring table if it doesn't exist
async function createMetaAdsTable(): Promise<boolean> {
  Logger.info('Creating meta_ads_monitoring table in Supabase...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return false;
  }
  
  // SQL statement to create the table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS meta_ads_monitoring (
      id UUID PRIMARY KEY,
      ad_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      business_name TEXT NOT NULL,
      ad_name TEXT,
      campaign_id TEXT,
      campaign_name TEXT,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      ctr REAL DEFAULT 0,
      spend REAL DEFAULT 0,
      daily_budget REAL,
      cpc REAL DEFAULT 0,
      cpm REAL DEFAULT 0,
      frequency REAL DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      leads INTEGER DEFAULT 0,
      purchases INTEGER DEFAULT 0,
      cpa REAL DEFAULT 0,
      date TEXT NOT NULL,
      flagged BOOLEAN DEFAULT FALSE,
      flagged_reason TEXT,
      request_id TEXT,
      processed_at TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_meta_ads_business_name ON meta_ads_monitoring(business_name);
    CREATE INDEX IF NOT EXISTS idx_meta_ads_date ON meta_ads_monitoring(date);
    CREATE INDEX IF NOT EXISTS idx_meta_ads_ad_id ON meta_ads_monitoring(ad_id);
  `;
  
  try {
    // Execute SQL via Supabase RESTful API
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/execute_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: createTableSQL })
      }
    );
    
    if (response.ok) {
      Logger.success('Successfully created meta_ads_monitoring table');
      return true;
    }
    
    const errorText = await response.text();
    Logger.error(
      'Failed to create table',
      ErrorCategory.DATABASE,
      {
        status: response.status,
        response: errorText.slice(0, 500) // Truncate long response
      }
    );
    
    // If the execute_sql RPC function is not available, try using the Supabase query endpoint
    if (response.status === 404) {
      Logger.info('Attempting to create table using /query endpoint instead...');
      
      const queryResponse = await fetch(
        `${supabaseUrl}/rest/v1/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ query: createTableSQL })
        }
      );
      
      if (queryResponse.ok) {
        Logger.success('Successfully created meta_ads_monitoring table using query endpoint');
        return true;
      }
      
      const queryErrorText = await queryResponse.text();
      Logger.error(
        'Failed to create table using query endpoint',
        ErrorCategory.DATABASE,
        {
          status: queryResponse.status,
          response: queryErrorText.slice(0, 500)
        }
      );
    }
    
    return false;
    
  } catch (error) {
    Logger.error(
      'Exception while creating table',
      ErrorCategory.DATABASE,
      {},
      error
    );
    return false;
  }
}

// Main function
async function main(): Promise<void> {
  const startTime = Date.now();
  let stepTimes: Record<string, number> = {};
  
  try {
    Logger.info('🔄 Starting Meta Ads data fetch process');
    
    // Load environment variables
    const envStart = Date.now();
    try {
      loadEnv();
      stepTimes.loadEnv = Date.now() - envStart;
    } catch (error) {
      process.exit(1);
    }
    
    // Validate Supabase connection and create table if needed
    const dbValidationStart = Date.now();
    try {
      const isTableValid = await validateSupabaseTable();
      stepTimes.validateSupabase = Date.now() - dbValidationStart;
      
      if (!isTableValid) {
        Logger.error(
          'Supabase table validation failed. Please check your Supabase setup.',
          ErrorCategory.DATABASE
        );
        process.exit(1);
      }
    } catch (error) {
      Logger.error(
        'Error during Supabase validation',
        ErrorCategory.DATABASE,
        {},
        error
      );
      process.exit(1);
    }
    
    // Check Python installation
    const pythonStart = Date.now();
    try {
      await checkPythonInstallation();
      stepTimes.checkPython = Date.now() - pythonStart;
    } catch (error) {
      Logger.error(
        'Failed to verify Python installation', 
        ErrorCategory.PYTHON,
        {},
        error
      );
      process.exit(1);
    }
    
    // Setup ad accounts file
    const adAccountsStart = Date.now();
    const adAccountsPath = path.resolve(process.cwd(), '..', 'api', 'ad_accounts_by_team.json');
    try {
      await setupAdAccountsFile(adAccountsPath);
      stepTimes.setupAdAccounts = Date.now() - adAccountsStart;
    } catch (error) {
      process.exit(1);
    }
    
    // Path to the Python script
    const pythonScriptPath = path.resolve(process.cwd(), '..', 'api', 'meta-ads-fetch.py');
    
    // Execute the Python script
    const scriptStart = Date.now();
    try {
      await executePythonScript(pythonScriptPath);
      stepTimes.executePythonScript = Date.now() - scriptStart;
    } catch (error) {
      process.exit(1);
    }
    
    const totalTime = Date.now() - startTime;
    Logger.success(`Process completed successfully in ${totalTime}ms`);
    Logger.info('Performance breakdown', { 
      totalTimeMs: totalTime,
      steps: stepTimes
    });
    
    console.log('\nData should now be available in your Supabase database');
    console.log('Visit the dashboard at: /meta-ads to see your data');
    
  } catch (error) {
    Logger.error(
      'An error occurred during the process', 
      ErrorCategory.UNKNOWN,
      {},
      error
    );
    process.exit(1);
  }
}

// Run the main function and handle uncaught exceptions
process.on('uncaughtException', (error) => {
  Logger.error(
    'UNCAUGHT EXCEPTION', 
    ErrorCategory.UNKNOWN,
    {},
    error
  );
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  Logger.error(
    'UNHANDLED PROMISE REJECTION', 
    ErrorCategory.UNKNOWN,
    {},
    reason instanceof Error ? reason : new Error(String(reason))
  );
  process.exit(1);
});

main(); 