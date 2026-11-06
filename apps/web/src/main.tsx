import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Web from './index.js';
import RootLayout from './components/layout.js';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing root element for the web application.');
}

createRoot(rootElement).render(
  <StrictMode>
    <RootLayout>
      <Web />
    </RootLayout>
  </StrictMode>,
);
