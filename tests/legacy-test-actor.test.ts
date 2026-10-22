import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { legacyTestActor } from "../scripts/legacy-test-actor";

const errorMessage = "Provide exactly one non-empty --test-actor=email for this legacy test command.";
// Exercise only startup rejection with no env file or credentials.
// The full legacy workflows have external side effects and are not executed.
describe.each([
  "scripts/preeval/lifecycle.ts",
  "scripts/evaluation/browser-fixture.ts",
  "scripts/evaluation/workflow-integration.ts",
])("legacy script arguments: %s", script => {
  it.each([undefined, "", "   "])("fails before configuration or services for actor %j", actor => {
    const result = spawnSync(process.execPath, [
      "--import", "./scripts/register-server-only.mjs", "--import", "tsx",
      script, ...(actor === undefined ? [] : [`--test-actor=${actor}`]),
    ], {
      cwd: fileURLToPath(new URL("../", import.meta.url)),
      env: { NODE_ENV: "test" }, encoding: "utf8", timeout: 15000,
    });
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(errorMessage);
    expect(result.stderr).not.toContain("Missing configuration:");
    expect(result.stdout).toBe("");
  });
});

it("normalizes the explicit actor while preserving other script flags", () => {
  const args = ["--quote", "--test-actor=  Fixture.Actor@Example.Invalid  ", "--services"];
  expect(legacyTestActor(args)).toBe("fixture.actor@example.invalid");
  expect(args[1]).toBe("--test-actor=  Fixture.Actor@Example.Invalid  ");
});

it.each([
  ["--test-actor"],
  ["--test-actor=first@example.invalid", "--test-actor=second@example.invalid"],
  ["--services"],
])("rejects missing or ambiguous actor arguments: %j", (...args) => {
  expect(() => legacyTestActor(args)).toThrow(errorMessage);
});
