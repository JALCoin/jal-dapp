import type { FC } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CryptoGenerator from './pages/CryptoGenerator';
import CryptoGeneratorIntro from './pages/CryptoGeneratorIntro';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';

const App: FC = () => {
  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/crypto-generator" element={<CryptoGeneratorIntro />} />
          <Route path="/crypto-generator/engine" element={<CryptoGenerator />} />
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
        <Link to="/crypto-generator">Crypto Generator</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
    </div>
  </header>
);

export default App;
