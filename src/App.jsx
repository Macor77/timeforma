// src/App.jsx
import { Routes, Route, Link } from "react-router-dom";

import Listing from "./pages/Listing";
import FormateurForm from "./pages/FormateurForm";
import FormateurView from "./pages/FormateurView";
import MigrateLocal from "./pages/MigrateLocal"; // outil temporaire
import EnvCheck from "./pages/EnvCheck";         // page de diagnostic

export default function App() {
  return (
    <div style={{ padding: "16px", fontFamily: "Arial, sans-serif" }}>
      <nav style={{ marginBottom: 12 }}>
        <Link to="/listing" style={{ marginRight: 12 }}>Listing</Link>
        <Link to="/formateur/new" style={{ marginRight: 12 }}>Ajouter un formateur</Link>
        <Link to="/env-check" style={{ fontWeight: 600, color: "green" }}>🧩 Vérifier Supabase</Link>
      </nav>

      <Routes>
        {/* Accueil */}
        <Route path="/" element={<Listing />} />
        <Route path="/listing" element={<Listing />} />

        {/* Fiche & édition par ID Supabase */}
        <Route path="/formateur/view/:id" element={<FormateurView />} />
        <Route path="/formateur/edit/:id" element={<FormateurForm />} />

        {/* Création */}
        <Route path="/formateur/new" element={<FormateurForm />} />

        {/* Outils */}
        <Route path="/migrate-local" element={<MigrateLocal />} />
        <Route path="/env-check" element={<EnvCheck />} />
      </Routes>
    </div>
  );
}
