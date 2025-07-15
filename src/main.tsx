import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

if (!(window as any).Buffer) {
  import('buffer').then(({ Buffer }) => {
    (window as any).Buffer = Buffer;
  });
}

if (!(window as any).process) {
  import('process').then((p) => {
    (window as any).process = p.default;
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
