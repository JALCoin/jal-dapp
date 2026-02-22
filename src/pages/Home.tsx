// src/pages/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type AuthMode = "full" | "ro";

type EngineActionKey = "token-gen" | "lp-raydium" | "jal-engine" | "inventory";
type EngineAction = { key: EngineActionKey; title: string; desc: string };

function safeTrim(v: string) {
  return (v ?? "").trim();
}
function maskKey(s: string) {
  const v = safeTrim(s);
  if (!v) return "";
  if (v.length <= 6) return "******";
  return `${v.slice(0, 3)}…${v.slice(-3)}`;
}

export default function Home() {
  const navigate = useNavigate();

  // Replace with exact URLs when you have them
  const links = useMemo(
    () => [
      { label: "Raydium (JAL/SOL)", href: "https://raydium.io/" },
      { label: "Solscan ($JAL)", href: "https://solscan.io/" },
      { label: "X: @JAL358", href: "https://x.com/JAL358" },
    ],
    []
  );

  /* ---------------- Engine UI state ---------------- */
  const [engineStatus, setEngineStatus] = useState<"idle" | "running" | "stopped">("idle");
  const [logs, setLogs] = useState<string[]>([
    "[engine] idle",
    "[executor] disconnected",
    "[deploy] awaiting config",
  ]);

  const actions: EngineAction[] = useMemo(
    () => [
      {
        key: "token-gen",
        title: "JALSOL — Solana token generation",
        desc: "Create SPL tokens and utilities that plug into the ecosystem.",
      },
      {
        key: "lp-raydium",
        title: "Liquidity — Raydium (JAL/SOL)",
        desc: "Pool overview and future LP tooling lives here.",
      },
      {
        key: "jal-engine",
        title: "$JAL~Engine — read market + deploy Jeroids",
        desc: "Sign in with Read Only or Full Access to enable features.",
      },
      {
        key: "inventory",
        title: "Software Inventory — how-to’s & guides",
        desc: "Documentation + packaged system for builders who want their own iteration.",
      },
    ],
    []
  );

  const pushLog = (line: string) =>
    setLogs((prev) => [line, ...prev].slice(0, 60));

  /* ---------------- Modal auth state ---------------- */
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("ro");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [authRemember, setAuthRemember] = useState(false);

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const closeAuth = () => {
    setAuthOpen(false);
    setApiKey("");
    setApiSecret("");
    setAuthRemember(false);
  };

  // ESC closes modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && authOpen) closeAuth();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authOpen]);

  const handleAuthSubmit = () => {
    const k = safeTrim(apiKey);
    const s = safeTrim(apiSecret);

    if (!k || !s) {
      pushLog("[auth] missing key/secret");
      return;
    }

    const label = authMode === "full" ? "FULL ACCESS" : "READ ONLY";
    pushLog(`[auth] ${label} connected: ${maskKey(k)}`);

    if (authRemember) {
      try {
        localStorage.setItem("jal_engine_auth", JSON.stringify({ mode: authMode, key: k, secret: s }));
        pushLog("[auth] saved locally (remember enabled)");
      } catch {
        pushLog("[auth] failed to save locally");
      }
    } else {
      pushLog("[auth] session-only (not saved)");
    }

    // TODO: wire into your actual engine connector (backend / local executor)
    closeAuth();
  };

  const engineStart = () => {
    setEngineStatus("running");
    pushLog("[engine] start requested");
  };
  const engineStop = () => {
    setEngineStatus("stopped");
    pushLog("[engine] stop requested");
  };
  const engineSettings = () => pushLog("[engine] open settings (coming soon)");
  const engineAnalysis = () => pushLog("[engine] open log analysis (coming soon)");

  const selectAction = (k: EngineActionKey) => {
    if (k === "token-gen") pushLog("[hub] token generation selected");
    if (k === "lp-raydium") pushLog("[hub] raydium LP selected");
    if (k === "jal-engine") pushLog("[hub] $JAL~Engine selected");
    if (k === "inventory") pushLog("[hub] inventory selected");
  };

  return (
    <div className="home container" aria-label="Home">
      {/* Optional: a local “Menu” button if you want it inside content too */}
      <div className="home-shell-top">
        <button
          type="button"
          className="home-open-nav"
          onClick={() => navigate("/app/nav")}
          aria-label="Open navigation"
        >
          Menu
        </button>
      </div>

      {/* =======================
          TOP SUMMARY (HOME HERO)
      ======================== */}
      <section className="home-hero card" aria-label="Overview">
        <h1 className="home-title">jalsol.com</h1>

        <p className="home-sub">
          Founded by <strong>Jeremy Aaron Lugg</strong> — Sol-Trader • Mechanical Metal Engineer • Digital Creator.
          A minimal application linked to Solana.
        </p>

        <div className="home-links" aria-label="Links">
          {links.map((l) => (
            <a key={l.label} className="chip" href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          ))}
        </div>

        <div className="home-mini" aria-label="Summary">
          <div className="mini-row">
            <div className="mini-label">Liquidity</div>
            <div className="mini-value">JAL/SOL pool on Raydium</div>
          </div>
          <div className="mini-row">
            <div className="mini-label">Token</div>
            <div className="mini-value">$JAL — verified on Solscan</div>
          </div>
        </div>
      </section>

      {/* =======================
          EMBEDDED WINDOW: ENGINE
      ======================== */}
      <section className="home-block card" aria-label="$JAL~Engine">
        <div className="block-head">
          <h2>$JAL~Engine</h2>
          <div className="muted">CEX-connected Jeroid deployment + logs</div>
        </div>

        {/* Auth buttons */}
        <div className="engine-auth-row" aria-label="Engine sign in">
          <button type="button" className="button" onClick={() => openAuth("ro")}>
            Sign in (Read Only)
          </button>
          <button type="button" className="button gold" onClick={() => openAuth("full")}>
            Sign in (Full Access)
          </button>
        </div>

        {/* Action selectors */}
        <div className="engine-select" aria-label="Engine modules">
          {actions.map((a) => (
            <button
              key={a.key}
              type="button"
              className="engine-select-row"
              onClick={() => selectAction(a.key)}
            >
              <div className="engine-select-title">{a.title}</div>
              <div className="engine-select-desc">{a.desc}</div>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="engine-controls" aria-label="Engine controls">
          <button
            type="button"
            className={`button ${engineStatus === "running" ? "neon" : ""}`}
            onClick={engineStart}
          >
            Start
          </button>
          <button type="button" className="button" onClick={engineStop}>
            Stop
          </button>
          <button type="button" className="button ghost" onClick={engineSettings}>
            Settings
          </button>
          <button type="button" className="button ghost" onClick={engineAnalysis}>
            Log Analysis
          </button>
        </div>

        {/* Engine log */}
        <div className="engine-log" aria-label="Engine log">
          <pre>{logs.join("\n")}</pre>
        </div>
      </section>

      {/* =======================
          PACKAGED PRODUCT
      ======================== */}
      <section className="home-block card" aria-label="Engine Package">
        <div className="block-head">
          <h2>Engine Package</h2>
          <div className="muted">Sell the deployment system as a product</div>
        </div>

        <div className="package-grid">
          <div className="package-card">
            <div className="package-title">JAL-Engine — Starter</div>
            <div className="package-copy">Template + setup guide + local dashboard.</div>
            <button className="button gold" type="button">
              Coming soon
            </button>
          </div>

          <div className="package-card">
            <div className="package-title">JAL-Engine — Pro</div>
            <div className="package-copy">Full executor + hardening + deployment workflow.</div>
            <button className="button gold" type="button">
              Coming soon
            </button>
          </div>
        </div>
      </section>

      {/* =======================
          AUTH MODAL
      ======================== */}
      {authOpen && (
        <>
          <button
            className="engine-modal-backdrop"
            aria-label="Close sign-in"
            onClick={closeAuth}
          />
          <section className="engine-modal" role="dialog" aria-modal="true" aria-label="CoinSpot API Sign In">
            <div className="engine-modal-head">
              <div>
                <div className="engine-modal-title">CoinSpot API Sign In</div>
                <div className="engine-modal-sub">
                  {authMode === "full"
                    ? "FULL ACCESS — enables deployment actions"
                    : "READ ONLY — enables market read + analytics"}
                </div>
              </div>

              <button
                type="button"
                className="engine-modal-close"
                onClick={closeAuth}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="engine-modal-body">
              <label className="engine-field">
                <span>API Key</span>
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoFocus
                  placeholder="paste key"
                />
              </label>

              <label className="engine-field">
                <span>API Secret</span>
                <input
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="paste secret"
                />
              </label>

              <label className="engine-remember">
                <input
                  type="checkbox"
                  checked={authRemember}
                  onChange={(e) => setAuthRemember(e.target.checked)}
                />
                <span>Remember on this device (stores in localStorage)</span>
              </label>

              <div className="engine-modal-actions">
                <button type="button" className="button" onClick={closeAuth}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={authMode === "full" ? "button gold" : "button neon"}
                  onClick={handleAuthSubmit}
                >
                  Connect
                </button>
              </div>

              <p className="engine-modal-note">
                Tip: Leave “Remember” off to keep it session-only.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}