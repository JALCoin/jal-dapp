// src/pages/CryptoGeneratorIntro.tsx
import { Link } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function CryptoGeneratorIntro() {
  return (
    <main className="homepage">
      {/* Wallet Button */}
      <div
        className="wallet-button"
        style={{
          marginTop: "3rem",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <WalletMultiButton />
      </div>

      {/* Intro Section */}
      <section>
        <h1>Your Vault Starts Here</h1>
        <p>
          Influence becomes infrastructure. This is where you mint your identity.
        </p>
        <div className="centered-button">
          <Link to="/crypto-generator/engine" className="button">
            Begin Full Process
          </Link>
        </div>
      </section>

      {/* Step Cards */}
      <section className="section-group flex flex-col items-center gap-6 mt-6">
        {[
          {
            title: "🪙 Mint a Token",
            desc: "Create your SPL token directly from your wallet. Instant. Permissionless.",
            link: "/crypto-generator/engine#step1",
            label: "Go to Mint",
          },
          {
            title: "🧬 Attach Metadata",
            desc: "Name it. Symbol it. Upload the logo. All saved to the chain.",
            link: "/crypto-generator/engine#step5",
            label: "Finalize Metadata",
          },
          {
            title: "🚀 Use It",
            desc: "Send it. Grow it. Launch with it. Power a currency around who you are.",
            link: "/dashboard",
            label: "View Tools",
          },
        ].map(({ title, desc, link, label }) => (
          <div
            key={title}
            className="card w-full max-w-md text-center mx-auto"
          >
            <h2>{title}</h2>
            <p>{desc}</p>
            <div className="centered-button">
              <Link to={link} className="button">
                {label}
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* Already Minted */}
      <section>
        <h2>Already minted?</h2>
        <div className="centered-button">
          <Link to="/dashboard" className="button secondary">
            View My Vault
          </Link>
        </div>
      </section>
    </main>
  );
}
