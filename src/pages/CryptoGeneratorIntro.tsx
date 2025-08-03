// src/pages/CryptoGeneratorIntro.tsx
import { Link } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function CryptoGeneratorIntro() {
  return (
    <main className="homepage">
      {/* 🔐 Connect Wallet */}
      <div className="wallet-button mt-12 flex justify-center">
        <WalletMultiButton />
      </div>

      {/* 🚀 Generator Intro */}
      <section className="hero mt-10 text-center">
        <h1 className="hero-glow">Generate Your Currency</h1>
        <p className="text-[var(--jal-muted)] max-w-2xl mx-auto mt-4">
          Create a Solana token with Neutral Reputation status. Attach identity, finality, and visibility all on-chain.
          Your vault, your symbol, your legacy.
        </p>
        <div className="centered-button mt-6">
          <Link to="/crypto-generator/engine" className="button gold">Start Generation</Link>
        </div>
      </section>

      {/* ⚙️ Generator Steps */}
      <section className="section-group flex flex-col items-center gap-8 mt-16">
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
            <h2 className="text-white text-xl font-bold">{title}</h2>
            <p className="text-[var(--jal-muted)] mt-2">{desc}</p>
            <div className="centered-button mt-4">
              <Link to={link} className="button">{label}</Link>
            </div>
          </div>
        ))}
      </section>

      {/* 🔁 Already Generated */}
      <section className="mt-16 text-center">
        <h2 className="text-xl text-white font-semibold mb-2">Already created your token?</h2>
        <div className="centered-button">
          <Link to="/dashboard" className="button secondary">Go to Vault</Link>
        </div>
      </section>

      {/* 📭 Footer */}
      <footer className="site-footer mt-20 text-center text-[var(--jal-muted)] text-sm">
        Computed on SOL • Vaulted by JAL • 358jal@gmail.com
      </footer>
    </main>
  );
}
