// src/App.jsx
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Listing from './pages/Listing.jsx';
import FormateurForm from './pages/FormateurForm.jsx';
import FormateurViewPage from './pages/FormateurView.jsx';

function NotFound() {
  return <div style={{ padding: 20, color: '#b00' }}>404 route inconnue</div>;
}

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui', padding: 12 }}>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <Link to="/listing">Listing</Link>
        <Link to="/formateur/new">Ajouter un formateur</Link>
      </nav>

      <Routes>
        {/* Redirige la racine vers /listing */}
        <Route path="/" element={<Navigate to="/listing" replace />} />

        {/* Pages */}
        <Route path="/listing" element={<Listing />} />
        <Route path="/formateur/new" element={<FormateurForm />} />
        <Route path="/formateur/edit/:index" element={<FormateurForm />} />
        <Route path="/formateur/view/:index" element={<FormateurViewPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
