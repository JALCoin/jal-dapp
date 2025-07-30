// src/App.tsx
import type { FC } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CreateToken from './pages/CreateToken';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const App: FC = () => {
  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-token" element={<CreateToken />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </Router>
  );
};

const Header: FC = () => (
  <header className="flex items-center justify-between px-4 py-3 bg-black text-white shadow-md">
    <div className="flex items-center gap-4">
      <img src="/JALSOL1.gif" alt="JAL Vault Logo" className="h-12 w-auto" />
      <nav className="flex gap-4 text-sm">
        <Link to="/" className="hover:text-[var(--jal-glow)]">Home</Link>
        <Link to="/create-token" className="hover:text-[var(--jal-glow)]">Create Token</Link>
        <Link to="/dashboard" className="hover:text-[var(--jal-glow)]">Dashboard</Link>
      </nav>
    </div>
    <div className="wallet-button">
      <WalletMultiButton />
    </div>
  </header>
);

export default App;
