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
    <div className="relative flex flex-col items-center justify-center min-h-screen text-center overflow-hidden bg-[#0b0f0e]">
      {/* Brand GIF as motion background */}
      <img
        src="/JALSOL1.gif"
        alt="digital motion"
        className="absolute top-0 left-0 w-full h-full object-cover opacity-20 z-0"
      />

      {/* Content */}
      <div className="z-10 relative space-y-6 px-4">
        <h1 className="text-5xl font-extrabold text-white tracking-wide">
          JAL Token Creator
        </h1>
        <p className="text-md text-[#11f1a7] max-w-xl mx-auto">
          Build your vault. Transact with time. The future doesn’t ask—it mints.
        </p>
        <Link
          to="/create-token"
          className="px-6 py-3 bg-[#11f1a7] hover:bg-emerald-400 text-black font-semibold rounded-lg transition"
        >
          Begin Creation ↗
        </Link>
      </div>
    </div>
  );
}

export default App;
