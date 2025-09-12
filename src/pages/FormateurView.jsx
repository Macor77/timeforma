// src/pages/FormateurView.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AvailabilityCalendar from '../components/AvailabilityCalendar.jsx';

// Petit helper : parse localStorage sans jamais crasher
function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function FormateurView() {
  const { index } = useParams();          // /formateur/:index
  const navigate = useNavigate();
  const [formateur, setFormateur] = useState(null);

  useEffect(() => {
    const data = safeGet('formateurs', []); // pas d’erreur même si valeur corrompue
    const idx = Number(index);

    // Garde : index invalide → on renvoie vers la liste
    if (!Number.isInteger(idx) || idx < 0 || idx >= data.length) {
      navigate('/listing', { replace: true });
      return;
    }

    setFormateur(data[idx] ?? null);
  }, [index, navigate]);

  if (!formateur) return <div style={{ padding: 20 }}>Chargement…</div>;

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui' }}>
      <h2 style={{ marginBottom: 12 }}>
        {formateur?.nom ?? 'Formateur'} {formateur?.prenom ?? ''}
      </h2>

      {/* ton calendrier d’indispos */}
      <AvailabilityCalendar />
    </div>
  );
}
