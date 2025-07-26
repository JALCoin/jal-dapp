import type { FC } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CreateToken from './pages/CreateToken';
import Dashboard from './pages/Dashboard';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AppProviders } from './AppProviders';

const App: FC = () => {
  return (
    <AppProviders>
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
    </AppProviders>
  );
};

const Header: FC = () => (
  <header>
    <img src="/JALSOL1.gif" alt="JAL Vault Logo" />
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/create-token">Create Token</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <div className="wallet-button">
        <WalletMultiButton />
      </div>
    </div>
  </header>
);

const Home: FC = () => (
  <main>
    <div className="container">
      <h1>JAL Token Creator</h1>
      <p>Build your vault. Transact with time. The future doesn’t ask—it mints.</p>
      <Link to="/create-token" className="button">
        Begin Creation ↗
      </Link>
    </div>
  </main>
);

export default App;
