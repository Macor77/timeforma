import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const EMPTY = {
  prenom: '',
  nom: '',
  ville: '',
  codePostal: '',
  competences: [],
  materiel: [],
  statut: 'Inactif',
  tarif: '',
  telephone: '',
  email: '',
  adresse: '',
  notes: '',
};

export default function FormateurForm() {
  const { id } = useParams(); // undefined => création
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!!id);
  const [err, setErr] = useState(null);

  // helpers
  const norm = (s) => s.trim();
  const splitToArray = (text) =>
    text.split(/[,\n;]+/).map(norm).filter(Boolean);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setErr(error.message);
      } else if (data) {
        setForm({
          prenom: data.prenom ?? '',
          nom: data.nom ?? '',
          ville: data.ville ?? '',
          codePostal: data.code_postal ?? '',
          competences: Array.isArray(data.competences) ? data.competences : (data.competences ?? []),
          materiel: Array.isArray(data.materiel) ? data.materiel : (data.materiel ?? []),
          statut: data.statut ?? 'Inactif',
          tarif: data.tarif ?? '',
          telephone: data.telephone ?? '',
          email: data.email ?? '',
          adresse: data.adresse ?? '',
          notes: data.notes ?? '',
        });
      }
      setLoading(false);
    })();
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  function ChipsInput({ label, values, onChangeValues, placeholder }) {
    const [input, setInput] = useState('');
    const inputRef = useRef(null);

    const addValue = (v) => {
      const val = norm(v);
      if (!val) return;
      if (values.includes(val)) return;
      onChangeValues([...values, val]);
      setInput('');
    };

    const removeAt = (idx) => {
      const next = [...values];
      next.splice(idx, 1);
      onChangeValues(next);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
        e.preventDefault();
        if (input) addValue(input);
      } else if (e.key === 'Backspace' && !input && values.length > 0) {
        removeAt(values.length - 1);
      }
    };

    const handleBlur = () => { if (input) addValue(input); };
    const handlePaste = (e) => {
      const text = e.clipboardData.getData('text');
      if (text && /[,;\n]/.test(text)) {
        e.preventDefault();
        const arr = splitToArray(text);
        if (arr.length) onChangeValues([...values, ...arr.filter((v) => !values.includes(v))]);
        setInput('');
      }
    };

    return (
      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 14 }}>{label}</label>
        <div
          style={{
            display: 'flex', flexWrap: 'wrap', gap: 6,
            border: '1px solid #ccc', borderRadius: 8, padding: 6, minHeight: 40, alignItems: 'center',
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {values.map((v, i) => (
            <span key={`${v}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 12, background: '#eef2ff', fontSize: 13 }}>
              {v}
              <button type="button" onClick={() => removeAt(i)} aria-label={`Supprimer ${v}`} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, lineHeight: 1 }} title="Supprimer">×</button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onPaste={handlePaste}
            placeholder={placeholder}
            style={{ flex: 1, minWidth: 160, border: 'none', outline: 'none', fontSize: 14, padding: '6px 4px' }}
          />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);

    const payload = {
      prenom: form.prenom || null,
      nom: form.nom || null,
      ville: form.ville || null,
      code_postal: form.codePostal || null,
      competences: form.competences ?? [],
      materiel: form.materiel ?? [],
      statut: form.statut || 'Inactif',
      tarif: form.tarif === '' ? null : Number(form.tarif),
      telephone: form.telephone || null,
      email: form.email || null,
      adresse: form.adresse || null,
      notes: form.notes || null,
    };

    if (id) {
      const { error } = await supabase.from('trainers').update(payload).eq('id', id);
      if (error) return setErr(error.message);
      navigate(`/formateur/view/${id}`);
    } else {
      const { data, error } = await supabase.from('trainers').insert([payload]).select().single();
      if (error) return setErr(error.message);
      navigate(`/formateur/view/${data.id}`);
    }
  };

  if (loading) return <div style={{ padding: '1rem' }}>Chargement…</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>{id ? 'Modifier' : 'Créer'} un formateur</h2>
      {err && <div style={{ color: 'crimson', marginBottom: 12 }}>Erreur : {err}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 600 }}>
        <input name="prenom" placeholder="Prénom" value={form.prenom} onChange={onChange} required />
        <input name="nom" placeholder="Nom" value={form.nom} onChange={onChange} required />
        <input name="ville" placeholder="Ville" value={form.ville} onChange={onChange} />
        <input name="codePostal" placeholder="Code postal" value={form.codePostal} onChange={onChange} />

        <ChipsInput
          label="Compétences"
          values={form.competences}
          onChangeValues={(vals) => setForm((p) => ({ ...p, competences: vals }))}
          placeholder="Tape et appuie sur Entrée ou une virgule…"
        />
        <ChipsInput
          label="Matériel"
          values={form.materiel}
          onChangeValues={(vals) => setForm((p) => ({ ...p, materiel: vals }))}
          placeholder="Tape et appuie sur Entrée ou une virgule…"
        />

        <input name="tarif" type="number" step="0.01" placeholder="Tarif (€)" value={form.tarif} onChange={onChange} />
        <input name="telephone" placeholder="Téléphone" value={form.telephone} onChange={onChange} />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} />
        <input name="adresse" placeholder="Adresse" value={form.adresse} onChange={onChange} />

        <label>Notes</label>
        <textarea name="notes" rows={5} placeholder="Notes sur le formateur…" value={form.notes} onChange={onChange} />

        <select name="statut" value={form.statut} onChange={onChange}>
          <option value="Premium">Premium</option>
          <option value="Standard">Standard</option>
          <option value="Inactif">Inactif</option>
          <option value="Black">Black</option>
        </select>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit">{id ? 'Enregistrer' : 'Créer'}</button>
          <button type="button" onClick={() => navigate('/listing')}>Annuler</button>
        </div>
      </form>
    </div>
  );
}
