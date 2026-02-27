// src/pages/JalSol.tsx
import { useMemo, useState } from "react";

type Link = { label: string; href: string; note?: string };

function CopyRow({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // fallback: do nothing (clipboard may be blocked)
    }
  };

  return (
    <div className="jal-row" aria-label={label}>
      <div className="jal-row-label">{label}</div>

      <div className={`jal-row-value ${mono ? "is-mono" : ""}`}>
        <span className="jal-row-text">{value}</span>

        <button type="button" className="jal-copy" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function QuickLinks({ links }: { links: Link[] }) {
  return (
    <div className="jal-links" aria-label="JAL/SOL links">
      {links.map((l) => (
        <a key={l.href} className="chip" href={l.href} target="_blank" rel="noreferrer">
          {l.label}
        </a>
      ))}
    </div>
  );
}

export default function JalSol() {
  // TODO: Replace these when you want to “lock” canonical IDs.
  // Keep them empty if you’re not ready; the UI still looks correct.
  const JAL_MINT = ""; // ex: "..."
  const RAYDIUM_POOL = ""; // ex: "..."
  const SOLSCAN_JAL = "https://solscan.io/";
  const RAYDIUM = "https://raydium.io/";

  const links = useMemo<Link[]>(
    () => [
      { label: "Raydium", href: RAYDIUM },
      { label: "Solscan", href: SOLSCAN_JAL },
      // Optional: DexScreener / Birdeye / Jupiter links later
    ],
    []
  );

  return (
    <main className="home-shell jal-shell" aria-label="JAL/SOL">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          {/* HERO */}
          <div className="jal-hero">
            <div className="jal-hero-top">
              <div className="jal-kicker">JAL / SOL</div>
              <div className="jal-status">
                <span className="jal-status-dot" aria-hidden="true" />
                <span className="jal-status-text">Liquidity console</span>
              </div>
            </div>

            <h1 className="home-title jal-title">JAL/SOL</h1>

            <p className="home-lead jal-lead">
              The market-facing pool. This page becomes the clean “console view” for verification, routing,
              and future on-site checkout flows.
            </p>

            <QuickLinks links={links} />
          </div>

          {/* CONSOLE GRID */}
          <div className="jal-grid" aria-label="JAL/SOL console bays">
            <section className="jal-bay" aria-label="Verification">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Verification</div>
                <div className="jal-bay-note">Canonical IDs (when you’re ready)</div>
              </div>

              <div className="jal-rows">
                <CopyRow
                  label="JAL mint"
                  value={JAL_MINT || "Set later (leave blank for now)"}
                  mono
                />
                <CopyRow
                  label="Raydium pool"
                  value={RAYDIUM_POOL || "Set later (leave blank for now)"}
                  mono
                />
              </div>

              <div className="jal-bay-actions">
                <a className="button ghost" href={RAYDIUM} target="_blank" rel="noreferrer">
                  Open Raydium
                </a>
                <a className="button ghost" href={SOLSCAN_JAL} target="_blank" rel="noreferrer">
                  Open Solscan
                </a>
              </div>
            </section>

            <section className="jal-bay" aria-label="Acquire">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Acquire</div>
                <div className="jal-bay-note">Simple, calm, non-hype routing</div>
              </div>

              <ol className="jal-steps" aria-label="How to acquire">
                <li>
                  Hold SOL in your wallet.
                  <span className="jal-step-sub">SOL is the bridge asset for routing.</span>
                </li>
                <li>
                  Open Raydium and locate the JAL/SOL pool.
                  <span className="jal-step-sub">Verify mint + pool IDs once set above.</span>
                </li>
                <li>
                  Swap SOL → JAL, then verify on-chain.
                  <span className="jal-step-sub">Solscan becomes the final check.</span>
                </li>
              </ol>

              <div className="jal-bay-actions">
                <a className="button neon" href={RAYDIUM} target="_blank" rel="noreferrer">
                  Route via Raydium
                </a>
                <a className="button" href={SOLSCAN_JAL} target="_blank" rel="noreferrer">
                  Verify on Solscan
                </a>
              </div>
            </section>

            <section className="jal-bay jal-bay-wide" aria-label="Notes">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Notes</div>
                <div className="jal-bay-note">Storefront alignment</div>
              </div>

              <p className="jal-note">
                This console stays clean by design: verification, routing, and the future direct-checkout layer.
                No urgency. No noise. Order first.
              </p>

              <div className="jal-bullets" aria-label="Guidance">
                <div className="jal-bullet">
                  <div className="jal-bullet-k">Design rule</div>
                  <div className="jal-bullet-v">This page is “proof + pathway”, not marketing.</div>
                </div>
                <div className="jal-bullet">
                  <div className="jal-bullet-k">Next step</div>
                  <div className="jal-bullet-v">Add live pool widgets (DexScreener/Birdeye) as embedded bays.</div>
                </div>
                <div className="jal-bullet">
                  <div className="jal-bullet-k">Store tie-in</div>
                  <div className="jal-bullet-v">When checkout is live, this becomes the “currency layer” entry.</div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}