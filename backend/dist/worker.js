import { setupWorker } from './queue/processor.js';
import { logger } from './utils/logger.js';
logger.info('Worker process starting...');
setupWorker();
