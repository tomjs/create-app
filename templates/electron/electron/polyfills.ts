import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

global.__dirname = dirname(fileURLToPath(import.meta.url));
