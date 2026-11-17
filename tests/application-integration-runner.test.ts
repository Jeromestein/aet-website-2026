import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
describe('isolated application test runner', () => {
  it.each(['formal','preeval'])('refuses %s without an explicit disposable PostgreSQL toolchain', mode => {
    const result = spawnSync(process.execPath, ['scripts/test-application-integration.mjs', mode], {
      env: { NODE_ENV: 'test', PATH: process.env.PATH, APPLICATION_CORE_TEST_PG_BIN: '/missing/aet-test-postgres' }, encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Set APPLICATION_CORE_TEST_PG_BIN');
    expect(result.stdout).toBe('');
  });
});
