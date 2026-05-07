// src/index.ts
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';

import { config } from './config/environment';
import { logger } from './utils/logger';
import { DatabaseManager } from './database/manager';
import { SocialListeningService } from './social/social-listening-service';

async function main() {
  logger.info('Starting Agentic Lead Management System');

  // Inicializa o banco
  const dbManager = new DatabaseManager();
  await dbManager.initialize();
  logger.info('Database initialized successfully');

  const socialListening = new SocialListeningService(dbManager);
  await socialListening.start();

  // Sobe o Express
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Root route - redirect users to the frontend app.
  app.get('/', (_req: Request, res: Response) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8010';
    return res.redirect(302, frontendUrl);
  });

  // Health-check
  app.get('/health', (_req: Request, res: Response) => {
    res.send('OK');
  });

  // Rota de leads
  app.get('/api/leads', async (_req: Request, res: Response) => {
    try {
      const leads = await dbManager.getLeads(200);
      return res.status(200).json({ success: true, leads });
    } catch (err) {
      logger.error('Error listing leads', err as Error);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  app.post('/api/leads', async (req: Request, res: Response) => {
    try {
      logger.info('Received payload:', req.body);
      const lead = await dbManager.createLead(req.body);
      return res.status(201).json({ success: true, id: lead.id });
    } catch (err) {
      logger.error('Error saving lead', err as Error);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  app.get('/api/social-signals', async (req: Request, res: Response) => {
    try {
      const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;
      const limit = Number(req.query.limit || 100);
      const signals = await socialListening.listCapturedSignals(limit, status);
      return res.status(200).json({ success: true, signals });
    } catch (err) {
      logger.error('Error listing social signals', err as Error);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  app.patch('/api/social-signals/:id/status', async (req: Request, res: Response) => {
    try {
      const status = req.body?.status as 'approved' | 'rejected' | 'pending' | undefined;
      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }

      const updated = await socialListening.setSignalStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Signal not found' });
      }

      return res.status(200).json({ success: true, signal: updated });
    } catch (err) {
      logger.error('Error updating social signal status', err as Error);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  app.post('/api/social-signals/dispatch-approved', async (_req: Request, res: Response) => {
    try {
      const notified = await socialListening.dispatchApprovedSignals(200);
      return res.status(200).json({ success: true, notified });
    } catch (err) {
      logger.error('Error dispatching approved social signals', err as Error);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  const port = config.API_PORT || parseInt(process.env.PORT || '4000', 10);
  app.listen(port, () => {
    logger.info(`API listening on http://localhost:${port}`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down gracefully...');
    await socialListening.stop();
    await dbManager.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Shutting down gracefully (SIGTERM)...');
    await socialListening.stop();
    await dbManager.close();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Fatal error on startup:', err);
  process.exit(1);
});
