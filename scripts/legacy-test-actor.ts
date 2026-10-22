/** Explicit identity for old local test fixtures, never an environment setting. */
export function legacyTestActor(args: readonly string[] = process.argv.slice(2)): string {
  const prefix = "--test-actor=";
  const values = args.filter(arg => arg === "--test-actor" || arg.startsWith(prefix));
  const actor = values.length === 1 && values[0].startsWith(prefix)
    ? values[0].slice(prefix.length).trim().toLowerCase() : "";
  if (!actor) throw new Error("Provide exactly one non-empty --test-actor=email for this legacy test command.");
  return actor;
}
