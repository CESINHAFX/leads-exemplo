import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Lead, LeadModel, CreateLead } from '../../types/lead';
import { Interaction, InteractionModel } from '../../types/interaction';
import { AIHeadAgent } from '../ai-head-agent';
import { ChiefAgent } from '../chief-agent';
import { VirtualSalesAssistant } from '../virtual-sales-assistant';
import { CustomerRetentionAgent } from '../customer-retention-agent';
import { ReviewFeedbackCollectorAgent } from '../review-feedback-collector';
import { AILeadGenerationAgent, Campaign } from '../ai-lead-generation-agent';
import { AIAppointmentWorkflowCoordinator } from '../ai-appointment-workflow-coordinator';
import { AICRMManagementAgent } from '../ai-crm-management-agent';
import { AICustomerAnalyticsAgent } from '../ai-customer-analytics-agent';
import { DatabaseManager } from '../../database/manager';
import { GoHighLevelClient } from '../../integrations/gohighlevel/client';

vi.mock('../../database/manager');
vi.mock('../../integrations/gohighlevel/client');
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const baseLeadInput: CreateLead = {
  source: 'website',
  contactInfo: {
    name: 'Cliente Demo',
    email: 'cliente.demo@example.com',
    phone: '+15551234567',
    preferredChannel: 'email',
    timezone: 'UTC',
  },
  leadType: 'warm',
  urgencyLevel: 6,
  intentSignals: ['form_submission'],
  qualificationData: {
    qualificationScore: 0.65,
    location: 'Sao Paulo',
    propertyType: 'Apartamento',
    budget: { min: 350000, max: 700000 },
  },
  status: 'qualified',
};

function makeLead(overrides: Partial<CreateLead> = {}): Lead {
  return LeadModel.create({
    ...baseLeadInput,
    ...overrides,
    contactInfo: {
      ...baseLeadInput.contactInfo,
      ...(overrides.contactInfo || {}),
    },
    qualificationData: {
      ...baseLeadInput.qualificationData,
      ...(overrides.qualificationData || {}),
    },
    intentSignals: overrides.intentSignals || baseLeadInput.intentSignals,
  }).data;
}

function makeInteraction(leadId: string, content: string): Interaction {
  return InteractionModel.create({
    leadId,
    agentId: 'demo-agent',
    type: 'email',
    direction: 'outbound',
    content,
    outcome: {
      status: 'successful',
      appointmentBooked: false,
      qualificationUpdated: false,
      escalationRequired: false,
    },
  }).data;
}

describe('Demo prático para cliente - agentes especializados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Agente Chefe + Agente Chefe de IA: roteia lead e monitora status operacional', async () => {
    const aiHead = new AIHeadAgent();
    const chief = new ChiefAgent(aiHead);
    const lead = makeLead({
      leadType: 'hot',
      urgencyLevel: 9,
      intentSignals: ['requested_callback', 'form_submission'],
      status: 'new',
      contactInfo: {
        ...baseLeadInput.contactInfo,
        preferredChannel: 'voice',
      },
    });

    const analysis = await aiHead.analyzeLead(lead);
    const dashboard = chief.getDashboardMetrics();

    expect(analysis.routingRecommendation.targetAgent).toBe('inbound');
    expect(analysis.routingRecommendation.priority).toBe('high');
    expect(dashboard.totalAgents).toBe(5);
  });

  it('Assistente de Vendas Virtual: inicia chamada e avanca qualificacao', async () => {
    const assistant = new VirtualSalesAssistant({
      voiceAI: {
        provider: 'elevenlabs',
        apiKey: 'test-key',
        language: 'pt-BR',
      },
    });
    const lead = makeLead({
      leadType: 'hot',
      urgencyLevel: 9,
      status: 'new',
      contactInfo: {
        ...baseLeadInput.contactInfo,
        preferredChannel: 'voice',
      },
    });

    const session = await assistant.initiateCall(lead);
    await assistant.processCustomerResponse(
      session.id,
      'Tenho interesse, meu orcamento e 500 mil e quero decidir em 30 dias.'
    );
    const updatedSession = assistant.getSession(session.id);

    expect(updatedSession?.status).toBe('active');
    expect((updatedSession?.transcript.length || 0)).toBeGreaterThan(1);
  });

  it('Agente de Retencao: detecta inatividade e dispara campanha de reengajamento', async () => {
    const retention = new CustomerRetentionAgent();
    const lead = makeLead({
      leadType: 'warm',
      status: 'qualified',
      qualificationData: {
        ...baseLeadInput.qualificationData,
        qualificationScore: 0.8,
      },
    });

    const oldInteraction = makeInteraction(
      lead.id,
      'Ultimo contato feito ha bastante tempo.'
    );
    oldInteraction.timestamp = new Date(
      Date.now() - 70 * 24 * 60 * 60 * 1000
    );

    const sessions = await retention.detectInactiveCustomers(
      [lead],
      new Map([[lead.id, [oldInteraction]]])
    );

    expect(sessions.length).toBe(1);
    expect(retention.getActiveSessions().length).toBe(1);
  });

  it('Coletor de Avaliacoes e Feedback: coleta resposta e classifica como review positivo', async () => {
    const collector = new ReviewFeedbackCollectorAgent();
    const lead = makeLead({
      status: 'converted',
      leadType: 'hot',
    });

    const sessions = await collector.detectCompletedProjects(
      [lead],
      new Map([[lead.id, []]])
    );
    const analysis = await collector.handleFeedbackResponse(
      lead.id,
      'Excellent service, very professional and friendly team, I am happy and will recommend you.',
      'email'
    );

    expect(sessions.length).toBe(1);
    expect(analysis.reviewWorthy).toBe(true);
    expect(collector.getSession(sessions[0].id)?.feedbackReceived).toBe(true);
  });

  it('Agente de Geracao de Leads: executa campanha e inicia sequencias de outreach', async () => {
    const leadGeneration = new AILeadGenerationAgent('demo-lead-generation');
    const lead = makeLead({
      leadType: 'cold',
      status: 'contacted',
      intentSignals: [],
    });

    const campaign: Campaign = {
      id: 'campaign-demo',
      name: 'Campanha Demo Cliente',
      type: 'promotional',
      status: 'active',
      targetAudience: {
        id: 'audience-demo',
        name: 'Todos os leads de demonstracao',
        criteria: {},
        leadIds: [],
        size: 0,
      },
      messageTemplates: [
        {
          id: 'template-demo',
          name: 'Mensagem Inicial',
          channel: 'email',
          subject: 'Oferta personalizada',
          content: 'Oi {{name}}, temos opcoes para {{location}}.',
          personalizationFields: ['name', 'location'],
        },
      ],
      schedule: {
        startDate: new Date(),
        frequency: 'immediate',
        timezone: 'UTC',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const performance = await leadGeneration.executeCampaign(campaign, [lead]);

    expect(performance.campaignId).toBe('campaign-demo');
    expect(performance.totalSent).toBeGreaterThanOrEqual(1);
  });

  it('Coordenador(a) de Agendamentos: cria campanha e executa etapa de callback', async () => {
    const coordinator = new AIAppointmentWorkflowCoordinator('demo-coordinator');
    const lead = makeLead({ status: 'qualified' });

    const campaign = await coordinator.createCampaign(
      'Fluxo de agendamento demo',
      'callback_sequence',
      {
        leadTypes: ['hot', 'warm', 'cold'],
        sources: ['website', 'meta_ads', 'gmail'],
      },
      [
        {
          order: 1,
          type: 'callback',
          delayHours: 0,
          content: 'Retornar contato em ate 1 hora',
        },
      ]
    );

    const executed = await coordinator.executeCampaignStep(
      campaign.id,
      lead.id,
      campaign.steps[0].id
    );

    expect(executed).toBe(true);
  });

  it('Agente de gerenciamento de CRM: registra interacao e confirma sincronizacao', async () => {
    const dbManager = new DatabaseManager() as any;
    const ghlClient = new GoHighLevelClient({ apiKey: 'demo-key' } as any) as any;
    const crm = new AICRMManagementAgent(dbManager, ghlClient, {
      syncTimeoutMs: 5000,
    });
    const lead = makeLead();
    const interaction = makeInteraction(lead.id, 'Contato inicial registrado no CRM.');

    vi.spyOn(crm as any, 'performInteractionSync').mockResolvedValue({
      success: true,
      contactId: lead.id,
      syncTime: 12,
    });
    vi.spyOn(crm as any, 'createAuditLog').mockResolvedValue(undefined);

    const result = await crm.logInteraction(interaction);

    expect(result.success).toBe(true);
    expect(result.contactId).toBe(lead.id);
    expect(result.syncTime).toBeLessThan(5000);
  });

  it('Agente de Analise de Clientes: gera dashboard e insights acionaveis', async () => {
    const analytics = new AICustomerAnalyticsAgent({} as DatabaseManager);

    const dashboard = await analytics.getDashboardData();
    const insights = await analytics.generateIntelligenceReport();

    expect(dashboard.overview.totalInteractions).toBeGreaterThan(0);
    expect(dashboard.leadSourceAnalysis.length).toBeGreaterThan(0);
    expect(insights.length).toBeGreaterThan(0);
  });
});