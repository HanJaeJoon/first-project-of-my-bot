import { run } from './cli.js';

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
