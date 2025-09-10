// App.jsx - routes complètes avec FormateurView
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Listing from './pages/Listing';
import FormateurForm from './pages/FormateurForm';
import FormateurView from './pages/FormateurView';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/listing" element={<Listing />} />
        <Route path="/formateur/new" element={<FormateurForm />} />
        <Route path="/formateur/edit/:index" element={<FormateurForm />} />
        <Route path="/formateur/view/:index" element={<FormateurView />} />
      </Routes>
    </Router>
  );
}
