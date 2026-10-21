import { z } from 'zod';
import { processAI } from '../../lib/preeval/ai';
import { aiConfiguration } from '../../lib/preeval/openai';
import { configuration } from '../../lib/preeval/config';
import { db } from '../../lib/preeval/db';
let stopped = false;
process.on('SIGINT', () => { stopped = true; });
process.on('SIGTERM', () => { stopped = true; });
async function main() {
  configuration(); aiConfiguration();
  const index = process.argv.indexOf('--application');
  const id = index === -1 ? undefined : z.uuid().parse(process.argv[index + 1]);
  const watch = process.argv.includes('--watch');
  console.log('Pre-evaluation GPT worker: Dropbox original files, no OCR, no email/payment dispatch.');
  do {
    const processed = await processAI(id);
    console.log(processed ? 'Analysis job processed; inspect its saved state.' : 'No eligible analysis jobs.');
    if (!watch || stopped) break;
    await new Promise(resolve => setTimeout(resolve, 5000));
  } while (!stopped);
}
main().catch(error => {
  console.error('AI worker stopped:', error?.code || 'check_configuration'); process.exitCode = 1;
}).finally(() => db().end());
