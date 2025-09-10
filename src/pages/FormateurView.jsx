// src/pages/FormateurView.jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AvailabilityCalendar from '../components/AvailabilityCalendar';

export default function FormateurView() {
  const { index } = useParams();
  const navigate = useNavigate();
  const [formateur, setFormateur] = useState(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('formateurs')) || [];
    const idx = Number(index);
    if (!Number.isNaN(idx) && data[idx]) {
      setFormateur(data[idx]);
    }
  }, [index]);

  // Mise à jour et persistance des dispos + horodatage
  const handleDispoChange = (updatedMap) => {
    const nowISO = new Date().toISOString();

    setFormateur((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, dispo: updatedMap, dispoUpdatedAt: nowISO };

      // persist
      const list = JSON.parse(localStorage.getItem('formateurs')) || [];
      const idx = Number(index);
      if (!Number.isNaN(idx) && list[idx]) {
        list[idx] = updated;
        localStorage.setItem('formateurs', JSON.stringify(list));
      }
      return updated;
    });
  };

  const lastUpdateLabel = useMemo(() => {
    if (!formateur?.dispoUpdatedAt) return null;
    try {
      const d = new Date(formateur.dispoUpdatedAt);
      // Affichage FR lisible : mercredi 10 septembre 2025 à 16:42
      return d.toLocaleString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return formateur.dispoUpdatedAt;
    }
  }, [formateur?.dispoUpdatedAt]);

  if (!formateur) {
    return (
      <div style={{ padding: '1rem' }}>
        <p>Chargement…</p>
        <button onClick={() => navigate('/listing')}>Retour à la liste</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', maxWidth: 900 }}>
      <h2>Fiche du formateur</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <p><strong>Prénom :</strong> {formateur.prenom}</p>
        <p><strong>Nom :</strong> {formateur.nom}</p>

        <p><strong>Ville :</strong> {formateur.ville}</p>
        <p><strong>Code postal :</strong> {formateur.codePostal}</p>

        <p style={{ gridColumn: '1 / -1' }}>
          <strong>Adresse :</strong> {formateur.adresse}
        </p>

        <p><strong>Adresse mail :</strong> {formateur.mail}</p>
        <p><strong>Téléphone :</strong> {formateur.telephone}</p>

        <p style={{ gridColumn: '1 / -1' }}>
          <strong>Compétences :</strong> {Array.isArray(formateur.competences) ? formateur.competences.join(', ') : (formateur.competences || '')}
        </p>

        <p><strong>Matériel :</strong> {Array.isArray(formateur.materiel) ? formateur.materiel.join(', ') : (formateur.materiel || '')}</p>
        <p><strong>Tarif :</strong> {formateur.tarif}</p>

        <p><strong>Statut :</strong> {formateur.statut}</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong>Note :</strong>
        <div
          style={{
            background: '#fff',
            padding: 12,
            border: '1px solid #eee',
            borderRadius: 6,
            marginTop: 6,
            minHeight: 60
          }}
          dangerouslySetInnerHTML={{ __html: formateur.note || '' }}
        />
      </div>

      {/* --- Disponibilités (avec horodatage) --- */}
      <AvailabilityCalendar
        value={formateur.dispo || {}}
        onChange={handleDispoChange}
        title="Disponibilités"
      />

      {/* Affichage de la dernière mise à jour */}
      <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
        <em>
          Dernière mise à jour du planning : {lastUpdateLabel ? lastUpdateLabel : '—'}
        </em>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button onClick={() => navigate('/listing')}>Retour à la liste</button>
        <button onClick={() => navigate(`/formateur/edit/${index}`)}>Modifier</button>
      </div>
    </div>
  );
}
