import { Buffer } from 'buffer';
import process from 'process';

(window as any).Buffer = Buffer;
(window as any).process = process;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProviders } from './AppProviders';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
