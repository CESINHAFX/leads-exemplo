import axios from 'axios';
import { logger } from '../../utils/logger';

export interface EvolutionApiConfig {
  enabled?: boolean;
  baseUrl?: string;
  apiKey?: string;
  instance?: string;
  timeoutMs?: number;
}

export class EvolutionApiAdapter {
  private config: Required<EvolutionApiConfig>;

  constructor(config: EvolutionApiConfig = {}) {
    this.config = {
      enabled:
        config.enabled ?? (process.env.EVOLUTION_API_ENABLED === 'true'),
      baseUrl: config.baseUrl ?? process.env.EVOLUTION_API_BASE_URL ?? '',
      apiKey: config.apiKey ?? process.env.EVOLUTION_API_KEY ?? '',
      instance:
        config.instance ?? process.env.EVOLUTION_API_INSTANCE ?? 'default',
      timeoutMs:
        config.timeoutMs ?? Number(process.env.EVOLUTION_API_TIMEOUT_MS || 8000),
    };
  }

  async sendMessage(phoneNumber: string, content: string): Promise<boolean> {
    if (!this.isConfigured()) {
      // Fallback seguro: não quebra o fluxo quando integração externa não existe.
      logger.info('Evolution API not configured. Using safe no-op fallback.');
      return true;
    }

    try {
      const normalizedNumber = phoneNumber.replace(/\D/g, '');
      const url = `${this.config.baseUrl}/message/sendText/${this.config.instance}`;

      await axios.post(
        url,
        {
          number: normalizedNumber,
          textMessage: {
            text: content,
          },
        },
        {
          timeout: this.config.timeoutMs,
          headers: {
            'Content-Type': 'application/json',
            apikey: this.config.apiKey,
          },
        }
      );

      return true;
    } catch (error) {
      logger.error('Evolution API sendMessage failed', error as Error);
      return false;
    }
  }

  private isConfigured(): boolean {
    return Boolean(
      this.config.enabled &&
        this.config.baseUrl &&
        this.config.apiKey &&
        this.config.instance
    );
  }
}
