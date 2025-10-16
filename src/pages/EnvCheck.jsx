// src/pages/EnvCheck.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function EnvCheck() {
  const [result, setResult] = useState('⏳ Test en cours…');

  // Vite injecte ces valeurs AU BUILD
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    (async () => {
      try {
        const { count, error } = await supabase
          .from('trainers')
          .select('*', { count: 'exact', head: true });

        if (error) setResult(`❌ Requête Supabase en échec : ${error.message}`);
        else setResult(`✅ Requête OK. Lignes dans "trainers" : ${count}`);
      } catch (e) {
        setResult(`❌ Exception : ${e.message}`);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 16, display: 'grid', gap: 12, maxWidth: 900 }}>
      <h2>Diagnostic variables & Supabase (build prod)</h2>

      <div>
        <strong>VITE_SUPABASE_URL</strong> : <code>{url || '(absent dans la build)'}</code>
      </div>
      <div>
        <strong>VITE_SUPABASE_ANON_KEY</strong> :{' '}
        <code>{anon ? anon.slice(0, 8) + '…' + anon.slice(-8) : '(absent dans la build)'}</code>
      </div>

      <div style={{ whiteSpace: 'pre-wrap', background: '#f6f8fa', padding: 12, borderRadius: 8 }}>
        {result}
      </div>

      <div style={{ opacity: 0.7, fontSize: 13 }}>
        Si les 2 variables sont “absent”, Vercel n’a pas injecté les variables d’environnement au build.
        Vérifie les clés <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code>, puis redeploie.
      </div>
    </div>
  );
}
