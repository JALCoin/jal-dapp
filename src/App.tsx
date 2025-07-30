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
  <header className="jal-header">
    <div className="header-inner">
      <img src="/JALSOL1.gif" alt="JAL Vault Logo" className="logo" />
      <nav>
        <Link to="/">Home</Link>
        <Link to="/create-token">Create Token</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
    </div>
  </header>
);

export default App;
