/**
 * Freshness System - Manual Job Runner Script
 *
 * Run freshness verification jobs from the command line.
 *
 * Usage:
 *   bun run scripts/run_freshness_job.ts                    # Run with defaults
 *   bun run scripts/run_freshness_job.ts --dry-run          # Preview only
 *   bun run scripts/run_freshness_job.ts --scope=curated    # Curated entries only
 *   bun run scripts/run_freshness_job.ts --max-urls=100     # Limit URLs checked
 *   bun run scripts/run_freshness_job.ts --org-types=VC,PE  # Specific org types
 *
 * Environment Variables:
 *   FRESHNESS_ENABLED=true                 # Enable the system (default: true)
 *   FRESHNESS_RATE_LIMIT_PER_MIN=10       # Max requests per minute per host
 *   FRESHNESS_MAX_URLS_PER_RUN=50         # Max URLs to check per job
 *   FRESHNESS_LLM_ASSIST_ENABLED=false    # Enable LLM assistance (optional)
 *   EXPO_PUBLIC_SUPABASE_URL              # Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY             # Supabase service role key
 */

// Note: This script runs in Node/Bun context, not React Native
// Import the runner directly
import { runFreshnessJob, type RunJobOptions } from '../src/lib/freshness/runner';

// ============================================================================
// ARGUMENT PARSING
// ============================================================================

function parseArgs(): RunJobOptions & { help: boolean } {
  const args = process.argv.slice(2);
  const options: RunJobOptions & { help: boolean } = {
    help: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--scope=')) {
      const scope = arg.split('=')[1];
      if (['curated', 'external', 'all'].includes(scope)) {
        options.scope = scope as 'curated' | 'external' | 'all';
      }
    } else if (arg.startsWith('--frequency=')) {
      const freq = arg.split('=')[1];
      if (['daily', 'weekly', 'monthly', 'adhoc'].includes(freq)) {
        options.frequency = freq as 'daily' | 'weekly' | 'monthly' | 'adhoc';
      }
    } else if (arg.startsWith('--max-urls=')) {
      options.maxUrls = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--rate-limit=')) {
      options.rateLimit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--org-types=')) {
      options.orgTypes = arg.split('=')[1].split(',') as RunJobOptions['orgTypes'];
    } else if (arg.startsWith('--workspace-id=')) {
      options.workspaceId = arg.split('=')[1];
    } else if (arg.startsWith('--user-id=')) {
      options.userId = arg.split('=')[1];
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Marketplace Data Freshness System - Job Runner

USAGE:
  bun run scripts/run_freshness_job.ts [OPTIONS]

OPTIONS:
  --help, -h              Show this help message
  --dry-run               Preview changes without writing to database
  --scope=<scope>         Scope: curated, external, all (default: curated)
  --frequency=<freq>      Frequency: daily, weekly, monthly, adhoc (default: adhoc)
  --max-urls=<number>     Maximum URLs to check per run (default: 50)
  --rate-limit=<number>   Max requests per minute per host (default: 10)
  --org-types=<types>     Comma-separated org types (e.g., VC,PE,LawFirm)
  --workspace-id=<uuid>   Workspace ID for task drafts
  --user-id=<uuid>        User ID for task drafts

EXAMPLES:
  # Run with defaults (curated scope, 50 URLs, 10 req/min)
  bun run scripts/run_freshness_job.ts

  # Dry run to preview what would be checked
  bun run scripts/run_freshness_job.ts --dry-run

  # Check only VCs and PEs, max 100 URLs
  bun run scripts/run_freshness_job.ts --org-types=VC,PE --max-urls=100

  # Check all entries with lower rate limit
  bun run scripts/run_freshness_job.ts --scope=all --rate-limit=5

ENVIRONMENT VARIABLES:
  FRESHNESS_ENABLED             Enable the system (default: true)
  FRESHNESS_RATE_LIMIT_PER_MIN  Max requests per minute per host (default: 10)
  FRESHNESS_MAX_URLS_PER_RUN    Max URLs to check per job (default: 50)
  FRESHNESS_LLM_ASSIST_ENABLED  Enable LLM assistance (default: false)
  EXPO_PUBLIC_SUPABASE_URL      Supabase project URL (required)
  SUPABASE_SERVICE_ROLE_KEY     Supabase service role key (required)

OUTPUT:
  - Creates freshness_jobs record with stats
  - Creates freshness_checks records for each URL
  - Creates freshness_review_queue items for detected changes
  - Creates task_drafts for curator review (pending_confirmation)
`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  console.log('='.repeat(80));
  console.log('MARKETPLACE DATA FRESHNESS SYSTEM');
  console.log('='.repeat(80));
  console.log(`Mode: ${options.dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Scope: ${options.scope || 'curated'}`);
  console.log(`Max URLs: ${options.maxUrls || 50}`);
  console.log(`Rate Limit: ${options.rateLimit || 10} req/min`);
  if (options.orgTypes) {
    console.log(`Org Types: ${options.orgTypes.join(', ')}`);
  }
  console.log('='.repeat(80));
  console.log('');

  try {
    const result = await runFreshnessJob(options);

    console.log('');
    console.log('='.repeat(80));
    console.log('JOB COMPLETE');
    console.log('='.repeat(80));
    console.log(`Success: ${result.success}`);
    console.log(`Job ID: ${result.jobId || 'N/A (dry run)'}`);

    if (result.stats) {
      console.log(`Duration: ${result.stats.duration_ms}ms`);
      console.log(`Avg Response Time: ${result.stats.avg_response_time_ms}ms`);

      if (result.stats.by_org_type) {
        console.log('\nBy Org Type:');
        for (const [type, count] of Object.entries(result.stats.by_org_type)) {
          console.log(`  ${type}: ${count}`);
        }
      }

      if (result.stats.by_outcome) {
        console.log('\nBy Outcome:');
        for (const [outcome, count] of Object.entries(result.stats.by_outcome)) {
          console.log(`  ${outcome}: ${count}`);
        }
      }
    }

    if (result.error) {
      console.log(`\nError: ${result.error}`);
    }

    console.log('='.repeat(80));

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
