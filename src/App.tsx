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
    <div className="min-h-screen bg-[#0b0f0e] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-10">
        
        {/* Logo side */}
        <div className="w-full md:w-1/2 flex justify-center">
          <img
            src="/JALSOL1.gif"
            alt="JAL SOL"
            className="max-w-full h-auto rounded-lg shadow-xl"
          />
        </div>

        {/* Text + Action side */}
        <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            JAL Token Creator
          </h1>
          <p className="text-lg text-[#11f1a7]">
            Build your vault. Transact with time. The future doesn’t ask—it mints.
          </p>
          <Link
            to="/create-token"
            className="inline-block bg-[#11f1a7] hover:bg-emerald-400 text-black font-semibold py-3 px-6 rounded-lg transition"
          >
            Begin Creation ↗
          </Link>
        </div>
      </div>
    </div>
  );
}

export default App;
