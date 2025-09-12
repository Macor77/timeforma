// src/App.jsx
import { Routes, Route, Link } from 'react-router-dom';
import Listing from './pages/Listing.jsx';
import FormateurViewPage from './pages/FormateurView.jsx'; // ✅ alias pour éviter le conflit

function HomeTest() { 
  return <div style={{ padding: 20 }}>🏠 HomeTest OK</div>; 
}

function NotFound() { 
  return <div style={{ padding: 20, color: '#b00' }}>404 route inconnue</div>; 
}

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui', padding: 12 }}>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <Link to="/">Home</Link>
        <Link to="/listing">Listing</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomeTest />} />
        <Route path="/listing" element={<Listing />} />
        <Route path="/formateur/:index" element={<FormateurViewPage />} /> {/* ✅ route vers la fiche */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
