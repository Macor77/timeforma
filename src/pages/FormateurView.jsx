// src/pages/FormateurView.jsx
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import AvailabilityCalendar from '../components/AvailabilityCalendar.jsx';

/* ------------------------- helpers localStorage ------------------------- */
function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/* ----------------------------- composant page ---------------------------- */
export default function FormateurView() {
  const { index } = useParams();
  const navigate = useNavigate();

  const [formateurs, setFormateurs] = useState(() => safeGet('formateurs', []));
  const idx = useMemo(() => Number(index), [index]);

  // sécurité si index invalide
  useEffect(() => {
    if (!Number.isInteger(idx) || idx < 0 || idx >= formateurs.length) {
      navigate('/listing', { replace: true });
    }
  }, [idx, formateurs.length, navigate]);

  const formateur = formateurs[idx];
  if (!formateur) {
    return (
      <div style={{ padding: 20, fontFamily: 'system-ui' }}>
        <p>Chargement…</p>
        <p><Link to="/listing">← Retour à la liste</Link></p>
      </div>
    );
  }

  /* ----------------------- normalisation des propriétés ----------------------- */
  // On accepte plusieurs alias (anciens noms de champs) pour que tout s’affiche.
  const f = formateur;
  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(/[;,]/).map(s => s.trim()).filter(Boolean);
    }
    return [];
    };

  const normalized = {
    prenom:      f.prenom ?? f.firstName ?? '',
    nom:         f.nom ?? f.lastName ?? '',
    adresse:     f.adresse ?? [f.adresse1, f.adresse2].filter(Boolean).join(' ') ?? '',
    ville:       f.ville ?? f.city ?? '',
    codePostal:  f.codePostal ?? f.zip ?? '',
    mail:        f.mail ?? f.email ?? '',
    telephone:   f.telephone ?? f.phone ?? '',
    competences: toArray(f.competences ?? f.skills),
    materiel:    toArray(f.materiel ?? f.equipment),
    tarif:       f.tarif ?? f.rate ?? '',
    statut:      f.statut ?? f.status ?? '',
    notes:       f.note ?? f.notes ?? '',
    coords:      f.coords,
    disponibilites: f.disponibilites ?? f.dispo ?? {},
  };

  /* --------------------------- handlers de mise à jour -------------------------- */
  const handleCalendarChange = (newMap) => {
    const updated = [...formateurs];
    updated[idx] = { ...formateur, disponibilites: newMap };
    setFormateurs(updated);
    safeSet('formateurs', updated);
  };

  /* --------------------------------- UI utils --------------------------------- */
  const chip = (text) => (
    <span
      key={text}
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 999,
        background: '#eef2ff',
        color: '#3730a3',
        fontSize: 13,
        marginRight: 8,
        marginBottom: 8,
        border: '1px solid #c7d2fe',
      }}
    >
      {text}
    </span>
  );

  const section = (title, content) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {title}
      </div>
      <div>{content}</div>
    </div>
  );

  /* ----------------------------------- JSX ----------------------------------- */
  return (
    <div style={{ padding: 20, fontFamily: 'system-ui', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Link to="/listing" style={{ textDecoration: 'none', color: '#2563eb' }}>← Retour</Link>
        <Link
          to={`/formateur/edit/${idx}`}
          style={{ padding: '8px 12px', borderRadius: 8, background: '#111827', color: 'white', textDecoration: 'none' }}
        >
          Modifier
        </Link>
      </div>

      <h1 style={{ margin: '0 0 8px', fontSize: 26 }}>
        {normalized.prenom} {normalized.nom || 'Formateur'}
      </h1>
      <div style={{ color: '#6b7280', marginBottom: 20 }}>
        {normalized.ville || '—'}
        {normalized.codePostal ? ` (${normalized.codePostal})` : ''}
        {normalized.coords && (normalized.coords.lat != null && normalized.coords.lng != null) && (
          <>
            <span> · </span>
            <span>
              ({normalized.coords.lat.toFixed?.(4) ?? normalized.coords.lat},
               {' '}
               {normalized.coords.lng.toFixed?.(4) ?? normalized.coords.lng})
            </span>
          </>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Colonne gauche : contact + adresse + méta */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff' }}>
          {section('Contact', (
            <>
              <div>Email : {normalized.mail ? <a href={`mailto:${normalized.mail}`}>{normalized.mail}</a> : '—'}</div>
              <div>Téléphone : {normalized.telephone ? <a href={`tel:${normalized.telephone}`}>{normalized.telephone}</a> : '—'}</div>
            </>
          ))}

          {section('Adresse', (
            <>
              <div>{normalized.adresse || '—'}</div>
              <div>{normalized.ville || '—'} {normalized.codePostal || ''}</div>
            </>
          ))}

          {section('Informations', (
            <>
              <div>Statut : {normalized.statut || '—'}</div>
              <div>Tarif : {normalized.tarif || '—'}</div>
            </>
          ))}

          {section('Notes', normalized.notes ? <div>{normalized.notes}</div> : <div style={{ color: '#9ca3af' }}>Aucune note</div>)}
        </div>

        {/* Colonne droite : compétences + matériel */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff' }}>
          {section('Compétences', normalized.competences.length
            ? <div>{normalized.competences.map(chip)}</div>
            : <div style={{ color: '#9ca3af' }}>—</div>
          )}

          {section('Matériel', normalized.materiel.length
            ? <div>{normalized.materiel.map(chip)}</div>
            : <div style={{ color: '#9ca3af' }}>—</div>
          )}
        </div>
      </div>

      {/* Disponibilités */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Disponibilités</h2>
        <AvailabilityCalendar
          value={normalized.disponibilites || {}}
          onChange={handleCalendarChange}
        />
      </div>
    </div>
  );
}
