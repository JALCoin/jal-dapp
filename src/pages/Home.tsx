// src/pages/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type AuthMode = "full" | "ro";

type EngineActionKey =
  | "token-gen"
  | "lp-raydium"
  | "jal-engine"
  | "inventory";

type EngineAction = {
  key: EngineActionKey;
  title: string;
  desc: string;
};

function safeTrim(v: string) {
  return (v ?? "").trim();
}

function maskKey(s: string) {
  const v = safeTrim(s);
  if (v.length <= 6) return v ? "******" : "";
  return `${v.slice(0, 3)}…${v.slice(-3)}`;
}

export default function Home() {
  const navigate = useNavigate();

  // Links (you can replace these once you have exact Raydium / Solscan URLs)
  const links = useMemo(
    () => [
      { label: "Raydium (JAL/SOL)", href: "https://raydium.io/" },
      { label: "Solscan ($JAL)", href: "https://solscan.io/" },
    ],
    []
  );

  /* ---------------- Engine UI state ---------------- */
  const [engineStatus, setEngineStatus] = useState<
    "idle" | "running" | "stopped"
  >("idle");

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
        title: "Create liquidity pool with $JAL on Raydium",
        desc: "JAL/SOL pool overview and future LP tooling lives here.",
      },
      {
        key: "jal-engine",
        title:
          "$JAL~Engine — read the live market (CoinSpot) + deploy Jeroids",
        desc: "Sign in with Read Only or Full Access to enable features.",
      },
      {
        key: "inventory",
        title: "Software Inventory — how-to’s & guides",
        desc:
          "Documentation + packaged system for builders who want to run their own iteration.",
      },
    ],
    []
  );

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

  // Optional: restore remembered RO/FULL keys (NOT recommended, but you asked for “sign in” UX)
  // Default is OFF. If you enable remember, it stores in localStorage (plain text).
  useEffect(() => {
    try {
      const raw = localStorage.getItem("jal_engine_auth");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        mode?: AuthMode;
        key?: string;
        secret?: string;
      };
      if (parsed?.key && parsed?.secret && (parsed.mode === "ro" || parsed.mode === "full")) {
        // we don't auto-connect; we only preload if you want it later
      }
    } catch {
      // ignore
    }
  }, []);

  const pushLog = (line: string) =>
    setLogs((prev) => [line, ...prev].slice(0, 40));

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
        localStorage.setItem(
          "jal_engine_auth",
          JSON.stringify({ mode: authMode, key: k, secret: s })
        );
        pushLog("[auth] saved locally (remember enabled)");
      } catch {
        pushLog("[auth] failed to save locally");
      }
    } else {
      // keep it session-only in memory
      pushLog("[auth] session-only (not saved)");
    }

    // TODO: wire into your actual engine connector
    // e.g. set some state, call backend, validate, etc.

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

  const engineSettings = () => {
    pushLog("[engine] open settings (coming soon)");
  };

  const engineAnalysis = () => {
    pushLog("[engine] open log analysis (coming soon)");
  };

  const selectAction = (k: EngineActionKey) => {
    if (k === "token-gen") pushLog("[hub] token generation selected");
    if (k === "lp-raydium") pushLog("[hub] raydium LP selected");
    if (k === "jal-engine") pushLog("[hub] $JAL~Engine selected");
    if (k === "inventory") pushLog("[hub] inventory selected");

    // optional navigation hooks for later
    // if (k === "token-gen") navigate("/app/generator");
  };

  return (
    <main className="home-shell" aria-label="Home">
      {/* Top-right nav button (your header/hamburger already exists globally) */}
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

      <div className="home-wrap">
        {/* ===== Overview card ===== */}
        <section className="card" aria-label="Overview">
          <h1 className="home-title">jalsol.com</h1>

          <p className="home-lead">
            Founded by <strong>Jeremy Aaron Lugg</strong> — Sol-Trader • Mechanical Metal
            Engineer • Digital Creator. Minimal interface linked to the Solana ecosystem.
          </p>

          <p className="home-lead">
            <strong>$JAL</strong> sits in the <strong>JAL/SOL</strong> liquidity pool on Raydium
            and can be checked on Solscan.
          </p>

          <div className="home-links" aria-label="Links">
            {links.map((l) => (
              <a
                key={l.label}
                className="chip"
                href={l.href}
                target="_blank"
                rel="noreferrer"
              >
                {l.label}
              </a>
            ))}
          </div>
        </section>

        {/* ===== Engine window ===== */}
        <section className="card engine-window" aria-label="$JAL~Engine">
          {/* subtle animated logo behind content */}
          <div className="engine-bg" aria-hidden="true">
            <img className="engine-bg-logo" src="/JALSOL1.gif" alt="" />
          </div>

          <div className="engine-head">
            <div>
              <h2 className="engine-title">$JAL~Engine</h2>
              <div className="engine-sub">
                CEX connector • Jeroid deployment • logs
              </div>
            </div>

            <div className="engine-auth">
              <button
                type="button"
                className="button"
                onClick={() => openAuth("ro")}
              >
                Sign in (Read Only)
              </button>
              <button
                type="button"
                className="button gold"
                onClick={() => openAuth("full")}
              >
                Sign in (Full Access)
              </button>
            </div>
          </div>

          {/* Titles / selectors */}
          <div className="engine-select">
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
            <button
              type="button"
              className="button"
              onClick={engineStop}
            >
              Stop
            </button>
            <button
              type="button"
              className="button"
              onClick={engineSettings}
            >
              Settings
            </button>
            <button
              type="button"
              className="button"
              onClick={engineAnalysis}
            >
              Log Analysis
            </button>
          </div>

          {/* Log */}
          <div className="engine-log" aria-label="Engine log">
            <pre>{logs.join("\n")}</pre>
          </div>
        </section>

        {/* Placeholder for the “packaged software” sale section */}
        <section className="card" aria-label="Packaged system">
          <h2 className="home-title" style={{ marginBottom: 6 }}>
            Packaged System
          </h2>
          <p className="home-lead" style={{ marginBottom: 0 }}>
            The packaged version of the engine + deployment software will live here
            (sale + documentation + onboarding).
          </p>
        </section>
      </div>

      {/* ===== Auth modal ===== */}
      {authOpen && (
        <>
          <button
            className="engine-modal-backdrop"
            aria-label="Close sign-in"
            onClick={closeAuth}
          />
          <section
            className="engine-modal"
            role="dialog"
            aria-modal="true"
            aria-label="CoinSpot API Sign In"
          >
            <div className="engine-modal-head">
              <div>
                <div className="engine-modal-title">
                  CoinSpot API Sign In
                </div>
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
                <span>
                  Remember on this device (stores in localStorage)
                </span>
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
                Tip: If you don’t want keys stored, leave “Remember” off — it stays
                session-only.
              </p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}