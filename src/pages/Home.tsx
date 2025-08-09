// src/pages/Home.tsx
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [userSymbol, setUserSymbol] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("vaultSymbol");
    if (stored) setUserSymbol(stored.toUpperCase());
  }, []);

  const vaultPath = useMemo(
    () => (userSymbol ? `/vault/${encodeURIComponent(userSymbol)}` : "/dashboard"),
    [userSymbol]
  );

  return (
    <main className="jal-page">
      <h1 className="jal-title">Choose your direction</h1>

      <div className="jal-buttons">
        <Link to="/crypto-generator" className="jal-button">
          Create Your Currency
        </Link>

        <Link to={vaultPath} className="jal-button secondary">
          {userSymbol ? `Open Vault / ${userSymbol}` : "Open Vault"}
        </Link>

        <Link to="/learn" className="jal-button secondary">
          Learn / SOL
        </Link>

        <Link to="/about" className="jal-button secondary">
          About JAL
        </Link>
      </div>

      <footer className="site-footer mt-3">
        © 2025 JAL/SOL • Computed by SOL • 358jal@gmail.com
      </footer>
    </main>
  );
}
