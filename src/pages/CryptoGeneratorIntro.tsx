// src/pages/CryptoGeneratorIntro.tsx
import { Link } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function CryptoGeneratorIntro() {
  return (
    <main className="homepage">
      <div className="wallet-button" style={{ marginTop: "3rem", display: "flex", justifyContent: "center" }}>
        <WalletMultiButton />
      </div>

      <section>
        <h1>Generate Your Currency</h1>
        <p>
          This utility lets you create a Solana token with Neutral Reputation status according to Solscan guidelines.
          Your vault, your symbol, your web link.
        </p>
        <div className="centered-button">
          <Link to="/crypto-generator/engine" className="button">
            Start Generation
          </Link>
        </div>
      </section>

      <section className="section-group flex flex-col items-center gap-6 mt-6">
        {[
          {
            title: "Mint a Token",
            desc: "Create your token on Solana using your wallet. You control the supply and mint authority.",
            link: "/crypto-generator/engine#step1",
            label: "Go to Mint",
          },
          {
            title: "Attach Metadata",
            desc: "Provide a name, symbol, and logo. Upload to Lighthouse and finalize with Metaplex.",
            link: "/crypto-generator/engine#step5",
            label: "Finalize Metadata",
          },
          {
            title: "Access Your Vault",
            desc: "After completion, your token will be visible at jalsol.com/VAULT/YourSymbol.",
            link: "/dashboard",
            label: "View Vault",
          },
        ].map(({ title, desc, link, label }) => (
          <div key={title} className="card w-full max-w-md text-center mx-auto">
            <h2>{title}</h2>
            <p>{desc}</p>
            <div className="centered-button">
              <Link to={link} className="button">{label}</Link>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>Already created your token?</h2>
        <div className="centered-button">
          <Link to="/dashboard" className="button secondary">
            Go to Vault
          </Link>
        </div>
      </section>
    </main>
  );
}
