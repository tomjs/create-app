import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.__dirname = dirname(fileURLToPath(import.meta.url));
