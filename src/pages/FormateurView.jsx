import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AvailabilityCalendar from '../components/AvailabilityCalendar.jsx';

// Helper pour éviter les crashs
function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function FormateurView() {
  const { index } = useParams();
  const navigate = useNavigate();
  const [formateur, setFormateur] = useState(null);

  useEffect(() => {
    const data = safeGet('formateurs', []);
    const idx = Number(index);

    if (!Number.isInteger(idx) || idx < 0 || idx >= data.length) {
      navigate('/listing', { replace: true });
      return;
    }

    setFormateur(data[idx] ?? null);
  }, [index, navigate]);

  if (!formateur) return <div style={{ padding: 20 }}>Chargement…</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>{formateur?.nom ?? 'Formateur'} {formateur?.prenom ?? ''}</h2>
      <AvailabilityCalendar />
    </div>
  );
}
