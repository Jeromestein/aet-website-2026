import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ after: vi.fn(), due: vi.fn(), process: vi.fn(), mail: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/server', () => ({ after: m.after }));
vi.mock('../lib/preeval/ai-jobs', () => ({ dueAIJobs: m.due }));
vi.mock('../lib/preeval/ai', () => ({ processAI: m.process }));
vi.mock('../lib/preeval/email', () => ({ deliverApplicationEmails: m.mail }));
import { scheduleAI, recoverAIJobs } from '../lib/preeval/ai-scheduler';
import { GET } from '../app/api/internal/pre-evaluation/process/route';
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('PREEVAL_AI_ENABLED', 'true');
  vi.stubEnv('OPENAI_API_KEY', 'synthetic-test-key');
  vi.stubEnv('CRON_SECRET', 'synthetic-recovery-secret');
  vi.stubEnv('PREEVAL_AI_DAILY_RECOVERY_ENABLED', 'true');
  m.due.mockResolvedValue(['job-1']);
  m.process.mockResolvedValue(true);
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe('request-triggered AI execution', () => {
  it.each([['PREEVAL_AI_ENABLED', 'false'], ['OPENAI_API_KEY', ''], ['OPENAI_API_KEY', '   ']])('does no queue work with %s=%s', async (key, value) => {
    vi.stubEnv(key, value);
    await scheduleAI('job-1');
    expect(await recoverAIJobs()).toEqual({ attempted: 0, dispatchErrors: 0 });
    expect(m.due).not.toHaveBeenCalled(); expect(m.after).not.toHaveBeenCalled();
  });
  it('does not launch an ineligible, completed or backoff job', async () => {
    m.due.mockResolvedValue([]); await scheduleAI('job-1');
    expect(m.due).toHaveBeenCalledWith(1, 'job-1');
    expect(m.after).not.toHaveBeenCalled(); expect(m.process).not.toHaveBeenCalled();
  });
  it('defers processing until after the response and awaits it', async () => {
    await scheduleAI('job-1');
    expect(m.process).not.toHaveBeenCalled();
    let finish!: (result: boolean) => void;
    m.process.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const callback = m.after.mock.calls[0][0];
    let completed = false;
    const pending = callback().then(() => { completed = true; });
    await Promise.resolve(); expect(completed).toBe(false);
    expect(m.process).toHaveBeenCalledWith('job-1');
    finish(true); await pending; expect(completed).toBe(true);
    expect(m.mail).toHaveBeenCalledWith("job-1");
    expect(m.process.mock.invocationCallOrder[0]).toBeLessThan(m.mail.mock.invocationCallOrder[0]);
  });
  it('does not fail a saved submission when eligibility or dispatch fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    m.due.mockRejectedValueOnce(new Error('private provider details'));
    await expect(scheduleAI('job-1')).resolves.toBeUndefined();
    expect(m.after).not.toHaveBeenCalled();
    await scheduleAI('job-1');
    m.process.mockRejectedValueOnce(new Error('private provider details'));
    await expect(m.after.mock.calls[0][0]()).resolves.toBeUndefined();
    expect(JSON.stringify(log.mock.calls)).not.toContain('private provider details');
  });
  it('limits daily recovery to three candidates and waits for all results', async () => {
    m.due.mockResolvedValue(['job-1', 'job-2', 'job-3']);
    m.process.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('interrupted'));
    expect(await recoverAIJobs()).toEqual({ attempted: 1, dispatchErrors: 1 });
    expect(m.due).toHaveBeenCalledWith(3);
    expect(m.process.mock.calls).toEqual([['job-1'], ['job-2'], ['job-3']]);
  });
});
function cron(secret = 'Bearer synthetic-recovery-secret') {
  return GET(new Request('https://example.test/api/internal/pre-evaluation/process', { headers: { Authorization: secret } }));
}
describe('daily recovery endpoint', () => {
  it.each(['', 'short'])('rejects missing or weak server secret %s', async secret => {
    vi.stubEnv('CRON_SECRET', secret);
    expect((await cron('Bearer ' + secret)).status).toBe(401);
    expect(m.due).not.toHaveBeenCalled();
  });
  it.each(['', 'Bearer wrong', 'Bearer synthetic-recovery-secreX'])('rejects unauthorized calls', async secret => {
    expect((await cron(secret)).status).toBe(401); expect(m.due).not.toHaveBeenCalled();
  });
  it('requires an explicit opt-in even with valid authorization', async () => {
    vi.stubEnv('PREEVAL_AI_DAILY_RECOVERY_ENABLED', 'false');
    const response = await cron();
    expect(await response.json()).toEqual({ skipped: true }); expect(m.due).not.toHaveBeenCalled();
  });
  it('runs bounded recovery and disables response caching', async () => {
    const response = await cron(); expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ attempted: 1, dispatchErrors: 0 });
  });
  it('returns a safe retryable response if the database is unavailable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.due.mockRejectedValue(new Error('private connection string'));
    const response = await cron(); expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'recovery_failed' });
  });
});
