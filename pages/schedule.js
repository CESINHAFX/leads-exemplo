import { useEffect } from 'react';
import Head from 'next/head';

export default function Schedule() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cal.com/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Agendar Visita | Imobiliaria</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">Agende sua Visita</h1>

      <div
        data-cal-link={process.env.NEXT_PUBLIC_CALCOM_URL || 'yourusername/30min'}
        data-cal-config='{"layout":"month_view"}'
        style={{ width: '100%', height: '600px', overflow: 'hidden' }}
      />
    </div>
  );
}