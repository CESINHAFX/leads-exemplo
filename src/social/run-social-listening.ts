import dotenv from 'dotenv';
import { DatabaseManager } from '../database/manager';
import { logger } from '../utils/logger';
import { SocialListeningService } from './social-listening-service';

dotenv.config();

async function main() {
  const db = new DatabaseManager();
  await db.initialize();

  const service = new SocialListeningService(db);
  await service.start();

  process.on('SIGINT', async () => {
    logger.info('Stopping social listening service (SIGINT)...');
    await service.stop();
    await db.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Stopping social listening service (SIGTERM)...');
    await service.stop();
    await db.close();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('Failed to run social listening service', error as Error);
  process.exit(1);
});
