import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Smoke-test hook: /?seed=1 plants a stored session before the app renders,
// so a single page load exercises the provider's persistence hydration.
if (new URLSearchParams(window.location.search).has('seed')) {
  const now = Date.now();
  localStorage.setItem(
    'chat-kit:v1:sessions',
    JSON.stringify([{ id: 'seeded', title: 'Seeded conversation', createdAt: now, updatedAt: now }]),
  );
  localStorage.setItem(
    'chat-kit:v1:messages:seeded',
    JSON.stringify([
      { kind: 'text', id: 'u1', role: 'user', content: 'seeded question', status: 'complete', createdAt: now },
      { kind: 'text', id: 'a1', role: 'assistant', content: 'seeded answer', status: 'complete', createdAt: now },
    ]),
  );
}

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
