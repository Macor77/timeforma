import { createRoot } from 'react-dom/client';

const el = document.getElementById('root');
console.log('BOOT', !!el ? 'root OK' : 'root MISSING');

createRoot(el).render(
  <div style={{fontFamily:'system-ui', padding:20}}>
    ✅ Vercel charge le JS. (test minimal)
  </div>
);
