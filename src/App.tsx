import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CreateToken from './pages/CreateToken';
import { AppProviders } from './AppProviders';

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <nav className="p-4 bg-black text-white flex justify-center gap-4">
          <Link to="/">Home</Link>
          <Link to="/create-token">Create Token</Link>
        </nav>
        <Routes>
          <Route path="/" element={<div className="p-6 text-white">Welcome to JAL Token Creator</div>} />
          <Route path="/create-token" element={<CreateToken />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
