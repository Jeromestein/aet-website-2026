export function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error("Missing configuration: " + name);
  return value;
}
export function configuration() {
  const origin = required("PREEVAL_ORIGIN").replace(/\/$/, "");
  const url = new URL(origin);
  if (
    process.env.PREEVAL_ENV !== "local" ||
    !["localhost", "127.0.0.1"].includes(url.hostname)
  ) {
    throw new Error(
      "This pre-evaluation pilot is restricted to local testing.",
    );
  }
  const database = new URL(required("PREEVAL_DATABASE_URL"));
  if (!["localhost", "127.0.0.1"].includes(database.hostname))
    throw new Error("The pilot requires a local database.");
  return {
    origin,
    admin: required("PREEVAL_ADMIN_EMAIL").toLowerCase(),
    recipient: required("PREEVAL_TEST_EMAIL").toLowerCase(),
  };
}
