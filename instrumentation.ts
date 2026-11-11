/** Verify the explicitly selected six-table database before accepting requests. */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && ['six-preview','six-production'].includes(process.env.APPLICATION_CORE_MODE || '')) {
    const { db } = await import('./lib/preeval/db');
    const { activateSixTableRuntime } = await import('./lib/application-core/convergence-mode');
    await activateSixTableRuntime(db());
  }
}
