// src/pages/FormateurForm.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const DEFAULTS = {
  prenom: '',
  nom: '',
  ville: '',
  codePostal: '',
  adresse: '',
  latitude: '',
  longitude: '',
  mail: '',
  telephone: '',
  competences: [],   // chips
  materiel: [],      // chips (nouveau)
  tarif: '',
  note: '',
  statut: 'Standard',
  dispo: {},         // pour le planning
  dispoUpdatedAt: '',// <-- nouveau : horodatage dernière MAJ du planning
};

export default function FormateurForm() {
  const { index } = useParams();
  const navigate = useNavigate();

  const [formateur, setFormateur] = useState(DEFAULTS);

  // saisies en cours pour chips
  const [competenceInput, setCompetenceInput] = useState('');
  const [materielInput, setMaterielInput] = useState('');

  const [notFound, setNotFound] = useState(false);

  // -------- Chargement (création/édition) --------
  useEffect(() => {
    if (index === undefined) {
      setFormateur(DEFAULTS);
      return;
    }
    const list = JSON.parse(localStorage.getItem('formateurs')) || [];
    const idx = Number(index);

    if (Number.isNaN(idx) || idx < 0 || idx >= list.length) {
      setNotFound(true);
      return;
    }

    const loaded = list[idx] || {};
    const normalizeToArray = (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string' && value.trim().length) {
        return value.split(/[;,]/).map(s => s.trim()).filter(Boolean);
      }
      return [];
    };

    const normalized = {
      ...DEFAULTS,
      ...loaded,
      competences: normalizeToArray(loaded.competences),
      materiel:    normalizeToArray(loaded.materiel),
      note: typeof loaded.note === 'string' ? loaded.note : '',
      dispo: (loaded && typeof loaded.dispo === 'object' && loaded.dispo !== null) ? loaded.dispo : {},
      dispoUpdatedAt: typeof loaded.dispoUpdatedAt === 'string' ? loaded.dispoUpdatedAt : '', // <-- préserver l'existant
    };

    setFormateur(normalized);
  }, [index]);

  // -------- Helpers généraux --------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormateur((prev) => ({ ...prev, [name]: value }));
  };

  // -------- Chips: Compétences --------
  const addCompetence = (raw) => {
    const text = (raw || '').trim();
    if (!text) return;
    setFormateur(prev => {
      const exists = prev.competences.some(c => c.toLowerCase() === text.toLowerCase());
      if (exists) return prev;
      return { ...prev, competences: [...prev.competences, text] };
    });
    setCompetenceInput('');
  };

  const handleCompetenceKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ';' || e.key === ',') {
      e.preventDefault();
      addCompetence(competenceInput);
    }
    if (e.key === 'Backspace' && competenceInput.length === 0 && formateur.competences.length > 0) {
      setFormateur(prev => ({ ...prev, competences: prev.competences.slice(0, -1) }));
    }
  };

  const handleCompetencePaste = (e) => {
    const pasted = e.clipboardData.getData('text');
    if (!pasted) return;
    const parts = pasted.split(/[\n;,]/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      e.preventDefault();
      setFormateur(prev => {
        const existing = new Set(prev.competences.map(c => c.toLowerCase()));
        const toAdd = parts.filter(p => !existing.has(p.toLowerCase()));
        return { ...prev, competences: [...prev.competences, ...toAdd] };
      });
      setCompetenceInput('');
    }
  };

  const removeCompetence = (comp) => {
    setFormateur(prev => ({
      ...prev,
      competences: prev.competences.filter(c => c !== comp),
    }));
  };

  // -------- Chips: Matériel --------
  const addMateriel = (raw) => {
    const text = (raw || '').trim();
    if (!text) return;
    setFormateur(prev => {
      const exists = prev.materiel.some(c => c.toLowerCase() === text.toLowerCase());
      if (exists) return prev;
      return { ...prev, materiel: [...prev.materiel, text] };
    });
    setMaterielInput('');
  };

  const handleMaterielKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ';' || e.key === ',') {
      e.preventDefault();
      addMateriel(materielInput);
    }
    if (e.key === 'Backspace' && materielInput.length === 0 && formateur.materiel.length > 0) {
      setFormateur(prev => ({ ...prev, materiel: prev.materiel.slice(0, -1) }));
    }
  };

  const handleMaterielPaste = (e) => {
    const pasted = e.clipboardData.getData('text');
    if (!pasted) return;
    const parts = pasted.split(/[\n;,]/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      e.preventDefault();
      setFormateur(prev => {
        const existing = new Set(prev.materiel.map(c => c.toLowerCase()));
        const toAdd = parts.filter(p => !existing.has(p.toLowerCase()));
        return { ...prev, materiel: [...prev.materiel, ...toAdd] };
      });
      setMaterielInput('');
    }
  };

  const removeMateriel = (item) => {
    setFormateur(prev => ({
      ...prev,
      materiel: prev.materiel.filter(c => c !== item),
    }));
  };

  // -------- Soumission --------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ajoute les saisies en cours
    if (competenceInput.trim()) addCompetence(competenceInput);
    if (materielInput.trim()) addMateriel(materielInput);
    await new Promise(r => setTimeout(r, 0)); // attend la mise à jour de state

    // géocodage léger
    let { latitude, longitude } = formateur;
    if (formateur.ville && formateur.codePostal) {
      try {
        const q = encodeURIComponent(`${formateur.adresse || ''}, ${formateur.codePostal} ${formateur.ville}`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          latitude = data[0].lat;
          longitude = data[0].lon;
        }
      } catch (err) {
        console.warn('Géocodage indisponible, on continue sans:', err);
      }
    }

    const list = JSON.parse(localStorage.getItem('formateurs')) || [];
    const updated = {
      ...DEFAULTS,
      ...formateur,
      latitude: latitude || '',
      longitude: longitude || '',
      competences: Array.isArray(formateur.competences) ? formateur.competences : [],
      materiel: Array.isArray(formateur.materiel) ? formateur.materiel : [],
      note: typeof formateur.note === 'string' ? formateur.note : '',
      dispo: (formateur && typeof formateur.dispo === 'object' && formateur.dispo !== null) ? formateur.dispo : {},
      // on conserve l'horodatage existant (il est mis à jour par la fiche via le calendrier)
      dispoUpdatedAt: typeof formateur.dispoUpdatedAt === 'string' ? formateur.dispoUpdatedAt : '',
    };

    if (index === undefined) {
      list.push(updated);
    } else {
      const idx = Number(index);
      if (Number.isNaN(idx) || idx < 0 || idx >= list.length) {
        alert('Formateur introuvable.');
        navigate('/listing');
        return;
      }
      list[idx] = updated;
    }

    localStorage.setItem('formateurs', JSON.stringify(list));
    navigate('/listing');
  };

  if (notFound) {
    return (
      <div style={{ padding: '1rem' }}>
        <h3>Formateur introuvable</h3>
        <button onClick={() => navigate('/listing')}>Retour à la liste</button>
      </div>
    );
  }

  // -------- UI --------
  const chipBoxStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    padding: 6,
    border: '1px solid #ccc',
    borderRadius: 6,
    marginBottom: 8,
    background: '#fff',
  };
  const chipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 8px',
    borderRadius: 999,
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
  };
  const chipCloseStyle = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>{index !== undefined ? 'Modifier' : 'Ajouter'} un formateur</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="prenom"
          placeholder="Prénom"
          value={formateur.prenom || ''}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="nom"
          placeholder="Nom"
          value={formateur.nom || ''}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="ville"
          placeholder="Ville"
          value={formateur.ville || ''}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="codePostal"
          placeholder="Code postal"
          value={formateur.codePostal || ''}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="adresse"
          placeholder="Adresse (facultatif)"
          value={formateur.adresse || ''}
          onChange={handleChange}
        />

        <input
          type="email"
          name="mail"
          placeholder="Adresse mail"
          value={formateur.mail || ''}
          onChange={handleChange}
        />
        <input
          type="tel"
          name="telephone"
          placeholder="Numéro de téléphone"
          value={formateur.telephone || ''}
          onChange={handleChange}
        />

        {/* --- Compétences (chips) --- */}
        <label style={{ display: 'block', marginTop: 8, marginBottom: 4 }}>Compétences :</label>
        <div
          style={chipBoxStyle}
          onClick={() => document.getElementById('competence-input')?.focus()}
        >
          {formateur.competences.map((c) => (
            <span key={c} style={chipStyle}>
              {c}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeCompetence(c); }}
                title="Supprimer"
                style={chipCloseStyle}
              >
                ×
              </button>
            </span>
          ))}

          <input
            id="competence-input"
            type="text"
            placeholder="Tapez une compétence puis ; , ou Entrée"
            value={competenceInput}
            onChange={(e) => setCompetenceInput(e.target.value)}
            onKeyDown={handleCompetenceKeyDown}
            onPaste={handleCompetencePaste}
            style={{ flex: 1, minWidth: 160, border: 'none', outline: 'none' }}
          />
        </div>

        {/* --- Matériel (chips) --- */}
        <label style={{ display: 'block', marginTop: 8, marginBottom: 4 }}>Matériel :</label>
        <div
          style={chipBoxStyle}
          onClick={() => document.getElementById('materiel-input')?.focus()}
        >
          {formateur.materiel.map((m) => (
            <span key={m} style={chipStyle}>
              {m}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeMateriel(m); }}
                title="Supprimer"
                style={chipCloseStyle}
              >
                ×
              </button>
            </span>
          ))}

          <input
            id="materiel-input"
            type="text"
            placeholder="Tapez un matériel puis ; , ou Entrée"
            value={materielInput}
            onChange={(e) => setMaterielInput(e.target.value)}
            onKeyDown={handleMaterielKeyDown}
            onPaste={handleMaterielPaste}
            style={{ flex: 1, minWidth: 160, border: 'none', outline: 'none' }}
          />
        </div>

        <input
          type="text"
          name="tarif"
          placeholder="Tarif"
          value={formateur.tarif || ''}
          onChange={handleChange}
        />

        <label style={{ display: 'block', margin: '8px 0 4px' }}>Note :</label>
        <textarea
          name="note"
          rows={6}
          placeholder="Ta note (on remettra l’éditeur riche plus tard si tu veux)"
          value={formateur.note || ''}
          onChange={handleChange}
          style={{ width: '100%', marginBottom: 12 }}
        />

        <select name="statut" value={formateur.statut || 'Standard'} onChange={handleChange}>
          <option value="Premium">Premium</option>
          <option value="Standard">Standard</option>
          <option value="Inactif">Inactif</option>
          <option value="Black">Black</option>
        </select>

        <br /><br />
        <button type="submit">Enregistrer</button>
        <button type="button" onClick={() => navigate('/listing')}>Annuler</button>
      </form>
    </div>
  );
}
