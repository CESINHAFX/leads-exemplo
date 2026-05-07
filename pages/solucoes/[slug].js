import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const SOLUCOES = {
  'roteamento-inteligente': {
    titulo: 'Roteamento Inteligente',
    descricao:
      'O Agente Principal de IA analisa cada lead e direciona para o fluxo de trabalho mais adequado com base em urgencia, intencao e perfil.',
    imagem: '/phantom/images/pic06.jpg',
  },
  'otimizacao-continua': {
    titulo: 'Otimização Contínua',
    descricao:
      'O sistema aprende com os resultados, ajusta estratégias e melhora taxas de conversão automaticamente ao longo do tempo.',
    imagem: '/phantom/images/pic07.jpg',
  },
  'comunicacao-multicanal': {
    titulo: 'Comunicação multicanal',
    descricao:
      'Integração de voz, SMS, e-mail e WhatsApp para aumentar resposta, continuidade e contexto em toda a jornada do lead.',
    imagem: '/phantom/images/pic08.jpg',
  },
  'integracao-crm': {
    titulo: 'Integração profunda com CRM',
    descricao:
      'Sincronização com CRM configurável (incluindo opções gratuitas) para manter estágios, histórico de contato e dados estratégicos sempre atualizados.',
    imagem: '/phantom/images/pic09.jpg',
  },
  'agentes-ia-especializados': {
    titulo: 'Agentes de IA especializados',
    descricao:
      'Cada agente atua em uma etapa da jornada do cliente, com responsabilidades claras e execução coordenada.',
    imagem: '/phantom/images/pic10.jpg',
  },
  'social-listening': {
    titulo: 'Social Listening',
    descricao:
      'Captura automática de sinais de intenção no Instagram e Twitter, com deduplicação, criação de leads e fila de aprovação manual antes de notificar equipe via Slack/Telegram.',
    imagem: '/phantom/images/pic11.jpg',
  },
};

const EXPLICACOES_FLUXO = {
  'roteamento-inteligente': {
    resumo:
      'Este fluxo decide automaticamente quem atende cada lead para reduzir tempo de resposta e aumentar conversão.',
    etapas: [
      'Lead entra por formulário, campanha ou indicação.',
      'Agente Chefe de IA avalia urgência, intenção e perfil.',
      'Sistema classifica prioridade e rota para o agente certo.',
      'Ação inicial é disparada (contato imediato, nutrição ou follow-up).',
    ],
    ferramentas: ['Node.js + TypeScript', 'Motor de regras de IA', 'PostgreSQL + Redis'],
  },
  'otimizacao-continua': {
    resumo:
      'Este fluxo mede resultados e melhora automaticamente regras, mensagens e tempos de contato.',
    etapas: [
      'Interações são registradas com status e desfecho.',
      'Agente de Análise calcula métricas de desempenho.',
      'Gargalos e oportunidades viram sugestões de ajuste.',
      'Regras otimizadas retornam para operação contínua.',
    ],
    ferramentas: ['Vitest (qualidade)', 'Analytics Agent', 'Redis (apoio operacional)'],
    destaquesSolicitados: {
      titulo: 'Motor de Otimização',
      itens: [
        'Análise de desempenho: taxas de conversão, eficácia do script e otimização de tempo.',
        'Ajustes automáticos: regras de roteamento e scripts de agentes com autoaperfeiçoamento.',
        'Testes A/B: otimização contínua de mensagens e horários.',
      ],
    },
    codigoPronto: [
      'AICustomerAnalyticsAgent.analyzeScriptPerformance (eficácia de scripts).',
      'AICustomerAnalyticsAgent.generateIntelligenceReport (insights para decisão).',
      'ContinuousOptimizationLoop.runOptimizationCycle (otimização contínua).',
      'ContinuousOptimizationLoop.generateRoutingOptimizations e generateTimingOptimizations (ajustes automáticos).',
      'AILeadGenerationAgent.executeCampaign com ABTestConfig (testes A/B).',
    ],
  },
  'comunicacao-multicanal': {
    resumo:
      'Este fluxo mantém contexto de conversa entre canais para não perder histórico e garantir continuidade.',
    etapas: [
      'Contato é iniciado pelo canal preferido do lead.',
      'Se não houver resposta, o sistema alterna para outro canal.',
      'Mensagens seguem sequência com personalização.',
      'Resposta do lead atualiza próximo passo automaticamente.',
    ],
    ferramentas: ['Email/SMS/WhatsApp', 'Evolution API (WhatsApp)', 'Orquestração por regras'],
    destaquesSolicitados: {
      titulo: 'Fluxos de trabalho de saída',
      itens: [
        'Acompanhamento de leads frios: sequências personalizadas para leads que não respondem.',
        'Divulgação de campanhas: promoção automatizada e marketing de eventos.',
        'Reengajamento de leads qualificados: acompanhamento contextualizado com base no histórico.',
      ],
    },
    codigoPronto: [
      'AILeadGenerationAgent.processColdLeads (sequências para leads frios).',
      'AILeadGenerationAgent.executeCampaign (divulgação e promoção de campanhas).',
      'AILeadGenerationAgent.processWarmLeads (reengajamento contextualizado).',
      'CustomerRetentionAgent.detectInactiveCustomers e executeNextCampaignStep (follow-up automatizado).',
    ],
  },
  'integracao-crm': {
    resumo:
      'Este fluxo centraliza dados de leads e interações em um CRM para gestão de pipeline e visão comercial.',
    etapas: [
      'Lead é criado ou atualizado no CRM conforme atividade.',
      'Interações ficam vinculadas ao contato correspondente.',
      'Mudanças de status atualizam funil e histórico.',
      'Equipe visualiza pipeline com base em dados consistentes.',
    ],
    ferramentas: ['CRM Provider Interface', 'FreeCRMClient (EspoCRM/SuiteCRM)', 'n8n (automações)'],
  },
  'social-listening': {
    resumo:
      'Este fluxo monitora redes sociais em busca de sinais de compra ou interesse real, converte-os em leads qualificados e avisa o time comercial apenas após aprovação.',
    etapas: [
      'Sistema busca hashtags e mentions relevantes no Instagram e Twitter a cada ciclo configurado.',
      'Sinal capturado é deduplicado por rede + ID externo (sem duplicatas no banco).',
      'Lead é criado automaticamente no banco com score inicial calculado.',
      'Sinal aguarda aprovação manual na fila (ou é auto-aprovado se regra permitir).',
      'Após aprovação, alerta é enviado ao time via Slack e/ou Telegram com contexto completo.',
    ],
    ferramentas: [
      'Meta Graph API v20.0 (Instagram)',
      'Twitter API v2',
      'PostgreSQL (deduplicação por UNIQUE constraint)',
      'Slack Incoming Webhooks',
      'Telegram Bot API',
    ],
    destaquesSolicitados: {
      titulo: 'Diferenciais do Social Listening',
      itens: [
        'Captura passiva: monitora redes sem envio de DMs ou ações invasivas.',
        'Deduplicação automática: o mesmo post nunca vira dois leads.',
        'Fila de aprovação: operador valida sinal antes do alerta ser disparado.',
        'Endpoints REST internos: listar sinais, mudar status e disparar notificações aprovadas.',
        'Configuração total por variáveis de ambiente (SOCIAL_REQUIRE_MANUAL_APPROVAL, intervalos, hashtags).',
      ],
    },
    codigoPronto: [
      'SocialListeningService.captureSignal — deduplicação + criação de lead.',
      'SocialListeningService.runCycle — coleta Instagram + Twitter + disparo de aprovadas.',
      'SocialListeningService.dispatchApprovedSignals — notifica Slack/Telegram apenas sinais aprovados.',
      'DatabaseManager.createOrGetSocialSignal — upsert com ON CONFLICT (network, external_id).',
      'GET /api/social-signals — lista sinais com filtro por status.',
      'PATCH /api/social-signals/:id/status — aprova, rejeita ou deixa pendente.',
      'POST /api/social-signals/dispatch-approved — dispara alertas dos aprovados sob demanda.',
    ],
  },
  'agentes-ia-especializados': {
    resumo:
      'Este fluxo distribui tarefas entre agentes por especialidade para acelerar atendimento e manter qualidade.',
    etapas: [
      'Agente Chefe define objetivo de negócio.',
      'Agente Chefe de IA quebra o objetivo em tarefas.',
      'Agentes especialistas executam cada etapa do funil.',
      'Resultados retornam para análise e nova priorização.',
    ],
    ferramentas: ['Agente Chefe', 'Agente Chefe de IA', 'Agentes Especializados por domínio'],
    destaquesSolicitados: {
      titulo: 'Painéis, Alertas e Métricas',
      itens: [
        'Painéis de controle em tempo real: desempenho do agente e integridade do sistema.',
        'Alertas automatizados: notificações de falhas críticas.',
        'Métricas de desempenho: rastreamento de conversões e insights de otimização.',
      ],
    },
    codigoPronto: [
      'ChiefAgent.getDashboardMetrics (painéis em tempo real).',
      'ChiefAgent.checkAgentAlerts e addSystemAlert (alertas automáticos).',
      'ChiefAgent.getSystemHealthScore (integridade operacional).',
      'ChiefAgent.calculateConversionRateToday e getAppointmentsBookedToday (métricas de desempenho).',
    ],
  },
};

export default function SolucaoPage() {
  const router = useRouter();
  const slug = router.query.slug;
  const solucao = typeof slug === 'string' ? SOLUCOES[slug] : null;
  const explicacao = typeof slug === 'string' ? EXPLICACOES_FLUXO[slug] : null;
  const isAgentesEspecializados = slug === 'agentes-ia-especializados';

  useEffect(() => {
    document.body.classList.add('is-preload');

    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-phantom-src="${src}"]`);
        if (existing) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.dataset.phantomSrc = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
        document.body.appendChild(script);
      });

    (async () => {
      try {
        await loadScript('/phantom/assets/js/jquery.min.js');
        await loadScript('/phantom/assets/js/browser.min.js');
        await loadScript('/phantom/assets/js/breakpoints.min.js');
        await loadScript('/phantom/assets/js/util.js');
        await loadScript('/phantom/assets/js/main.js');
      } catch (error) {
        console.error('Erro ao carregar scripts do template Phantom:', error);
      }
    })();

    return () => {
      document.body.classList.remove('is-preload');
    };
  }, []);

  if (!solucao) {
    return (
      <>
        <Head>
          <title>Solução não encontrada | Leads Exemplo</title>
          <link rel="stylesheet" href="/phantom/assets/css/main.css" />
        </Head>
        <div style={{ padding: '3rem' }}>
          <h1>Solução não encontrada</h1>
          <p>Verifique o link e tente novamente.</p>
          <a href="/" className="button primary">Voltar para Home</a>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{solucao.titulo} | Leads Exemplo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="stylesheet" href="/phantom/assets/css/main.css" />
        <noscript>
          <link rel="stylesheet" href="/phantom/assets/css/noscript.css" />
        </noscript>
        <style>{`
          .decision-tree {
            margin-top: 2rem;
            padding: 1.5rem;
            border: 1px solid rgba(88, 88, 88, 0.2);
            border-radius: 0.5rem;
            background: linear-gradient(180deg, rgba(245, 247, 250, 0.85), #ffffff);
          }

          .decision-tree h2 {
            margin-bottom: 1rem;
          }

          .tree-level {
            margin-top: 1.25rem;
            padding-left: 1rem;
            border-left: 3px solid rgba(18, 130, 162, 0.25);
          }

          .tree-node {
            margin-bottom: 0.85rem;
            padding: 0.75rem 0.9rem;
            border-radius: 0.45rem;
            background: #ffffff;
            border: 1px solid rgba(88, 88, 88, 0.2);
          }

          .tree-node strong {
            display: block;
            margin-bottom: 0.25rem;
            color: #1f2933;
          }

          .dispatch-rules {
            margin-top: 1.25rem;
            padding: 1rem;
            border-radius: 0.45rem;
            background: #f8fafc;
            border: 1px dashed rgba(18, 130, 162, 0.4);
          }

          .dispatch-rules p {
            margin-bottom: 0.5rem;
          }

          .dispatch-rules ul {
            margin: 0;
          }

          .client-flow {
            margin-top: 2rem;
            padding: 1.5rem;
            border: 1px solid rgba(88, 88, 88, 0.2);
            border-radius: 0.5rem;
            background: #ffffff;
          }

          .client-flow h2 {
            margin-bottom: 0.75rem;
          }

          .client-flow p {
            margin-bottom: 1rem;
          }

          .client-flow ol {
            margin-bottom: 1rem;
          }

          .tool-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .tool-badge {
            font-size: 0.85rem;
            border: 1px solid rgba(88, 88, 88, 0.25);
            border-radius: 999px;
            padding: 0.35rem 0.65rem;
            background: #f8fafc;
          }

          .requested-highlights {
            margin-top: 1.25rem;
            padding: 1rem;
            border-radius: 0.45rem;
            background: #f8fafc;
            border: 1px solid rgba(88, 88, 88, 0.2);
          }

          .requested-highlights h3 {
            margin-bottom: 0.5rem;
          }

          .repo-code {
            margin-top: 1rem;
            padding: 1rem;
            border-radius: 0.45rem;
            background: #fff;
            border: 1px dashed rgba(18, 130, 162, 0.35);
          }

          .repo-code h3 {
            margin-bottom: 0.5rem;
          }

          .repo-code ul {
            margin: 0;
          }
        `}</style>
      </Head>

      <div id="wrapper">
        <header id="header">
          <div className="inner">
            <a href="/" className="logo">
              <span className="symbol">
                <img src="/phantom/images/logo.svg" alt="Logo" />
              </span>
              <span className="title">Leads Exemplo</span>
            </a>
            <nav>
              <ul>
                <li><a href="#menu">Menu</a></li>
              </ul>
            </nav>
          </div>
        </header>

        <nav id="menu">
          <h2>Menu</h2>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/frontend">Frontend</a></li>
            <li><a href="/leads">Leads</a></li>
            <li><a href="/schedule">Agendar Visita</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
          </ul>
        </nav>

        <div id="main">
          <div className="inner">
            <h1>{solucao.titulo}</h1>
            <span className="image main">
              <img src={solucao.imagem} alt={solucao.titulo} />
            </span>
            <p>{solucao.descricao}</p>

            {explicacao && (
              <section className="client-flow">
                <h2>Como funciona na prática</h2>
                <p>{explicacao.resumo}</p>

                <h3>Fluxo para o cliente entender</h3>
                <ol>
                  {explicacao.etapas.map((etapa) => (
                    <li key={etapa}>{etapa}</li>
                  ))}
                </ol>

                <h3>Ferramentas envolvidas</h3>
                <div className="tool-badges">
                  {explicacao.ferramentas.map((ferramenta) => (
                    <span key={ferramenta} className="tool-badge">{ferramenta}</span>
                  ))}
                </div>

                {explicacao.destaquesSolicitados && (
                  <div className="requested-highlights">
                    <h3>{explicacao.destaquesSolicitados.titulo}</h3>
                    <ul>
                      {explicacao.destaquesSolicitados.itens.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {explicacao.codigoPronto && (
                  <div className="repo-code">
                    <h3>Código já pronto no repositório</h3>
                    <ul>
                      {explicacao.codigoPronto.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {isAgentesEspecializados && (
              <section className="decision-tree">
                <h2>Árvore de decisão - Estrutura de comando</h2>

                <div className="tree-level">
                  <div className="tree-node">
                    <strong>1. Agente Chefe</strong>
                    Supervisor do sistema e interface humana. Define metas, políticas e prioridades estratégicas.
                  </div>
                </div>

                <div className="tree-level">
                  <div className="tree-node">
                    <strong>2. Agente Chefe de IA</strong>
                    Gerente operacional e despachante principal. Recebe objetivos do Agente Chefe e distribui tarefas.
                  </div>
                </div>

                <div className="tree-level">
                  <div className="tree-node">
                    <strong>3. Agentes Especializados</strong>
                    Execução tática por domínio:
                  </div>

                  <div className="tree-node">
                    <strong>Assistente de Vendas Virtual</strong>
                    Qualificação de voz e agendamento de consultas.
                  </div>

                  <div className="tree-node">
                    <strong>Agente de Retenção de Clientes</strong>
                    Reengajamento de clientes inativos.
                  </div>

                  <div className="tree-node">
                    <strong>Coletor de Avaliações e Feedback</strong>
                    Gestão de feedback e reputação pós-venda.
                  </div>

                  <div className="tree-node">
                    <strong>Agente de Geração de Leads</strong>
                    Prospecção de leads frios e quentes.
                  </div>

                  <div className="tree-node">
                    <strong>Coordenador(a) de Agendamentos</strong>
                    Gestão complexa de fluxos de trabalho e reservas.
                  </div>

                  <div className="tree-node">
                    <strong>Agente de gerenciamento de CRM</strong>
                    Sincronização de dados e gerenciamento de pipelines.
                  </div>

                  <div className="tree-node">
                    <strong>Agente de Análise de Clientes</strong>
                    Insights para rastreamento e otimização de desempenho.
                  </div>
                </div>

                <div className="dispatch-rules">
                  <p><strong>Lógica de decisão operacional:</strong></p>
                  <ul>
                    <li>Se o objetivo for estratégico, o Agente Chefe prioriza e envia ao Agente Chefe de IA.</li>
                    <li>Se a demanda for de execução, o Agente Chefe de IA roteia para o especialista correto.</li>
                    <li>Se uma tarefa exigir múltiplas etapas, o Agente Chefe de IA orquestra especialistas em sequência.</li>
                    <li>Se houver conflito de prioridade, o Agente Chefe redefine a ordem e publica nova diretriz.</li>
                  </ul>
                </div>
              </section>
            )}

            <ul className="actions">
              <li><a href="/" className="button primary">Voltar para Home</a></li>
              <li><a href="/leads" className="button">Abrir Leads</a></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
