import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CreateToken from './pages/CreateToken';
import Dashboard from './pages/Dashboard'; // ✅ added
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AppProviders } from './AppProviders';

function App() {
  return (
    <AppProviders>
      <Router>
        <header className="bg-black text-white p-4 flex justify-between items-center">
          <div className="text-xl font-bold">JAL Token Creator</div>
          <WalletMultiButton />
        </header>

        <nav className="bg-gray-800 text-white p-2 flex gap-4 justify-center">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/create-token" className="hover:underline">Create Token</Link>
        </nav>

        <main className="min-h-screen bg-white text-black p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-token" element={<CreateToken />} />
            <Route path="/dashboard" element={<Dashboard />} /> {/* ✅ added */}
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
        <img
          src="/JALSOL1.gif"
          alt="JAL Vault"
          className="logo animated"
        />
        <h1 className="text-4xl font-extrabold text-black">JAL Token Creator</h1>
        <p className="text-lg text-black">
          Build your vault. Transact with time. The future doesn’t ask—it mints.
        </p>
        <Link
          to="/create-token"
          className="button"
        >
          Begin Creation ↗
        </Link>
      </div>
    </main>
  );
}
export default App;
