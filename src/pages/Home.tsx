// src/pages/Home.tsx
import { Link } from "react-router-dom";
import { generatorInfoBlocks } from "./CryptoGeneratorIntro";
import { useEffect, useState } from "react";

export default function Home() {
  const [userSymbol, setUserSymbol] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("vaultSymbol");
    if (stored) setUserSymbol(stored.toUpperCase());
  }, []);

  return (
    <main className="homepage">
      {/* === HERO === */}
      <section className="hero vault-unlock">
        <h1 className="hero-glow">Plenty is built. I’m created.</h1>
        <p className="text-green-500 text-center">
          Tokenised by JAL & this is your VAULT. Computed on SOL & mint into something real.
        </p>
        <div className="cta-buttons">
          <Link
            to={userSymbol ? `/vault/${userSymbol}` : "/dashboard"}
            className="button gold"
          >
            CREATE YOUR CURRENCY
          </Link>
        </div>
      </section>

      {/* === INFO CARDS === */}
      <section className="section-group">
        {generatorInfoBlocks.map((block, i) => (
          <div key={i} className="card vault-unlock">
            <h2>{block.title}</h2>
            {Array.isArray(block.content)
              ? block.content.map((p, idx) => <p key={idx}>{p}</p>)
              : <p>{block.content}</p>}
            {block.link && (
              <div className="centered-button mt-4">
                <Link to={block.link.href} className="button">
                  {block.link.label.toUpperCase()}
                </Link>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* === ABOUT CARD === */}
      <section className="section-group">
        <div className="card dark vault-unlock">
          <h2>About JAL</h2>
          <p>
            I’m Jeremy Aaron Lugg. Born with it and built for it.<br />
            JAL/SOL is how I prove that influence can become infrastructure.
          </p>
          <div className="cta-buttons">
            <a
              href="https://x.com/JAL358"
              className="button"
              target="_blank"
              rel="noopener noreferrer"
            >
              X PROFILE
            </a>
            <a href="mailto:358jal@gmail.com" className="button">
              CONTACT
            </a>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="site-footer">
        © 2025 JAL/SOL • Computed by SOL • 358jal@gmail.com
      </footer>
    </main>
  );
}
