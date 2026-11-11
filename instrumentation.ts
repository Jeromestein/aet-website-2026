/** Verify the opt-in Preview database before accepting requests. No telemetry. */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.APPLICATION_CORE_MODE === 'six-preview') {
    const { db } = await import('./lib/preeval/db');
    const { activateSixTablePreview } = await import('./lib/application-core/convergence-mode');
    await activateSixTablePreview(db());
  }
}
