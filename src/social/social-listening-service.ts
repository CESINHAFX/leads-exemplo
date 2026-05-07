import axios from 'axios';
import {
  DatabaseManager,
  LeadPayload,
  SocialSignalRecord,
  SocialSignalStatus,
} from '../database/manager';
import { logger } from '../utils/logger';

type Network = 'instagram' | 'twitter';

interface SocialSignal {
  network: Network;
  externalId: string;
  authorHandle: string;
  text: string;
  url: string;
  createdAt: Date;
  intentScore: number;
  keywordsMatched: string[];
}

interface SocialListeningConfig {
  enabled: boolean;
  intervalMinutes: number;
  instagram: {
    enabled: boolean;
    accessToken: string;
    businessAccountId: string;
    hashtags: string[];
    limit: number;
  };
  twitter: {
    enabled: boolean;
    bearerToken: string;
    query: string;
    limit: number;
  };
  notifications: {
    requireManualApproval: boolean;
    slackWebhookUrl: string;
    telegramBotToken: string;
    telegramChatId: string;
  };
}

const DEFAULT_KEYWORDS = [
  'preciso',
  'alguem conhece',
  'freelancer',
  'orcamento',
  'designer',
  'social media',
  'copywriter',
  'editor de video',
  'desenvolvedor',
  'workana',
  'marketing digital',
];

export class SocialListeningService {
  private config: SocialListeningConfig;
  private intervalRef?: NodeJS.Timeout;
  private isRunning = false;

  constructor(private db: DatabaseManager) {
    this.config = {
      enabled: process.env.SOCIAL_LISTENING_ENABLED === 'true',
      intervalMinutes: Number(process.env.SOCIAL_LISTENING_INTERVAL_MINUTES || 60),
      instagram: {
        enabled: process.env.SOCIAL_INSTAGRAM_ENABLED === 'true',
        accessToken: process.env.SOCIAL_INSTAGRAM_ACCESS_TOKEN || '',
        businessAccountId: process.env.SOCIAL_INSTAGRAM_BUSINESS_ACCOUNT_ID || '',
        hashtags: (process.env.SOCIAL_INSTAGRAM_HASHTAGS || '#precisodeumdesigner,#freelancer,#marketingdigitalajuda')
          .split(',')
          .map((h) => h.trim())
          .filter(Boolean),
        limit: Number(process.env.SOCIAL_INSTAGRAM_LIMIT || 10),
      },
      twitter: {
        enabled: process.env.SOCIAL_TWITTER_ENABLED === 'true',
        bearerToken: process.env.SOCIAL_TWITTER_BEARER_TOKEN || '',
        query:
          process.env.SOCIAL_TWITTER_QUERY ||
          '("preciso de" (freelancer OR designer OR "social media" OR desenvolvedor) -is:retweet -is:reply) lang:pt',
        limit: Number(process.env.SOCIAL_TWITTER_LIMIT || 15),
      },
      notifications: {
        requireManualApproval:
          process.env.SOCIAL_REQUIRE_MANUAL_APPROVAL !== 'false',
        slackWebhookUrl: process.env.SOCIAL_SLACK_WEBHOOK_URL || '',
        telegramBotToken: process.env.SOCIAL_TELEGRAM_BOT_TOKEN || '',
        telegramChatId: process.env.SOCIAL_TELEGRAM_CHAT_ID || '',
      },
    };
  }

  async start(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('Social listening disabled. Skipping startup.');
      return;
    }

    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    logger.info('Starting social listening service...');

    await this.runCycle();

    this.intervalRef = setInterval(async () => {
      try {
        await this.runCycle();
      } catch (error) {
        logger.error('Social listening cycle failed', error as Error);
      }
    }, this.config.intervalMinutes * 60 * 1000);
  }

  async stop(): Promise<void> {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = undefined;
    }
    this.isRunning = false;
    logger.info('Social listening service stopped.');
  }

  async runCycle(): Promise<void> {
    const signals: SocialSignal[] = [];

    if (this.config.instagram.enabled) {
      signals.push(...(await this.collectInstagramSignals()));
    }

    if (this.config.twitter.enabled) {
      signals.push(...(await this.collectTwitterSignals()));
    }

    for (const signal of signals) {
      await this.captureSignal(signal);
    }

    await this.dispatchApprovedSignals();

    if (signals.length === 0) {
      logger.info('No social signals collected in this cycle.');
    }
  }

  async listCapturedSignals(
    limit = 100,
    status?: SocialSignalStatus
  ): Promise<SocialSignalRecord[]> {
    return this.db.listSocialSignals(limit, status);
  }

  async setSignalStatus(
    signalId: string,
    status: SocialSignalStatus
  ): Promise<SocialSignalRecord | null> {
    return this.db.updateSocialSignalStatus(signalId, status);
  }

  async dispatchApprovedSignals(limit = 100): Promise<number> {
    const approvedSignals = await this.db.getApprovedUnnotifiedSignals(limit);
    if (approvedSignals.length === 0) {
      return 0;
    }

    let notifiedCount = 0;
    for (const signal of approvedSignals) {
      const delivered = await this.notifyApprovedSignal(signal);
      if (delivered) {
        await this.db.markSocialSignalNotified(signal.id);
        notifiedCount++;
      }
    }

    return notifiedCount;
  }

  private async collectInstagramSignals(): Promise<SocialSignal[]> {
    const cfg = this.config.instagram;
    if (!cfg.accessToken || !cfg.businessAccountId || cfg.hashtags.length === 0) {
      logger.warn('Instagram listening enabled but missing required config.');
      return [];
    }

    const signals: SocialSignal[] = [];

    for (const hashtagRaw of cfg.hashtags) {
      const hashtag = hashtagRaw.replace(/^#/, '');
      try {
        const hashtagId = await this.resolveInstagramHashtagId(hashtag, cfg.accessToken);
        if (!hashtagId) {
          continue;
        }

        const mediaResp = await axios.get(
          `https://graph.facebook.com/v20.0/${hashtagId}/recent_media`,
          {
            params: {
              user_id: cfg.businessAccountId,
              fields: 'id,caption,permalink,timestamp,username',
              limit: cfg.limit,
              access_token: cfg.accessToken,
            },
            timeout: 10000,
          }
        );

        const medias: any[] = mediaResp.data?.data || [];

        for (const media of medias) {
          const text = String(media.caption || '').trim();
          const match = this.matchKeywords(text);
          if (!match.isRelevant) {
            continue;
          }

          signals.push({
            network: 'instagram',
            externalId: String(media.id),
            authorHandle: String(media.username || 'instagram-user'),
            text,
            url: String(media.permalink || ''),
            createdAt: media.timestamp ? new Date(media.timestamp) : new Date(),
            intentScore: match.intentScore,
            keywordsMatched: match.keywords,
          });
        }
      } catch (error) {
        logger.warn(`Instagram hashtag collection failed for #${hashtag}`, {
          error: (error as Error).message,
        });
      }
    }

    return signals;
  }

  private async collectTwitterSignals(): Promise<SocialSignal[]> {
    const cfg = this.config.twitter;
    if (!cfg.bearerToken || !cfg.query) {
      logger.warn('Twitter listening enabled but missing required config.');
      return [];
    }

    try {
      const resp = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
        params: {
          query: cfg.query,
          'tweet.fields': 'created_at,author_id,text',
          expansions: 'author_id',
          'user.fields': 'username',
          max_results: Math.max(10, Math.min(cfg.limit, 100)),
        },
        headers: {
          Authorization: `Bearer ${cfg.bearerToken}`,
        },
        timeout: 10000,
      });

      const tweets: any[] = resp.data?.data || [];
      const users: any[] = resp.data?.includes?.users || [];
      const userMap = new Map(users.map((u: any) => [u.id, u.username]));

      const signals: SocialSignal[] = [];
      for (const tweet of tweets) {
        const text = String(tweet.text || '').trim();
        const match = this.matchKeywords(text);
        if (!match.isRelevant) {
          continue;
        }

        const username = userMap.get(tweet.author_id) || 'twitter-user';
        signals.push({
          network: 'twitter',
          externalId: String(tweet.id),
          authorHandle: String(username),
          text,
          url: `https://twitter.com/${username}/status/${tweet.id}`,
          createdAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
          intentScore: match.intentScore,
          keywordsMatched: match.keywords,
        });
      }

      return signals;
    } catch (error) {
      logger.warn('Twitter signal collection failed', {
        error: (error as Error).message,
      });
      return [];
    }
  }

  private async resolveInstagramHashtagId(
    hashtag: string,
    accessToken: string
  ): Promise<string | null> {
    const response = await axios.get('https://graph.facebook.com/v20.0/ig_hashtag_search', {
      params: {
        user_id: this.config.instagram.businessAccountId,
        q: hashtag,
        access_token: accessToken,
      },
      timeout: 10000,
    });

    const data: any[] = response.data?.data || [];
    return data.length > 0 ? String(data[0].id) : null;
  }

  private matchKeywords(text: string): {
    isRelevant: boolean;
    intentScore: number;
    keywords: string[];
  } {
    if (!text) {
      return { isRelevant: false, intentScore: 0, keywords: [] };
    }

    const lower = text.toLowerCase();
    const keywords = DEFAULT_KEYWORDS.filter((k) => lower.includes(k));
    const intentScore = Math.min(1, keywords.length * 0.25 + (lower.includes('urgente') ? 0.2 : 0));

    return {
      isRelevant: keywords.length > 0,
      intentScore,
      keywords,
    };
  }

  private async captureSignal(signal: SocialSignal): Promise<void> {
    const initialStatus: SocialSignalStatus = this.config.notifications
      .requireManualApproval
      ? 'pending'
      : 'approved';

    const save = await this.db.createOrGetSocialSignal({
      network: signal.network,
      external_id: signal.externalId,
      author_handle: signal.authorHandle,
      content: signal.text,
      post_url: signal.url,
      intent_score: signal.intentScore,
      keywords_matched: signal.keywordsMatched,
      captured_at: signal.createdAt,
      status: initialStatus,
    });

    if (!save.created) {
      // Deduplicacao: mesmo post/sinal nao gera novo lead.
      return;
    }

    const lead = await this.persistSignalAsLead(signal);
    if (lead) {
      await this.db.attachLeadToSocialSignal(save.signal.id, lead.id);
    }
  }

  private async persistSignalAsLead(signal: SocialSignal): Promise<{ id: string } | null> {
    const leadType: LeadPayload['lead_type'] =
      signal.intentScore >= 0.75 ? 'hot' : signal.intentScore >= 0.45 ? 'warm' : 'cold';

    const payload: LeadPayload = {
      source: signal.network,
      name: `@${signal.authorHandle}`,
      email: undefined,
      phone: undefined,
      preferred_channel: 'whatsapp',
      timezone: 'UTC',
      lead_type: leadType,
      urgency_level: signal.intentScore >= 0.75 ? 8 : 5,
      intent_signals: [...signal.keywordsMatched, 'social_listening_signal'],
      qualification_score: signal.intentScore,
      status: 'new',
      assigned_agent: 'ai-lead-generation-agent',
      timeline: 'immediate',
      location: signal.network,
      property_type: signal.url,
    };

    try {
      const created = await this.db.createLead(payload);
      return { id: created.id };
    } catch (error) {
      logger.error('Failed to persist social signal as lead', {
        network: signal.network,
        externalId: signal.externalId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  private async notifyApprovedSignal(signal: SocialSignalRecord): Promise<boolean> {
    const message = [
      '*Novo lead aprovado por social listening*',
      `Rede: ${signal.network}`,
      `Autor: @${signal.author_handle}`,
      `Lead ID: ${signal.lead_id || 'nao vinculado'}`,
      `Score de intenção: ${Number(signal.intent_score).toFixed(2)}`,
      `URL: ${signal.post_url}`,
      `Trecho: ${signal.content.slice(0, 220)}`,
      `Status: ${signal.status}`,
    ].join('\n');

    const results = await Promise.allSettled([
      this.notifySlack(message),
      this.notifyTelegram(message),
    ]);

    return results.some((r) => r.status === 'fulfilled');
  }

  private async notifySlack(message: string): Promise<void> {
    const webhookUrl = this.config.notifications.slackWebhookUrl;
    if (!webhookUrl) {
      return;
    }

    try {
      await axios.post(
        webhookUrl,
        { text: message },
        {
          timeout: 8000,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      logger.warn('Slack notification failed', {
        error: (error as Error).message,
      });
    }
  }

  private async notifyTelegram(message: string): Promise<void> {
    const token = this.config.notifications.telegramBotToken;
    const chatId = this.config.notifications.telegramChatId;
    if (!token || !chatId) {
      return;
    }

    try {
      await axios.post(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        },
        {
          timeout: 8000,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      logger.warn('Telegram notification failed', {
        error: (error as Error).message,
      });
    }
  }
}
