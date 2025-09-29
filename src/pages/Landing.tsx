// src/pages/Landing.tsx
import React, { useMemo } from "react";
import { JAL_MINT } from "../config/tokens";

export default function Landing() {
  const mint = String(JAL_MINT);

  // Pre-filled Raydium links
  const buyUrl = useMemo(
    () =>
      `https://raydium.io/swap/?inputCurrency=SOL&outputCurrency=${encodeURIComponent(
        mint
      )}&fixed=in`,
    [mint]
  );

  const sellUrl = useMemo(
    () =>
      `https://raydium.io/swap/?inputCurrency=${encodeURIComponent(
        mint
      )}&outputCurrency=SOL&fixed=in`,
    [mint]
  );

  // Generic swap (users can change either side)
  const swapUrl = useMemo(
    () =>
      `https://raydium.io/swap/?inputCurrency=SOL&outputCurrency=${encodeURIComponent(
        mint
      )}`,
    [mint]
  );

  return (
    <main className="landing-simple">
      <div className="landing-simple-inner">
        <img className="logo-simple" src="/JALSOL1.gif" alt="JAL/SOL" />

        <h1 className="hero-title">JAL / SOL</h1>
        <p className="hero-sub">Choose an action to get started.</p>

        <div className="bss-row bss-row--big">
          <a className="bss-btn buy"  href={buyUrl}  target="_blank" rel="noreferrer">BUY</a>
          <a className="bss-btn swap" href={swapUrl} target="_blank" rel="noreferrer">SWAP</a>
          <a className="bss-btn sell" href={sellUrl} target="_blank" rel="noreferrer">SELL</a>
        </div>

        <p className="hint">Opens Raydium in a new tab. Connect your wallet there.</p>
      </div>
    </main>
  );
}
