// Polyfills must come FIRST
import { Buffer } from 'buffer';
import process from 'process';

window.Buffer = Buffer;
window.process = process;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AppProviders } from './AppProviders';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
