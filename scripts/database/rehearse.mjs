import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

// Never load dotenv or accept a database URL. Tests own the entire PG cluster.
const pgBin = process.env.APPLICATION_CORE_TEST_PG_BIN || [
  '/opt/homebrew/opt/postgresql@15/bin', '/usr/local/opt/postgresql@15/bin',
  '/usr/lib/postgresql/15/bin', '/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/17/bin',
].find(path => ['initdb', 'pg_ctl', 'psql'].every(name => existsSync(join(path, name))));
if (!pgBin) throw new Error('Set APPLICATION_CORE_TEST_PG_BIN to a local PostgreSQL bin directory. No existing database will be used.');
const result = spawnSync('pnpm', ['exec', 'vitest', 'run', 'tests/application-core-rehearsal.test.ts', 'tests/application-core-runtime.test.ts', 'tests/application-core-preview.test.ts', 'tests/application-core-cohort.test.ts', 'tests/application-core-convergence.test.ts', 'tests/application-core-history.test.ts'], {
  stdio: 'inherit', env: { ...process.env, APPLICATION_CORE_TEST_PG_BIN: pgBin },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
