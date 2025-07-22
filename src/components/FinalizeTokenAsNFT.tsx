import type { FC } from 'react';
import { useState } from 'react';

export interface FinalizeData {
  name: string;
  symbol: string;
  description: string;
  imageFile: File | null;
  lighthouseApiKey: string;
}

interface FinalizeProps {
  mint: string;
  onClose: () => void;
  onSubmit: (metadata: FinalizeData) => void;
}

const FinalizeTokenAsNFT: FC<FinalizeProps> = ({ mint, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [lighthouseApiKey, setLighthouseApiKey] = useState('');

  return (
    <div style={overlayStyle}>
      <div className="container" style={modalStyle}>
        <h1>Finalize Token</h1>
        <p style={{ marginBottom: '1.5rem' }}>
          <strong>Mint:</strong>{' '}
          <span style={{ wordBreak: 'break-word' }}>{mint}</span>
        </p>

        <div style={formStyle}>
          <input
            type="text"
            placeholder="Token Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Token Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />

          <textarea
            placeholder="Token Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />

          <input
            type="password"
            placeholder="Lighthouse API Key"
            value={lighthouseApiKey}
            onChange={(e) => setLighthouseApiKey(e.target.value)}
          />

          <button
            className="button"
            onClick={() =>
              onSubmit({
                name,
                symbol,
                description,
                imageFile,
                lighthouseApiKey,
              })
            }
          >
            Upload & Finalize
          </button>

          <button
            className="button"
            style={{
              backgroundColor: '#222',
              color: 'white',
              marginTop: '1rem',
            }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.5)',
  zIndex: 9999,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  paddingTop: '5vh',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--jal-bg)',
  padding: '2rem',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '560px',
  boxShadow: '0 0 20px rgba(0,0,0,0.25)',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

export default FinalizeTokenAsNFT;
