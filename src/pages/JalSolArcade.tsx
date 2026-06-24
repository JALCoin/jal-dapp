import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import {
  arcadeCopy,
  arcadeModuleItems,
  crownScanOptions,
  getArcadeModule,
  type JalArcadeModuleId,
  type JalArcadeModuleItem,
} from "../lib/jalArcade";
import { JAL_COIN, shortAddress } from "../lib/jalCoin";

function ArcadeModuleCard({ item }: { item: JalArcadeModuleItem }) {
  return (
    <article className={`jal-arcade-module-card ${item.available ? "is-live" : "is-coming-soon"}`}>
      <div className="jal-arcade-card-top">
        <span>{item.eyebrow}</span>
        <span className="jal-arcade-status">{item.status}</span>
      </div>
      <h2>{item.title}</h2>
      <p>{item.summary}</p>
      <div className="jal-arcade-command">{item.command}</div>
      <div className="jal-arcade-card-actions">
        <Link className={item.available ? "button gold" : "button ghost"} to={item.route}>
          {item.available ? "Start Scan" : "Coming Soon"}
        </Link>
      </div>
    </article>
  );
}

function ArcadeShell({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <main className="home-shell jal-shell jal-ground-page" aria-label={label}>
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window jal-explorer-window jal-arcade-terminal">
          {children}
        </section>
      </div>
    </main>
  );
}

export default function JalSolArcadePage() {
  usePageMeta(
    "JALSOL Arcade",
    "JALSOL Arcade browser terminal for public scans, simple paths, build signals, and JAL Coin official-link practice."
  );

  return (
    <ArcadeShell label="JALSOL Arcade">
      <section className="jal-hero jal-world-hero jal-world-hub-minimal jal-arcade-hero">
        <div className="jal-hero-center jal-world-hub-center">
          <p className="jal-world-pretitle">Browser Terminal</p>
          <h1 className="home-title jal-world-hub-title">{arcadeCopy.title}</h1>
          <p className="jal-world-hub-subtitle">{arcadeCopy.line}</p>
          <p className="home-lead">{arcadeCopy.lead}</p>
          <div className="jal-links">
            <Link className="button gold" to="/app/jal-sol/arcade/check-first">
              Start Scan
            </Link>
            <Link className="button ghost" to="/app/jal-sol">
              Back To JAL/SOL
            </Link>
          </div>
        </div>
      </section>

      <section className="jal-bay jal-bay-wide jal-arcade-module-terminal" aria-label="Arcade modules">
        <div className="jal-bay-head">
          <div>
            <div className="jal-bay-title">Arcade Modules</div>
            <div className="jal-bay-note">Scan, trace, and read the record</div>
          </div>
          <div className="jal-proof-timestamp">1 live | 3 sealed</div>
        </div>

        <div className="jal-arcade-module-grid">
          {arcadeModuleItems.map((item) => (
            <ArcadeModuleCard item={item} key={item.id} />
          ))}
        </div>
      </section>
    </ArcadeShell>
  );
}

export function JalSolCrownScanPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => crownScanOptions.find((option) => option.id === selectedId) ?? null,
    [selectedId]
  );
  const resultState = selected ? (selected.isOfficial ? "clear" : "mismatch") : "waiting";

  usePageMeta(
    "Crown Scan",
    "Crown Scan arcade module for matching the official JAL Coin public record before trusting a seal."
  );

  return (
    <ArcadeShell label="Crown Scan">
      <section className="jal-hero jal-world-hero jal-world-hub-minimal jal-arcade-hero">
        <div className="jal-hero-center jal-world-hub-center">
          <p className="jal-world-pretitle">CROWN SCAN | MODULE 01</p>
          <h1 className="home-title jal-world-hub-title">Crown Scan</h1>
          <p className="jal-world-hub-subtitle">{arcadeCopy.crownScanFraming}</p>
          <p className="home-lead">{arcadeCopy.crownScanHint}</p>
          <div className="jal-links">
            <Link className="button ghost" to="/app/jal-sol/arcade">
              Back To Arcade
            </Link>
            <a className="button ghost" href="/app/jal-sol#jal-proof-board">
              Check Official Links
            </a>
          </div>
        </div>
      </section>

      <section className="jal-bay jal-bay-wide jal-arcade-scan-terminal" aria-label="Crown Scan game">
        <div className="jal-bay-head">
          <div>
            <div className="jal-bay-title">Seal Grid</div>
            <div className="jal-bay-note">Select the official match</div>
          </div>
          <div className="jal-proof-timestamp">Public record: {shortAddress(JAL_COIN.mintAddress)}</div>
        </div>

        <div className="jal-arcade-scan-grid">
          {crownScanOptions.map((option) => {
            const isSelected = selectedId === option.id;
            const toneClass = selectedId
              ? option.isOfficial
                ? "is-official"
                : isSelected
                  ? "is-mismatch"
                  : "is-muted"
              : "";

            return (
              <button
                type="button"
                className={`jal-arcade-scan-card ${toneClass}`}
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                aria-pressed={isSelected}
              >
                <div className="jal-arcade-card-top">
                  <span>{option.seal}</span>
                  <span>{isSelected ? "Selected" : "Scan"}</span>
                </div>
                <div className="jal-arcade-seal-mark" aria-hidden="true">
                  JAL
                </div>
                <div className="jal-arcade-fragments">
                  {option.fragments.map((fragment) => (
                    <span key={fragment}>{fragment}</span>
                  ))}
                </div>
                <p>
                  {selectedId
                    ? option.isOfficial
                      ? "Official match"
                      : "Decoy seal"
                    : "Awaiting scan"}
                </p>
              </button>
            );
          })}
        </div>

        <div className={`jal-arcade-result-panel is-${resultState}`} role="status" aria-live="polite">
          <div className="jal-arcade-result-kicker">Scan Status</div>
          <h2>
            {resultState === "clear"
              ? "CLEAR"
              : resultState === "mismatch"
                ? "MISMATCH"
                : "READY"}
          </h2>
          <p>
            {resultState === "clear"
              ? "Official match found."
              : resultState === "mismatch"
                ? "Slow down and check the public record."
                : "Four seals detected. One matches the public record."}
          </p>
          <div className="jal-links">
            <button
              type="button"
              className="button gold"
              onClick={() => setSelectedId(null)}
              disabled={!selectedId}
            >
              Scan Again
            </button>
            <a className="button ghost" href="/app/jal-sol#jal-proof-board">
              Check Official Links
            </a>
            <Link className="button ghost" to="/app/jal-sol/arcade">
              Back To Arcade
            </Link>
          </div>
        </div>
      </section>
    </ArcadeShell>
  );
}

export function JalSolArcadeComingSoonPage({ moduleId }: { moduleId: JalArcadeModuleId }) {
  const item = getArcadeModule(moduleId);

  usePageMeta(
    item.title,
    `${item.title} is a planned JALSOL Arcade module. The public page is present while the module remains sealed.`
  );

  return (
    <ArcadeShell label={`${item.title} coming soon`}>
      <section className="jal-hero jal-world-hero jal-world-hub-minimal jal-arcade-hero">
        <div className="jal-hero-center jal-world-hub-center">
          <p className="jal-world-pretitle">{item.eyebrow}</p>
          <h1 className="home-title jal-world-hub-title">{item.title}</h1>
          <p className="jal-world-hub-subtitle">Coming Soon</p>
          <p className="home-lead">{item.summary}</p>
          <div className="jal-links">
            <Link className="button gold" to="/app/jal-sol/arcade/check-first">
              Start Scan
            </Link>
            <Link className="button ghost" to="/app/jal-sol/arcade">
              Back To Arcade
            </Link>
            <Link className="button ghost" to="/app/jal-sol">
              Back To JAL/SOL
            </Link>
          </div>
        </div>
      </section>

      <section className="jal-bay jal-bay-wide jal-arcade-coming-soon" aria-label="Module status">
        <div className="jal-bay-head">
          <div>
            <div className="jal-bay-title">Module Sealed</div>
            <div className="jal-bay-note">Future public tool</div>
          </div>
          <div className="jal-proof-timestamp">{item.status}</div>
        </div>
        <div className="jal-arcade-coming-panel">
          <div className="jal-arcade-result-kicker">{item.command}</div>
          <h2>{item.title}</h2>
          <p>This arcade module is visible as a signal, but it is not playable yet.</p>
        </div>
      </section>
    </ArcadeShell>
  );
}
