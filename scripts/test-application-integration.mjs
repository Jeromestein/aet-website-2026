import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
const pg = process.env.APPLICATION_CORE_TEST_PG_BIN;
if (!pg || !['initdb', 'pg_ctl'].every(name => existsSync(join(pg, name)))) {
  console.error('Set APPLICATION_CORE_TEST_PG_BIN to your PostgreSQL bin directory. These tests use disposable local databases; no hosted database or provider is used.');
  process.exit(1);
}
const suites = process.argv[2] === 'formal' ? ['tests/application-core-formal.test.ts'] : ['tests/application-core-six.test.ts'];
const result = spawnSync('pnpm', ['exec', 'vitest', 'run', ...suites], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
