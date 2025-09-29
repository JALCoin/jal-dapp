// src/pages/Landing.tsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { JAL_MINT } from "../config/tokens";

export default function Landing() {
  const mint = String(JAL_MINT);

  const swapUrl = useMemo(
    () =>
      `https://raydium.io/swap/?inputCurrency=SOL&outputCurrency=${encodeURIComponent(
        mint
      )}&fixed=in`,
    [mint]
  );

  return (
    <main className="landing-simple">
      <div className="landing-simple-inner">
        {/* Removed middle GIF */}

        <p className="hero-sub">Choose an action to get started.</p>

        <div className="bss-row bss-row--big">
          {/* BUY → Shop panel */}
          <Link className="bss-btn buy" to="/?panel=shop">
            BUY
          </Link>

          {/* SWAP → Raydium (new tab) */}
          <a
            className="bss-btn swap"
            href={swapUrl}
            target="_blank"
            rel="noreferrer"
          >
            SWAP
          </a>

          {/* SELL → Sell page */}
          <Link className="bss-btn sell" to="/sell">
            SELL
          </Link>
        </div>

        <p className="hint" style={{ marginTop: "1rem" }}>
          <strong>SWAP</strong> opens Raydium in a new tab.
        </p>
      </div>
    </main>
  );
}
