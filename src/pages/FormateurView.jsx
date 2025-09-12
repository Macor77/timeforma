// src/pages/FormateurView.jsx
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import AvailabilityCalendar from '../components/AvailabilityCalendar.jsx';

// Helpers localStorage robustes
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
    // ignore quota/serialize errors
  }
}

export default function FormateurView() {
  const { index } = useParams();
  const navigate = useNavigate();

  const [formateurs, setFormateurs] = useState(() => safeGet('formateurs', []));
  const idx = useMemo(() => Number(index), [index]);

  // Garde: index valide
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

  // Données usuelles attendues dans l’objet (on tolère les champs manquants)
  const {
    nom = '',
    prenom = '',
    adresse = '',
    ville = '',
    email = '',
    telephone = '',
    skills = [],
    materiel = [],
    disponibilites = {},
    coords, // { lat, lng } éventuellement
    notes = '',
  } = formateur;

  // Mise à jour des dispos → persiste dans localStorage au même index
  const handleCalendarChange = (newMap) => {
    const updated = [...formateurs];
    updated[idx] = { ...formateur, disponibilites: newMap };
    setFormateurs(updated);
    safeSet('formateurs', updated);
  };

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
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>{title}</div>
      <div>{content}</div>
    </div>
  );

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Link to="/listing" style={{ textDecoration: 'none', color: '#2563eb' }}>← Retour</Link>
        <Link
          to={`/formateur/edit/${idx}`}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: '#111827',
            color: 'white',
            textDecoration: 'none',
          }}
        >
          Modifier
        </Link>
      </div>

      <h1 style={{ margin: '0 0 8px', fontSize: 24 }}>
        {prenom} {nom || 'Formateur'}
      </h1>
      <div style={{ color: '#6b7280', marginBottom: 20 }}>
        {adresse && <span>{adresse}</span>}
        {(adresse && ville) && <span> · </span>}
        {ville && <span>{ville}</span>}
        {coords && (coords.lat != null && coords.lng != null) && (
          <>
            <span> · </span>
            <span>({coords.lat.toFixed?.(4) ?? coords.lat}, {coords.lng.toFixed?.(4) ?? coords.lng})</span>
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
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff' }}>
          {section('Contact', (
            <>
              {email ? <div>Email : <a href={`mailto:${email}`}>{email}</a></div> : <div>Email : —</div>}
              {telephone ? <div>Téléphone : <a href={`tel:${telephone}`}>{telephone}</a></div> : <div>Téléphone : —</div>}
            </>
          ))}
          {section('Adresse', (
            <>
              <div>{adresse || '—'}</div>
              <div>{ville || '—'}</div>
            </>
          ))}
          {section('Notes', notes ? <div>{notes}</div> : <div style={{ color: '#9ca3af' }}>Aucune note</div>)}
        </div>

        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff' }}>
          {section('Compétences', skills?.length ? <div>{skills.map(chip)}</div> : <div style={{ color: '#9ca3af' }}>—</div>)}
          {section('Matériel', materiel?.length ? <div>{materiel.map(chip)}</div> : <div style={{ color: '#9ca3af' }}>—</div>)}
        </div>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Disponibilités</h2>
        <AvailabilityCalendar
          value={disponibilites || {}}
          onChange={handleCalendarChange}
        />
      </div>
    </div>
  );
}
