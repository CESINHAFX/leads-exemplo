import axios, { AxiosInstance } from 'axios';
import { Lead } from '../../types/lead';
import { Interaction } from '../../types/interaction';
import { logger } from '../../utils/logger';
import { CRMProvider, CRMUpsertResult, CRMInteractionResult } from './provider';

export interface FreeCRMClientConfig {
  enabled?: boolean;
  provider?: 'espocrm' | 'suitecrm';
  baseUrl?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  timeoutMs?: number;
  leadEndpoint?: string;
  interactionEndpoint?: string;
}

export class FreeCRMClient implements CRMProvider {
  private client: AxiosInstance;
  private config: Required<FreeCRMClientConfig>;

  constructor(config: FreeCRMClientConfig = {}) {
    this.config = {
      enabled: config.enabled ?? (process.env.FREE_CRM_ENABLED === 'true'),
      provider:
        config.provider ??
        ((process.env.FREE_CRM_PROVIDER as 'espocrm' | 'suitecrm') ||
          'espocrm'),
      baseUrl: config.baseUrl ?? process.env.FREE_CRM_BASE_URL ?? '',
      apiKey: config.apiKey ?? process.env.FREE_CRM_API_KEY ?? '',
      username: config.username ?? process.env.FREE_CRM_USERNAME ?? '',
      password: config.password ?? process.env.FREE_CRM_PASSWORD ?? '',
      timeoutMs: config.timeoutMs ?? Number(process.env.FREE_CRM_TIMEOUT_MS || 10000),
      leadEndpoint:
        config.leadEndpoint ?? process.env.FREE_CRM_LEAD_ENDPOINT ?? '/api/v1/Lead',
      interactionEndpoint:
        config.interactionEndpoint ??
        process.env.FREE_CRM_INTERACTION_ENDPOINT ??
        '/api/v1/Note',
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeoutMs,
    });
  }

  isEnabled(): boolean {
    return Boolean(this.config.enabled && this.config.baseUrl);
  }

  async upsertLead(lead: Lead): Promise<CRMUpsertResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Free CRM disabled or not configured' };
    }

    try {
      const payload = {
        id: lead.id,
        firstName: lead.contactInfo.name,
        emailAddress: lead.contactInfo.email,
        phoneNumber: lead.contactInfo.phone,
        status: lead.status,
        leadType: lead.leadType,
        source: lead.source,
        urgencyLevel: lead.urgencyLevel,
      };

      await this.client.post(this.config.leadEndpoint, payload, {
        headers: this.getHeaders(),
      });

      return { success: true, contactId: lead.id };
    } catch (error: any) {
      logger.error('Free CRM upsertLead failed', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async logInteraction(
    interaction: Interaction,
    contactId: string
  ): Promise<CRMInteractionResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'Free CRM disabled or not configured' };
    }

    try {
      const payload = {
        leadId: interaction.leadId,
        contactId,
        interactionId: interaction.id,
        type: interaction.type,
        direction: interaction.direction,
        content: interaction.content,
        outcome: interaction.outcome,
        timestamp: interaction.timestamp,
      };

      await this.client.post(this.config.interactionEndpoint, payload, {
        headers: this.getHeaders(),
      });

      return { success: true };
    } catch (error: any) {
      logger.error('Free CRM logInteraction failed', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      await this.client.get('/api/v1/App/user', {
        headers: this.getHeaders(),
      });
      return true;
    } catch {
      return false;
    }
  }

  private getHeaders(): Record<string, string> {
    if (this.config.apiKey) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      };
    }

    if (this.config.username && this.config.password) {
      const token = Buffer.from(
        `${this.config.username}:${this.config.password}`
      ).toString('base64');
      return {
        'Content-Type': 'application/json',
        Authorization: `Basic ${token}`,
      };
    }

    return {
      'Content-Type': 'application/json',
    };
  }
}
