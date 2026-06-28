import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import {
  flowboardBoundaryItems,
  flowboardCopy,
  flowboardFuturePanels,
  flowboardPreviewItems,
} from "../lib/jalFlowboard";
import { JAL_COIN } from "../lib/jalCoin";

const officialReferences = [
  {
    id: "mint",
    label: "Official Coin Address",
    technicalLabel: "Mint",
    value: JAL_COIN.mintAddress,
    href: JAL_COIN.solscanMintUrl,
  },
  {
    id: "pool",
    label: "Trading Pool",
    technicalLabel: "Raydium pool",
    value: JAL_COIN.raydiumPoolAddress,
    href: JAL_COIN.solscanPoolUrl,
  },
  {
    id: "support",
    label: "Support Address",
    technicalLabel: "Liquidity wallet",
    value: JAL_COIN.liquiditySupportWallet,
    href: JAL_COIN.solscanAuthorityUrl,
  },
  {
    id: "reserve",
    label: "Public Record",
    technicalLabel: "Reserve account",
    value: JAL_COIN.reserveTokenAccount,
    href: JAL_COIN.solscanReserveUrl,
  },
];

export default function JalSolFlowboardPage() {
  usePageMeta(
    "JALSOL Flowboard",
    "Watch-only JAL/SOL Flowboard preview for public addresses, source labels, snapshots, and future read-only imports."
  );

  return (
    <main className="home-shell jal-shell jal-ground-page" aria-label="JALSOL Flowboard">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window jal-flowboard-page">
          <section className="jal-hero jal-world-hero jal-world-hub-minimal jal-flowboard-hero">
            <div className="jal-hero-center jal-world-hub-center">
              <p className="jal-world-pretitle">{flowboardCopy.subtitle}</p>
              <h1 className="home-title jal-world-hub-title">{flowboardCopy.title}</h1>
              <p className="jal-world-hub-subtitle">{flowboardCopy.line}</p>
              <p className="home-lead">{flowboardCopy.lead}</p>
              <p className="jal-readonly-hero-note">No keys. No custody. No promises.</p>
              <div className="jal-links">
                <Link className="button gold" to="/app/jal-sol">
                  Back To JAL/SOL
                </Link>
                <Link className="button ghost" to="/app/jal-sol#jal-proof-board">
                  Check Official Links
                </Link>
                <Link className="button ghost" to="/app/legal">
                  Read The Details
                </Link>
              </div>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide jal-readonly-zone" aria-label="Read-Only Zone">
            <div className="jal-bay-head">
              <div>
                <div className="jal-bay-title">Read-Only Zone</div>
                <div className="jal-bay-note">Watch-only preview</div>
              </div>
              <div className="jal-proof-timestamp">Static V1</div>
            </div>
            <p className="jal-readonly-copy">{flowboardCopy.boundary}</p>
            <div className="jal-boundary-grid">
              {flowboardBoundaryItems.map((item) => (
                <article className="jal-boundary-card" key={item.id}>
                  <h2>{item.title}</h2>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="jal-bay jal-bay-wide jal-flowboard-panel" aria-label="Flowboard panels">
            <div className="jal-bay-head">
              <div>
                <div className="jal-bay-title">Preview Panels</div>
                <div className="jal-bay-note">Future dashboard shape</div>
              </div>
              <div className="jal-proof-timestamp">No live imports</div>
            </div>
            <div className="jal-flowboard-grid">
              {flowboardPreviewItems.map((item) => (
                <article className="jal-flowboard-card" key={item.id}>
                  <div className="jal-flowboard-card-top">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <p>{item.note}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="jal-bay jal-bay-wide jal-flowboard-panel" aria-label="Official JAL references">
            <div className="jal-bay-head">
              <div>
                <div className="jal-bay-title">Official JAL References</div>
                <div className="jal-bay-note">Public records only</div>
              </div>
              <div className="jal-proof-timestamp">Check first</div>
            </div>
            <div className="jal-flowboard-reference-grid">
              {officialReferences.map((item) => (
                <article className="jal-flowboard-reference" key={item.id}>
                  <div className="jal-proof-card-top">
                    <span>{item.label}</span>
                    <span className="jal-proof-state">Public</span>
                  </div>
                  <div className="jal-proof-tech">{item.technicalLabel}</div>
                  <div className="jal-flowboard-address">{item.value}</div>
                  <a
                    className="jal-coin-explorer-link"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Solscan
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className="jal-bay jal-bay-wide jal-flowboard-panel" aria-label="Future Flowboard panels">
            <div className="jal-bay-head">
              <div>
                <div className="jal-bay-title">Coming Later</div>
                <div className="jal-bay-note">Preview only</div>
              </div>
              <div className="jal-proof-timestamp">Not connected</div>
            </div>
            <div className="jal-flowboard-future-grid">
              {flowboardFuturePanels.map((panel) => (
                <article className="jal-flowboard-future" key={panel.id}>
                  <div className="jal-flowboard-card-top">
                    <span>{panel.status}</span>
                    <span>Sealed</span>
                  </div>
                  <h2>{panel.title}</h2>
                  <p>{panel.body}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
