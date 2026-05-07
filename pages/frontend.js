import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';

export default function FrontendPage() {
  const [status, setStatus] = useState('Verificando...');
  const contentAreaRef = useRef(null);

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

    const carregarPagina = async (url) => {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Falha HTTP ${response.status}`);
        }

        const html = await response.text();
        if (contentAreaRef.current) {
          contentAreaRef.current.innerHTML = html;
        }
      } catch (error) {
        console.error('Erro ao carregar fragmento:', error);
        if (contentAreaRef.current) {
          contentAreaRef.current.innerHTML = '<p>Erro ao carregar a pagina.</p>';
        }
      }
    };

    const nav = document.getElementById('async-nav');
    const onNavClick = (event) => {
      const link = event.target.closest('a[data-fragment="true"]');
      if (!link) {
        return;
      }

      event.preventDefault();
      const fragmentUrl = link.getAttribute('href');
      if (fragmentUrl) {
        carregarPagina(fragmentUrl);
      }
    };

    nav?.addEventListener('click', onNavClick);
    carregarPagina('/phantom/fragments/overview.html');

    fetch('/')
      .then((res) => setStatus(res.ok ? 'Online (200)' : `Indisponivel (${res.status})`))
      .catch(() => setStatus('Indisponivel'));

    return () => {
      nav?.removeEventListener('click', onNavClick);
      document.body.classList.remove('is-preload');
    };
  }, []);

  return (
    <>
      <Head>
        <title>Frontend | Leads Exemplo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="stylesheet" href="/phantom/assets/css/main.css" />
        <noscript>
          <link rel="stylesheet" href="/phantom/assets/css/noscript.css" />
        </noscript>
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
            <h1>Sub-página Frontend</h1>
            <p>Carregamento assincrono com reaproveitamento de header e footer.</p>
            <p>Status atual do frontend: <strong>{status}</strong></p>

            <nav>
              <ul id="async-nav" className="actions">
                <li><a data-fragment="true" href="/phantom/fragments/overview.html" className="button primary">Visao Geral</a></li>
                <li><a data-fragment="true" href="/phantom/fragments/components.html" className="button">Componentes</a></li>
                <li><a data-fragment="true" href="/phantom/fragments/performance.html" className="button">Performance</a></li>
                <li><a data-fragment="true" href="/phantom/fragments/errors.html" className="button">Erros</a></li>
              </ul>
            </nav>

            <main id="content-area" ref={contentAreaRef} />

            <ul className="actions">
              <li><a href="http://localhost:8010/" className="button primary">Abrir Frontend</a></li>
              <li><a href="/" className="button">Voltar para Home</a></li>
            </ul>
          </div>
        </div>

        <footer id="footer">
          <div className="inner">
            <ul className="copyright">
              <li>Leads Exemplo</li>
              <li>Frontend assíncrono com Phantom</li>
            </ul>
          </div>
        </footer>
      </div>
    </>
  );
}
