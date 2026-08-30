import { rmSync } from 'node:fs';

rmSync('.next', {
  recursive: true,
  force: true,
  maxRetries: 5,
  retryDelay: 200,
});
