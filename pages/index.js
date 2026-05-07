import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function Home() {
  const [leadCount, setLeadCount] = useState('...');

  useEffect(() => {
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

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    fetch(`${apiBaseUrl}/api/leads`)
      .then((res) => res.json())
      .then((payload) => {
        const leads = Array.isArray(payload) ? payload : payload.leads || [];
        setLeadCount(String(leads.length));
      })
      .catch(() => setLeadCount('0'));

  }, []);

  return (
    <>
      <Head>
        <title>Leads Exemplo | Phantom UI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="stylesheet" href="/phantom/assets/css/main.css" />
        <noscript>
          <link rel="stylesheet" href="/phantom/assets/css/noscript.css" />
        </noscript>
        <style>{`
          .tiles .tile-card {
            min-height: 18rem;
            border-radius: 0.5rem;
            overflow: hidden;
          }

          .tiles .tile-card > a {
            background: transparent !important;
          }

          .tiles .tile-card .image {
            display: none;
          }

          .tiles .tile-card > a > h2 {
            position: absolute;
            top: 1rem;
            left: 1rem;
            right: 1rem;
            z-index: 3;
            margin: 0;
            padding: 0.65rem 0.85rem;
            font-size: 1rem;
            line-height: 1.35;
            letter-spacing: 0.08em;
            border-radius: 0.35rem;
            background: rgba(0, 0, 0, 0.35);
            color: #fff !important;
            text-shadow: none;
          }

          .tiles .tile-card .content {
            opacity: 1 !important;
            z-index: 2;
          }

          .tiles .tile-card .content p {
            color: #fff !important;
            margin-top: 6.5rem;
            padding: 0 1rem 1rem;
            font-size: 0.95rem;
            line-height: 1.45;
          }

          .tiles .tile-routing { background: linear-gradient(135deg, #2d5bff, #51b4ff); }
          .tiles .tile-optimization { background: linear-gradient(135deg, #0f9d58, #6fd46f); }
          .tiles .tile-multichannel { background: linear-gradient(135deg, #7a3cff, #cf5eff); }
          .tiles .tile-crm { background: linear-gradient(135deg, #ef6c00, #ffb74d); }
          .tiles .tile-agents { background: linear-gradient(135deg, #c2185b, #ff5f8a); }
          .tiles .tile-social { background: linear-gradient(135deg, #00695c, #26c6a1); }
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
                <li>
                  <a href="#menu">Menu</a>
                </li>
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
            <header>
              <h1>
                Painel comercial com visual Phantom integrado ao Leads Exemplo.
              </h1>
              <p>
                Front-end responsivo em HTML5UP, com CSS/JS do template e consumo real da API.
                Total de leads no banco agora: <strong>{leadCount}</strong>.
              </p>
            </header>

            <section className="tiles">
              <article className="style1 tile-card tile-routing">
                <a href="/solucoes/roteamento-inteligente">
                  <h2>Roteamento Inteligente</h2>
                  <div className="content"><p>O Agente Principal de IA analisa e direciona leads para fluxos de trabalho especializados.</p></div>
                </a>
              </article>

              <article className="style2 tile-card tile-optimization">
                <a href="/solucoes/otimizacao-continua">
                  <h2>Otimização Contínua</h2>
                  <div className="content"><p>O sistema aprende e melhora as taxas de conversão automaticamente.</p></div>
                </a>
              </article>

              <article className="style3 tile-card tile-multichannel">
                <a href="/solucoes/comunicacao-multicanal">
                  <h2>Comunicação multicanal</h2>
                  <div className="content"><p>Integração de voz, SMS, e-mail e WhatsApp.</p></div>
                </a>
              </article>

              <article className="style4 tile-card tile-crm">
                <a href="/solucoes/integracao-crm">
                  <h2>Integração profunda com CRM</h2>
                  <div className="content"><p>Sincronização GoHighLevel em tempo real.</p></div>
                </a>
              </article>

              <article className="style5 tile-card tile-agents">
                <a href="/solucoes/agentes-ia-especializados">
                  <h2>Agentes de IA especializados</h2>
                  <div className="content"><p>Cada agente lida com aspectos específicos da jornada do cliente.</p></div>
                </a>
              </article>

              <article className="style6 tile-card tile-social">
                <a href="/solucoes/social-listening">
                  <h2>Social Listening</h2>
                  <div className="content"><p>Captura sinais de intenção no Instagram e Twitter, deduplica e cria leads automaticamente com fila de aprovação.</p></div>
                </a>
              </article>
            </section>

            <ul className="actions" style={{ marginTop: '2rem' }}>
              <li><a href="/leads" className="button primary">Ver Leads</a></li>
              <li><a href="/schedule" className="button">Agendar Visita</a></li>
              <li><a href="/frontend" className="button">Sub-página Frontend</a></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}