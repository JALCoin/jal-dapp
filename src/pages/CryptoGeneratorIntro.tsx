// src/pages/CryptoGeneratorIntro.tsx
import { Link } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function CryptoGeneratorIntro() {
  return (
    <main className="homepage">
      {/* 🔐 Connect Wallet */}
      <div className="wallet-button" style={{ marginTop: "3rem", display: "flex", justifyContent: "center" }}>
        <WalletMultiButton />
      </div>

      {/* 🚀 Generator Intro */}
      <section className="hero mt-6">
        <h1 className="hero-glow">Generate Your Currency</h1>
        <p className="text-center text-[var(--jal-muted)] max-w-2xl mx-auto">
          Create a Solana token with Neutral Reputation status. Attach identity, finality, and visibility all on-chain.
          Your vault, your symbol, your legacy.
        </p>
        <div className="centered-button mt-4">
          <Link to="/crypto-generator/engine" className="button gold">Start Generation</Link>
        </div>
      </section>

      {/* ⚙️ Generator Steps */}
      <section className="section-group flex flex-col items-center gap-6 mt-12">
        {[
          {
            title: "Mint a Token",
            desc: "Use your Phantom wallet to create a token on Solana. You define the total supply and mint authority.",
            link: "/crypto-generator/engine#step1",
            label: "Go to Mint",
          },
          {
            title: "Attach Metadata",
            desc: "Add name, symbol, and logo. Upload via Lighthouse and finalize through Metaplex.",
            link: "/crypto-generator/engine#step5",
            label: "Finalize Metadata",
          },
          {
            title: "Access Your Vault",
            desc: "Once complete, your token gets a permanent on-chain identity: jalsol.com/VAULT/YOURSYMBOL",
            link: "/dashboard",
            label: "View Vault",
          },
        ].map(({ title, desc, link, label }) => (
          <div key={title} className="card w-full max-w-md text-center mx-auto">
            <h2>{title}</h2>
            <p className="text-[var(--jal-muted)]">{desc}</p>
            <div className="centered-button mt-4">
              <Link to={link} className="button">{label}</Link>
            </div>
          </div>
        ))}
      </section>

      {/* 🔁 Already Generated */}
      <section className="mt-12 text-center">
        <h2 className="text-xl text-white font-semibold mb-2">Already created your token?</h2>
        <div className="centered-button">
          <Link to="/dashboard" className="button secondary">Go to Vault</Link>
        </div>
      </section>

      {/* 📭 Footer */}
      <footer className="site-footer mt-16">
        Computed on SOL • Vaulted by JAL • 358jal@gmail.com
      </footer>
    </main>
  );
}
