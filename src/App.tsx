import { FC } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import CreateToken from './pages/CreateToken';
import Dashboard from './pages/Dashboard';
import TurnIntoCurrency from './pages/TurnIntoCurrency';

const Home: FC = () => (
  <main>
    <div className="container">
      <h1>Turn Tokens Into Currency</h1>
      <p>Welcome to the JAL/SOL Token Creator. You can mint your own Solana tokens, and finalize them as real currency with metadata.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <Link to="/create-token" className="button">Create Token</Link>
        <Link to="/dashboard" className="button">My Tokens</Link>
        <WalletMultiButton />
      </div>
    </div>
  </main>
);

const App: FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-token" element={<CreateToken />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/turn-into-currency" element={<TurnIntoCurrency />} />
      </Routes>
    </Router>
  );
};

export default App;
