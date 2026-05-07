// src/database/manager.ts


import { Pool, PoolClient, QueryResult } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export interface LeadPayload {
  source: string;
  name: string;
  email?: string;
  phone?: string;
  image_url?: string;
  preferred_channel?: string;
  timezone?: string;
  lead_type: 'hot' | 'warm' | 'cold';
  urgency_level?: number;
  intent_signals?: string[];
  budget_min?: number;
  budget_max?: number;
  location?: string;
  property_type?: string;
  timeline?: string;
  qualification_score?: number;
  status?: string;
  assigned_agent?: string;
}

export interface LeadRecord extends LeadPayload {
  id: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export type SocialSignalStatus = 'pending' | 'approved' | 'rejected';

export interface SocialSignalPayload {
  network: 'instagram' | 'twitter';
  external_id: string;
  author_handle: string;
  content: string;
  post_url: string;
  intent_score: number;
  keywords_matched: string[];
  captured_at: Date;
  status?: SocialSignalStatus;
  lead_id?: string | null;
}

export interface SocialSignalRecord extends SocialSignalPayload {
  id: string;
  notified_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class DatabaseManager {
  private pgPool: Pool;
  private redisClient: RedisClientType;

  constructor() {
    this.pgPool = new Pool({
      host: config.DATABASE_HOST,
      port: config.DATABASE_PORT,
      database: config.DATABASE_NAME,
      user: config.DATABASE_USER,
      password: config.DATABASE_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.redisClient = createClient({
      url: config.REDIS_URL,
    });
  }

  async initialize(): Promise<void> {
    try {
      const client = await this.pgPool.connect();
      logger.info('PostgreSQL connection established');
      client.release();

      await this.redisClient.connect();
      logger.info('Redis connection established');

      await this.runMigrations();
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      await this.pgPool.end();
      await this.redisClient.quit();
      logger.info('Database connections closed');
    } catch (error) {
      logger.error('Error closing database connections:', error);
    }
  }

  getPostgresPool(): Pool {
    return this.pgPool;
  }

  getRedisClient(): RedisClientType {
    return this.redisClient;
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    const client: PoolClient = await this.pgPool.connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  }

  /**
   * Inserts a new lead into the leads table and returns it.
   */
  async createLead(payload: LeadPayload): Promise<LeadRecord> {
    const {
      source,
      name,
      email,
      phone,
      image_url,
      preferred_channel,
      timezone,
      lead_type,
      urgency_level,
      intent_signals,
      budget_min,
      budget_max,
      location,
      property_type,
      timeline,
      qualification_score,
      status,
      assigned_agent,
    } = payload;

    const result = await this.query(
      `
      INSERT INTO leads (
        source,
        name,
        email,
        phone,
        image_url,
        preferred_channel,
        timezone,
        lead_type,
        urgency_level,
        intent_signals,
        budget_min,
        budget_max,
        location,
        property_type,
        timeline,
        qualification_score,
        status,
        assigned_agent
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING *;
    `,
      [
        source,
        name,
        email,
        phone,
        image_url,
        preferred_channel,
        timezone,
        lead_type,
        urgency_level,
        intent_signals,
        budget_min,
        budget_max,
        location,
        property_type,
        timeline,
        qualification_score,
        status,
        assigned_agent,
      ]
    );

    return result.rows[0] as LeadRecord;
  }

  /**
   * Returns recent leads for dashboard usage.
   */
  async getLeads(limit = 100): Promise<LeadRecord[]> {
    const safeLimit = Math.max(1, Math.min(limit, 500));
    const result = await this.query(
      `
      SELECT *
      FROM leads
      ORDER BY created_at DESC
      LIMIT $1;
      `,
      [safeLimit]
    );

    return result.rows as LeadRecord[];
  }

  async createOrGetSocialSignal(
    payload: SocialSignalPayload
  ): Promise<{ created: boolean; signal: SocialSignalRecord }> {
    const result = await this.query(
      `
      INSERT INTO social_signals (
        network,
        external_id,
        author_handle,
        content,
        post_url,
        intent_score,
        keywords_matched,
        captured_at,
        status,
        lead_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (network, external_id) DO NOTHING
      RETURNING *;
      `,
      [
        payload.network,
        payload.external_id,
        payload.author_handle,
        payload.content,
        payload.post_url,
        payload.intent_score,
        payload.keywords_matched,
        payload.captured_at,
        payload.status || 'pending',
        payload.lead_id || null,
      ]
    );

    if (result.rows.length > 0) {
      return { created: true, signal: result.rows[0] as SocialSignalRecord };
    }

    const existing = await this.query(
      `
      SELECT *
      FROM social_signals
      WHERE network = $1 AND external_id = $2
      LIMIT 1;
      `,
      [payload.network, payload.external_id]
    );

    return { created: false, signal: existing.rows[0] as SocialSignalRecord };
  }

  async attachLeadToSocialSignal(
    signalId: string,
    leadId: string
  ): Promise<SocialSignalRecord | null> {
    const result = await this.query(
      `
      UPDATE social_signals
      SET lead_id = $2
      WHERE id = $1
      RETURNING *;
      `,
      [signalId, leadId]
    );

    return result.rows[0] ? (result.rows[0] as SocialSignalRecord) : null;
  }

  async listSocialSignals(
    limit = 100,
    status?: SocialSignalStatus
  ): Promise<SocialSignalRecord[]> {
    const safeLimit = Math.max(1, Math.min(limit, 500));

    if (status) {
      const result = await this.query(
        `
        SELECT *
        FROM social_signals
        WHERE status = $1
        ORDER BY captured_at DESC
        LIMIT $2;
        `,
        [status, safeLimit]
      );
      return result.rows as SocialSignalRecord[];
    }

    const result = await this.query(
      `
      SELECT *
      FROM social_signals
      ORDER BY captured_at DESC
      LIMIT $1;
      `,
      [safeLimit]
    );

    return result.rows as SocialSignalRecord[];
  }

  async updateSocialSignalStatus(
    signalId: string,
    status: SocialSignalStatus
  ): Promise<SocialSignalRecord | null> {
    const result = await this.query(
      `
      UPDATE social_signals
      SET status = $2
      WHERE id = $1
      RETURNING *;
      `,
      [signalId, status]
    );

    return result.rows[0] ? (result.rows[0] as SocialSignalRecord) : null;
  }

  async getApprovedUnnotifiedSignals(limit = 100): Promise<SocialSignalRecord[]> {
    const safeLimit = Math.max(1, Math.min(limit, 500));
    const result = await this.query(
      `
      SELECT *
      FROM social_signals
      WHERE status = 'approved'
        AND notified_at IS NULL
      ORDER BY captured_at ASC
      LIMIT $1;
      `,
      [safeLimit]
    );

    return result.rows as SocialSignalRecord[];
  }

  async markSocialSignalNotified(signalId: string): Promise<void> {
    await this.query(
      `
      UPDATE social_signals
      SET notified_at = CURRENT_TIMESTAMP
      WHERE id = $1;
      `,
      [signalId]
    );
  }

  private async runMigrations(): Promise<void> {
    try {
      logger.info('Running database migrations...');

      await this.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.query(`
        ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS image_url TEXT;
      `).catch(() => {
        // Ignore if leads table does not exist yet; initial migration will create it.
      });

      await this.query(`
        CREATE TABLE IF NOT EXISTS social_signals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          network VARCHAR(20) NOT NULL CHECK (network IN ('instagram', 'twitter')),
          external_id VARCHAR(255) NOT NULL,
          author_handle VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          post_url TEXT NOT NULL,
          intent_score DECIMAL(5,4) NOT NULL,
          keywords_matched TEXT[] DEFAULT '{}',
          captured_at TIMESTAMP NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
          notified_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(network, external_id)
        );
      `);

      await this.query('CREATE INDEX IF NOT EXISTS idx_social_signals_status ON social_signals(status);');
      await this.query('CREATE INDEX IF NOT EXISTS idx_social_signals_captured_at ON social_signals(captured_at);');
      await this.query('CREATE INDEX IF NOT EXISTS idx_social_signals_notified_at ON social_signals(notified_at);');

      await this.query(`
        DROP TRIGGER IF EXISTS update_social_signals_updated_at ON social_signals;
        CREATE TRIGGER update_social_signals_updated_at
          BEFORE UPDATE ON social_signals
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `).catch(() => {
        // Trigger function may not exist yet during first migration run.
      });

      const migrationName = '001_initial_schema';
      const check = await this.query(
        'SELECT 1 FROM migrations WHERE name = $1',
        [migrationName]
      );

        if (check.rows.length === 0) {
          await this.createInitialSchema();
          await this.query(
            'INSERT INTO migrations (name, executed_at) VALUES ($1, CURRENT_TIMESTAMP)',
            [migrationName]
          );
          logger.info('Initial schema migration completed');
        } else {
          logger.info('Database schema is up to date');
        }
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  private async createInitialSchema(): Promise<void> {
    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');

      // Create leads table
      await client.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          image_url TEXT,
          preferred_channel VARCHAR(20) DEFAULT 'email',
          timezone VARCHAR(50) DEFAULT 'UTC',
          lead_type VARCHAR(20) NOT NULL CHECK (lead_type IN ('hot', 'warm', 'cold')),
          urgency_level INTEGER DEFAULT 1 CHECK (urgency_level BETWEEN 1 AND 10),
          intent_signals TEXT[],
          budget_min INTEGER,
          budget_max INTEGER,
          location VARCHAR(255),
          property_type VARCHAR(100),
          timeline VARCHAR(100),
          qualification_score DECIMAL(3,2) DEFAULT 0.0,
          status VARCHAR(50) DEFAULT 'new',
          assigned_agent VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create interactions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS interactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
          agent_id VARCHAR(100) NOT NULL,
          type VARCHAR(20) NOT NULL CHECK (type IN ('call', 'sms', 'email', 'whatsapp')),
          direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
          content TEXT,
          outcome_status VARCHAR(20) DEFAULT 'pending',
          appointment_booked BOOLEAN DEFAULT FALSE,
          qualification_updated BOOLEAN DEFAULT FALSE,
          escalation_required BOOLEAN DEFAULT FALSE,
          duration_seconds INTEGER,
          sentiment_score DECIMAL(3,2),
          next_action TEXT,
          next_action_scheduled_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create agent_performance table
      await client.query(`
        CREATE TABLE IF NOT EXISTS agent_performance (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_id VARCHAR(100) NOT NULL,
          period_start DATE NOT NULL,
          period_end DATE NOT NULL,
          total_interactions INTEGER DEFAULT 0,
          conversion_rate DECIMAL(5,4) DEFAULT 0.0,
          average_response_time_ms INTEGER DEFAULT 0,
          appointment_booking_rate DECIMAL(5,4) DEFAULT 0.0,
          customer_satisfaction_score DECIMAL(3,2) DEFAULT 0.0,
          script_performance JSONB,
          optimization_suggestions TEXT[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(agent_id, period_start, period_end)
        );
      `);

      // Create audit_logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('lead', 'interaction', 'sync')),
          entity_id VARCHAR(255) NOT NULL,
          action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'sync')),
          changes JSONB NOT NULL,
          user_id VARCHAR(100),
          agent_id VARCHAR(100) NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB DEFAULT '{}'::jsonb
        );
      `);

      // Create social_signals table for social listening approval queue
      await client.query(`
        CREATE TABLE IF NOT EXISTS social_signals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          network VARCHAR(20) NOT NULL CHECK (network IN ('instagram', 'twitter')),
          external_id VARCHAR(255) NOT NULL,
          author_handle VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          post_url TEXT NOT NULL,
          intent_score DECIMAL(5,4) NOT NULL,
          keywords_matched TEXT[] DEFAULT '{}',
          captured_at TIMESTAMP NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
          notified_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(network, external_id)
        );
      `);

      // Indexes for performance
      await client.query('CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(lead_type);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_interactions_lead_id ON interactions(lead_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_interactions_agent_id ON interactions(agent_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_agent_performance_agent_id ON agent_performance(agent_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_agent_performance_period ON agent_performance(period_start, period_end);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_agent_id ON audit_logs(agent_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_social_signals_status ON social_signals(status);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_social_signals_captured_at ON social_signals(captured_at);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_social_signals_notified_at ON social_signals(notified_at);');

      // Trigger to update updated_at on modifications
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      await client.query(`
        DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
        CREATE TRIGGER update_leads_updated_at
          BEFORE UPDATE ON leads
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);

      await client.query(`
        DROP TRIGGER IF EXISTS update_social_signals_updated_at ON social_signals;
        CREATE TRIGGER update_social_signals_updated_at
          BEFORE UPDATE ON social_signals
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);

      await client.query('COMMIT');
      logger.info('Database schema created successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Schema creation failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
