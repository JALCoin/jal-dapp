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
    <div className="text-center mt-16">
      <h1 className="text-4xl font-bold mb-4">Welcome to JAL Token Creator</h1>
      <p className="text-lg text-gray-700">Use the navigation above to mint your own SPL token on Solana.</p>
    </div>
  );
}

export default App;
