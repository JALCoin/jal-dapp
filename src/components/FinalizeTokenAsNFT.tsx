// src/components/FinalizeTokenAsNFT.tsx
import type { FC } from 'react';
import { useState } from 'react';

interface FinalizeProps {
  mint: string;
  onClose: () => void;
  onSubmit: (metadata: FinalizeData) => void;
}

export interface FinalizeData {
  name: string;
  symbol: string;
  description: string;
  imageFile: File | null;
}

const FinalizeTokenAsNFT: FC<FinalizeProps> = ({ mint, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  return (
    <div style={overlayStyle}>
      <div className="container" style={modalStyle}>
        <h1>Finalize Token</h1>
        <p>Mint: {mint}</p>

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

        <button className="button" onClick={() => onSubmit({ name, symbol, description, imageFile })}>
          Upload & Finalize
        </button>

        <button className="button" style={{ backgroundColor: '#222', marginTop: '1rem' }} onClick={onClose}>
          Cancel
        </button>
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
};

export default FinalizeTokenAsNFT;
