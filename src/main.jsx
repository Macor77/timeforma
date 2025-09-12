// src/main.jsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);
