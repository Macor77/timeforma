// src/pages/MigrateLocal.jsx
import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Helpers
function toArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean).map((s) => String(s).trim());
  if (v == null || v === '') return [];
  return String(v)
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function nz(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}
function numOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function MigrateLocal() {
  const [log, setLog] = useState('');
  const [running, setRunning] = useState(false);

  // 1) Lire l'ancien localStorage (clé "formateurs")
  const localItems = useMemo(() => {
    try {
      const raw = localStorage.getItem('formateurs');
      const arr = JSON.parse(raw || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, []);

  const preview = localItems.slice(0, 3);

  async function migrate() {
    if (running) return;
    if (!localItems.length) {
      alert("Aucune donnée trouvée dans localStorage sous la clé 'formateurs'.");
      return;
    }
    if (!confirm(`Migrer ${localItems.length} formateurs vers Supabase ?`)) return;

    setRunning(true);
    setLog('🔄 Démarrage…\n');

    // 2) Mapper vers le schéma Supabase
    const rows = localItems.map((f) => ({
      // champs DB (snake_case)
      prenom: nz(f.prenom),
      nom: nz(f.nom),
      ville: nz(f.ville),
      code_postal: nz(f.codePostal ?? f.code_postal ?? f.cp),
      competences: toArray(f.competences),
      materiel: toArray(f.materiel),
      statut: nz(f.statut) || 'Inactif',
      telephone: nz(f.telephone ?? f.tel),
      email: nz(f.email),
      adresse: nz(f.adresse),
      tarif: numOrNull(f.tarif),
      notes: nz(f.notes),
      latitude: numOrNull(f.latitude),
      longitude: numOrNull(f.longitude),
    }));

    // 3) Envoi par paquets pour éviter les limites
    const chunkSize = 50;
    let ok = 0;
    let fail = 0;

    for (let i = 0; i < rows.length; i += chunkSize) {
      const batch = rows.slice(i, i + chunkSize);
      setLog((s) => s + `→ Insertion ${i + 1}–${i + batch.length}…\n`);

      const { error } = await supabase
        .from('trainers')
        .insert(batch); // pas d'upsert : exécuter une seule fois

      if (error) {
        // Affiche l'erreur mais continue (pour tout importer)
        setLog((s) => s + `   ⚠️ Erreur: ${error.message}\n`);
        fail += batch.length;
      } else {
        ok += batch.length;
        setLog((s) => s + `   ✅ OK (${batch.length})\n`);
      }
    }

    setLog((s) => s + `\nTerminé. ✅ Migration réussie: ${ok} | ❌ Échecs: ${fail}\n`);
    setRunning(false);
  }

  return (
    <div style={{ padding: '1rem', display: 'grid', gap: 12, maxWidth: 900 }}>
      <h2>Migration des formateurs (localStorage ➜ Supabase)</h2>

      <div>
        <strong>Formateurs détectés dans localStorage :</strong> {localItems.length}
      </div>

      {preview.length > 0 && (
        <div>
          <div style={{ opacity: 0.7, marginBottom: 6 }}>
            Aperçu des 3 premiers éléments (lecture seule) :
          </div>
          <pre style={{ background: '#f8fafc', padding: 8, borderRadius: 8, maxHeight: 300, overflow: 'auto' }}>
            {JSON.stringify(preview, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={migrate} disabled={running || !localItems.length}>
          {running ? 'Migration en cours…' : 'Migrer vers Supabase'}
        </button>
        <button type="button" onClick={() => (window.location.href = '/listing')}>
          Retour au listing
        </button>
      </div>

      <pre
        style={{
          background: '#f3f4f6',
          padding: 8,
          borderRadius: 8,
          minHeight: 120,
          whiteSpace: 'pre-wrap',
        }}
      >
        {log}
      </pre>

      <div style={{ opacity: 0.7, fontSize: 13 }}>
        ⚠️ Conseil : lance cette migration **une seule fois**. Ensuite, supprime la page et la route.
      </div>
    </div>
  );
}
