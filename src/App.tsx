import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CreateToken from './pages/CreateToken';
import Dashboard from './pages/Dashboard';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AppProviders } from './AppProviders';

function App() {
  return (
    <AppProviders>
      <Router>
        <header className="flex flex-col items-center text-center py-6 gap-4">
          <img
            src="/JALSOL1.gif"
            alt="JAL Vault Logo"
            className="w-32 h-32 object-contain"
          />
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <nav className="flex gap-6 text-black font-semibold text-sm">
              <Link to="/" className="hover:underline">Home</Link>
              <Link to="/create-token" className="hover:underline">Create Token</Link>
            </nav>
            <WalletMultiButton />
          </div>
        </header>

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
}

function Home() {
  return (
    <main className="bg-[#11f1a7] min-h-screen w-full flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col items-center text-center gap-8">
        <h1 className="text-4xl font-extrabold text-black">JAL Token Creator</h1>
        <p className="text-lg text-black">
          Build your vault. Transact with time. The future doesn’t ask—it mints.
        </p>
        <Link to="/create-token" className="button">
          Begin Creation ↗
        </Link>
      </div>
    </main>
  );
}

export default App;
