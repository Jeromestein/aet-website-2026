import { afterEach, beforeEach, expect, it, vi } from "vitest";

let previousExit: typeof process.exitCode;
beforeEach(() => {
  vi.resetModules(); previousExit = process.exitCode; process.exitCode = 0;
  vi.stubEnv("PREEVAL_EMAIL_RECOVERY_ORIGIN", "https://approved-dev.vercel.app");
  vi.stubEnv("CRON_SECRET", "synthetic-secret-long-enough");
  vi.stubEnv("VERCEL_AUTOMATION_BYPASS_SECRET", "");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ applications: 1, attempted: 1, sent: 1, reviewRequired: 0, dispatchErrors: 0 })));
  vi.spyOn(console, "log").mockImplementation(() => {}); vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { process.exitCode = previousExit; vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const run = () => import("../scripts/email/recover.mjs");

it("calls only the pinned HTTPS route, with auth, redirect rejection and a deadline", async () => {
  await run();
  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, options] = vi.mocked(fetch).mock.calls[0];
  expect(String(url)).toBe("https://approved-dev.vercel.app/api/internal/pre-evaluation/email-recovery");
  expect(options).toMatchObject({ headers: { Authorization: "Bearer synthetic-secret-long-enough" }, redirect: "error" });
  expect(options?.signal).toBeInstanceOf(AbortSignal); expect(process.exitCode).toBe(0);
});
it.each(["https://attacker.example", "http://approved-dev.vercel.app", "https://user:password@approved-dev.vercel.app", "https://approved-dev.vercel.app/other", "https://approved-dev.vercel.app?secret=x"])("rejects an unapproved origin: %s", async origin => {
  vi.stubEnv("PREEVAL_EMAIL_RECOVERY_ORIGIN", origin); await run();
  expect(fetch).not.toHaveBeenCalled(); expect(process.exitCode).toBe(1);
});
it("passes an explicitly supplied deployment-protection header without logging credentials", async () => {
  vi.stubEnv("VERCEL_AUTOMATION_BYPASS_SECRET", "private-bypass"); await run();
  expect(vi.mocked(fetch).mock.calls[0][1]?.headers).toMatchObject({ "x-vercel-protection-bypass": "private-bypass" });
  expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain("private-bypass");
});
it.each([{ skipped: true }, { error: "private server details" }])("fails visibly on disabled or malformed recovery: %j", async body => {
  vi.mocked(fetch).mockResolvedValue(Response.json(body)); await run(); expect(process.exitCode).toBe(1);
  expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("private server details");
});
it("signals newly required manual review without exposing response data", async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({ applications: 1, attempted: 0, sent: 0, reviewRequired: 1, dispatchErrors: 0, private: "do not log" }));
  await run(); expect(process.exitCode).toBe(2);
  expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain("do not log");
});
it("does not loop or print credentials when the network fails", async () => {
  vi.mocked(fetch).mockRejectedValue(new Error("private request headers")); await run();
  expect(fetch).toHaveBeenCalledTimes(1); expect(process.exitCode).toBe(1);
  expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("private request headers");
});
