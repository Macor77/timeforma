// src/components/AvailabilityCalendar.jsx
import { useMemo, useState } from 'react';

// États possibles pour un jour
const STATES = [null, 'dispo', 'indispo', 'mission']; // cycle: vide → dispo → indispo → mission → vide

// utils dates
function pad(n) { return n.toString().padStart(2, '0'); }
function ymd(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function firstDayOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function daysInMonth(year, month /* 0-based */) {
  return new Date(year, month + 1, 0).getDate();
}
// Lundi = 0, Mardi = 1, ... Dimanche = 6
function mondayFirstIndex(jsDay /*0=Dimanche...6=Samedi*/) {
  return (jsDay + 6) % 7;
}

export default function AvailabilityCalendar({
  initialMonthDate = new Date(),
  value = {},            // { 'YYYY-MM-DD': 'dispo' | 'indispo' | 'mission' }
  onChange = () => {},   // (updatedMap) => void
  title = 'Disponibilités',
}) {
  const [cursor, setCursor] = useState(() => {
    // on ancre sur le premier jour du mois affiché
    const d = new Date(initialMonthDate);
    return firstDayOfMonth(d);
  });

  // recalcul du tableau du mois
  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = firstDayOfMonth(cursor);
    const leading = mondayFirstIndex(first.getDay()); // cases vides en tête
    const totalDays = daysInMonth(year, month);
    const cells = [];

    // cases vides avant le 1er
    for (let i = 0; i < leading; i++) {
      cells.push({ empty: true, key: `e-${i}` });
    }
    // jours du mois
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const key = ymd(d);
      cells.push({ empty: false, day, key });
    }
    return cells;
  }, [cursor]);

  const monthLabel = useMemo(() => {
    return cursor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }, [cursor]);

  const handlePrev = () => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  };
  const handleNext = () => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  };

  const handleClickDay = (key) => {
    // cycle d'état: null -> dispo -> indispo -> mission -> null
    const current = value[key] ?? null;
    const idx = STATES.indexOf(current);
    const next = STATES[(idx + 1) % STATES.length];
    const updated = { ...value };
    if (next === null) {
      delete updated[key];
    } else {
      updated[key] = next;
    }
    onChange(updated);
  };

  const colorFor = (state) => {
    switch (state) {
      case 'dispo': return '#16a34a';   // vert
      case 'indispo': return '#dc2626'; // rouge
      case 'mission': return '#d97706'; // orange
      default: return '#e5e7eb';        // gris clair (vide)
    }
  };

  const badgeLabel = (state) => {
    switch (state) {
      case 'dispo': return 'Disponible';
      case 'indispo': return 'Indisponible';
      case 'mission': return 'Mission';
      default: return '—';
    }
  };

  const headStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  };
  const navBtn = {
    border: '1px solid #ddd',
    background: '#fff',
    borderRadius: 8,
    padding: '6px 10px',
    cursor: 'pointer',
  };
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 6,
  };
  const dayNameStyle = {
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: 600,
  };
  const cellStyleBase = {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    background: '#fff',
    minHeight: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: 'pointer',
    userSelect: 'none',
  };
  const dayNumberStyle = {
    position: 'absolute',
    top: 6,
    left: 8,
    fontSize: 12,
    color: '#6b7280',
  };
  const legendItemStyle = { display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 12, fontSize: 13 };

  return (
    <div style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#fafafa' }}>
      <div style={headStyle}>
        <strong style={{ fontSize: 16 }}>{title}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={handlePrev} style={navBtn} title="Mois précédent">←</button>
          <div style={{ minWidth: 160, textAlign: 'center', fontWeight: 600, textTransform: 'capitalize' }}>
            {monthLabel}
          </div>
          <button type="button" onClick={handleNext} style={navBtn} title="Mois suivant">→</button>
        </div>
      </div>

      {/* entêtes jours */}
      <div style={gridStyle}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
          <div key={d} style={dayNameStyle}>{d}</div>
        ))}
      </div>

      {/* grille jours */}
      <div style={gridStyle}>
        {grid.map((cell) => {
          if (cell.empty) {
            return <div key={cell.key} style={{ visibility: 'hidden' }} />;
          }
          const state = value[cell.key];
          const cellStyle = {
            ...cellStyleBase,
            boxShadow: state ? `inset 0 0 0 9999px ${colorFor(state)}22` : undefined,
            borderColor: state ? colorFor(state) : '#e5e7eb',
          };
          return (
            <div
              key={cell.key}
              onClick={() => handleClickDay(cell.key)}
              style={cellStyle}
              title={`${cell.key} — ${badgeLabel(state)}`}
            >
              <span style={dayNumberStyle}>{cell.day}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: colorFor(state) }}>
                {state ? badgeLabel(state) : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div style={{ marginTop: 10 }}>
        <span style={legendItemStyle}><span style={{ width: 10, height: 10, background: '#16a34a', display: 'inline-block', borderRadius: 3 }} /> Disponible</span>
        <span style={legendItemStyle}><span style={{ width: 10, height: 10, background: '#dc2626', display: 'inline-block', borderRadius: 3 }} /> Indisponible</span>
        <span style={legendItemStyle}><span style={{ width: 10, height: 10, background: '#d97706', display: 'inline-block', borderRadius: 3 }} /> Mission</span>
        <span style={legendItemStyle}><span style={{ width: 10, height: 10, background: '#e5e7eb', display: 'inline-block', borderRadius: 3 }} /> (vide)</span>
      </div>
    </div>
  );
}
