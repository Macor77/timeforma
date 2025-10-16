// src/pages/FormateurView.jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// ---- Helpers dates (vanilla JS)
function startOfMonth(d){ const x=new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
function endOfMonth(d){ const x=new Date(d); x.setMonth(x.getMonth()+1,0); x.setHours(23,59,59,999); return x; }
function addMonths(d,n){ const x=new Date(d); x.setMonth(x.getMonth()+n); return x; }
function toISODate(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; }
function getMonthMatrix(refDate){
  const first = startOfMonth(refDate);
  const last = endOfMonth(refDate);
  const start = new Date(first);
  const weekday = (first.getDay()+6)%7; // 0=Lun ... 6=Dim
  start.setDate(first.getDate() - weekday);
  const end = new Date(last);
  const weekdayEnd = (end.getDay()+6)%7;
  end.setDate(end.getDate() + (6-weekdayEnd));
  const days = [];
  const c = new Date(start);
  while (c <= end){ days.push(new Date(c)); c.setDate(c.getDate()+1); }
  const rows=[]; for (let i=0;i<days.length;i+=7) rows.push(days.slice(i,i+7));
  return rows;
}

const STATUS_ORDER = ['', 'dispo', 'mission', 'indispo'];
const STATUS_LABEL = { '': '—', 'dispo': 'Disponible', 'mission': 'En mission', 'indispo': 'Indisponible' };
const STATUS_BG = { '': '#f8fafc', 'dispo': '#eaffea', 'mission': '#fff3cd', 'indispo': '#ffe3e3' };
const STATUS_BORDER = { '': '#e5e7eb', 'dispo': '#c7f0c7', 'mission': '#ffe08a', 'indispo': '#ffb3b3' };

export default function FormateurView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [f, setF] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Calendrier
  const [refDate, setRefDate] = useState(() => new Date());
  const [avail, setAvail] = useState({}); // { 'YYYY-MM-DD': { status, updated_at, id? } }
  const [globalUpdatedAt, setGlobalUpdatedAt] = useState(null);

  // Charger fiche + mois courant
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }

      setF({
        id: data.id,
        prenom: data.prenom ?? '',
        nom: data.nom ?? '',
        ville: data.ville ?? '',
        codePostal: data.code_postal ?? '',
        competences: Array.isArray(data.competences) ? data.competences : (data.competences ?? []),
        materiel: Array.isArray(data.materiel) ? data.materiel : (data.materiel ?? []),
        statut: data.statut ?? 'Inactif',
        tarif: data.tarif ?? null,
        notes: data.notes ?? '',
        telephone: data.telephone ?? '',
        email: data.email ?? '',
        adresse: data.adresse ?? '',
        created_at: data.created_at,
      });

      await fetchMonth(id, refDate, setAvail, setGlobalUpdatedAt);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Recharger quand on change de mois
  useEffect(() => {
    if (!f?.id) return;
    fetchMonth(f.id, refDate, setAvail, setGlobalUpdatedAt);
  }, [refDate, f?.id]);

  const matrix = useMemo(() => getMonthMatrix(refDate), [refDate]);

  if (loading) return <div style={{ padding: '1rem' }}>Chargement…</div>;
  if (err) return <div style={{ padding: '1rem', color: 'crimson' }}>Erreur : {err}</div>;
  if (!f) return <div style={{ padding: '1rem' }}>Introuvable.</div>;

  const title = `${f.prenom} ${f.nom}`.trim();

  const handleCellClick = async (d) => {
    const iso = toISODate(d);
    const current = avail[iso]?.status ?? '';
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current)+1) % STATUS_ORDER.length];

    const payload = {
      trainer_id: f.id,
      day: iso,
      status: next,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('trainer_availability')
      .upsert(payload, { onConflict: 'trainer_id,day' })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Mise à jour indisponible (voir console).");
      return;
    }

    setAvail((prev) => ({
      ...prev,
      [iso]: { status: data.status, updated_at: data.updated_at, id: data.id }
    }));
    setGlobalUpdatedAt((prev) => {
      const now = new Date(data.updated_at).getTime();
      return prev ? (now > new Date(prev).getTime() ? data.updated_at : prev) : data.updated_at;
    });
  };

  const frenchMonth = refDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const weekdays = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

  return (
    <div style={{ padding: '1rem', display:'grid', gap:14, maxWidth:920 }}>
      <h2>Fiche formateur</h2>

      <div style={{display:'grid', gap:8, gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))'}}>
        <Info label="Prénom" value={f.prenom}/>
        <Info label="Nom" value={f.nom}/>
        <Info label="Ville" value={f.ville}/>
        <Info label="Code postal" value={f.codePostal}/>
        <Info label="Statut" value={f.statut}/>
        <Info label="Tarif" value={f.tarif != null ? `${f.tarif} €` : '—'}/>
        <Info label="Téléphone" value={f.telephone || '—'}/>
        <Info label="Email" value={f.email || '—'}/>
        <Info label="Adresse" value={f.adresse || '—'}/>
      </div>

      <Info label="Compétences" value={(f.competences||[]).join(', ') || '—'}/>
      <Info label="Matériel" value={(f.materiel||[]).join(', ') || '—'}/>

      <div>
        <strong>Notes :</strong>
        <div style={{ whiteSpace:'pre-wrap', border:'1px solid #ddd', borderRadius:8, padding:8, marginTop:6 }}>
          {f.notes || '—'}
        </div>
      </div>

      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
        <button onClick={() => navigate(`/formateur/edit/${f.id}`)}>Modifier</button>
        <button onClick={() => navigate('/listing')}>Retour</button>
      </div>

      {/* --- Calendrier des disponibilités --- */}
      <hr />
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
        <h3 style={{margin:0}}>Disponibilités — {title}</h3>
        <div style={{opacity:0.8, fontSize:13}}>
          Dernière mise à jour : {globalUpdatedAt ? new Date(globalUpdatedAt).toLocaleString('fr-FR') : '—'}
        </div>
      </div>

      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <button onClick={() => setRefDate((d)=>addMonths(d,-1))}>◀️ Mois précédent</button>
        <div style={{minWidth:180, textAlign:'center', fontWeight:600, textTransform:'capitalize'}}>{frenchMonth}</div>
        <button onClick={() => setRefDate((d)=>addMonths(d, 1))}>Mois suivant ▶️</button>
        <button onClick={() => setRefDate(new Date())} style={{marginLeft:'auto'}}>Aujourd’hui</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6}}>
        {weekdays.map((w)=>(
          <div key={w} style={{textAlign:'center', fontWeight:600, padding:'6px 0'}}>{w}</div>
        ))}
        {matrix.flat().map((d)=>{
          const iso = toISODate(d);
          const inMonth = d.getMonth() === refDate.getMonth();
          const cell = avail[iso];
          const status = cell?.status ?? '';
          const bg = STATUS_BG[status];
          const bd = STATUS_BORDER[status];

          return (
            <button
              key={iso}
              onClick={() => handleCellClick(d)}
              title={`${iso} — ${STATUS_LABEL[status]}${cell?.updated_at ? ` (MAJ ${new Date(cell.updated_at).toLocaleString('fr-FR')})` : ''}`}
              style={{
                textAlign:'left',
                border:`1px solid ${bd}`,
                background:bg,
                borderRadius:8,
                padding:8,
                minHeight:70,
                opacity: inMonth ? 1 : 0.5,
                cursor:'pointer'
              }}
            >
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                <span style={{fontSize:12, opacity:0.7}}>{iso.slice(-2)}/{iso.slice(5,7)}</span>
                <span style={{fontSize:11, opacity:0.6}}>{STATUS_LABEL[status]}</span>
              </div>
              {cell?.updated_at && (
                <div style={{marginTop:6, fontSize:10, opacity:0.6}}>
                  MAJ {new Date(cell.updated_at).toLocaleDateString('fr-FR')}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Legend />
    </div>
  );
}

// ---- Sous-composants
function Info({label, value}) {
  return (
    <div style={{display:'grid', gap:4}}>
      <div style={{fontSize:12, opacity:0.7}}>{label}</div>
      <div>{value}</div>
    </div>
  );
}

function Legend(){
  const items = [
    {k:'', label:'(vide)'},
    {k:'dispo', label:'Disponible'},
    {k:'mission', label:'En mission'},
    {k:'indispo', label:'Indisponible'},
  ];
  return (
    <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', marginTop:8}}>
      <strong>Légende :</strong>
      {items.map(({k,label})=>(
        <span key={k} style={{
          display:'inline-flex', alignItems:'center', gap:6, border:`1px solid ${STATUS_BORDER[k]}`,
          background: STATUS_BG[k], padding:'4px 8px', borderRadius:12, fontSize:13
        }}>
          <span style={{width:10, height:10, borderRadius:999, background:STATUS_BORDER[k]}} />
          {label}
        </span>
      ))}
      <span style={{opacity:0.7, fontSize:12}}>• Cliquer une case pour changer l’état (cycle)</span>
    </div>
  );
}

// ---- Chargement des dispos du mois
async function fetchMonth(trainerId, refDate, setAvail, setGlobalUpdatedAt){
  const from = startOfMonth(refDate);
  const to = endOfMonth(refDate);
  const fromISO = toISODate(from);
  const toISO = toISODate(to);

  const { data, error } = await supabase
    .from('trainer_availability')
    .select('*')
    .eq('trainer_id', trainerId)
    .gte('day', fromISO)
    .lte('day', toISO);

  if (error) {
    console.error('Load availability error:', error);
    return;
  }

  const map = {};
  let maxUpdated = null;
  for (const row of (data||[])){
    map[row.day] = { status: row.status, updated_at: row.updated_at, id: row.id };
    if (!maxUpdated || new Date(row.updated_at) > new Date(maxUpdated)) maxUpdated = row.updated_at;
  }
  setAvail(map);
  setGlobalUpdatedAt(maxUpdated);
}
