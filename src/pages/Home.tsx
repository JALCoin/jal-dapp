// src/pages/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type AuthMode = "full" | "ro";
type EngineActionKey = "token-gen" | "lp-raydium" | "jal-engine" | "inventory";

type EngineAction = {
  key: EngineActionKey;
  title: string;
  desc: string;
  route: string;
};

function safeTrim(v: string) {
  return (v ?? "").trim();
}

function maskKey(s: string) {
  const v = safeTrim(s);
  if (v.length <= 6) return v ? "******" : "";
  return `${v.slice(0, 3)}…${v.slice(-3)}`;
}

function fmtTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function Home() {
  const navigate = useNavigate();

  // Replace these with your exact Raydium + Solscan pages when you want
  const links = useMemo(
    () => [
      { label: "Raydium (JAL/SOL)", href: "https://raydium.io/" },
      {
        label: "Solscan ($JAL)",
        href: "https://solscan.io/token/9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v",
      },
    ],
    []
  );

  /* ---------------- Terminal header (time + status) ---------------- */
  const [lastUpdate, setLastUpdate] = useState(() => fmtTime(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setLastUpdate(fmtTime(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  const networkLabel = "MAINNET"; // keep as constant for now

  /* ---------------- Engine UI state ---------------- */
  const [engineStatus, setEngineStatus] = useState<"idle" | "running" | "stopped">("idle");
  const [executorStatus, setExecutorStatus] = useState<"connected" | "disconnected">("disconnected");
  const [deployStatus, setDeployStatus] = useState<"awaiting config" | "ready">("awaiting config");

  const [logs, setLogs] = useState<string[]>([
    "[engine] idle",
    "[executor] disconnected",
    "[deploy] awaiting config",
  ]);

  const pushLog = (line: string) => setLogs((prev) => [line, ...prev].slice(0, 60));

  // try to hydrate remembered auth (OPTIONAL: only affects UI state)
  const [authConnected, setAuthConnected] = useState<null | { mode: AuthMode; masked: string }>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("jal_engine_auth");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const mode: AuthMode = parsed?.mode === "full" ? "full" : "ro";
      const key = safeTrim(parsed?.key ?? "");
      const secret = safeTrim(parsed?.secret ?? "");
      if (!key || !secret) return;

      setAuthConnected({ mode, masked: maskKey(key) });
      setExecutorStatus("connected");
      pushLog(`[auth] restored (${mode === "full" ? "FULL" : "RO"}): ${maskKey(key)}`);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions: EngineAction[] = useMemo(
    () => [
      {
        key: "token-gen",
        title: "JALSOL — Solana token generation",
        desc: "Create SPL tokens and utilities that plug into the ecosystem.",
        route: "/app/token",
      },
      {
        key: "jal-engine",
        title: "$JAL~Engine — read the market + deploy Jeroids",
        desc: "Sign in with Read Only or Full Access to enable features.",
        route: "/app/engine",
      },
      {
        key: "lp-raydium",
        title: "Raydium — JAL/SOL liquidity layer",
        desc: "Pool overview, LP references, and future tooling lives here.",
        route: "/app/raydium",
      },
      {
        key: "inventory",
        title: "Inventory — packaged system + guides",
        desc: "Docs + sale bundle for builders who want their own iteration.",
        route: "/app/inventory",
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

  const handleAuthSubmit = () => {
    const k = safeTrim(apiKey);
    const s = safeTrim(apiSecret);

    if (!k || !s) {
      pushLog("[auth] missing key/secret");
      return;
    }

    const label = authMode === "full" ? "FULL ACCESS" : "READ ONLY";
    const masked = maskKey(k);

    setAuthConnected({ mode: authMode, masked });
    setExecutorStatus("connected");
    pushLog(`[auth] ${label} connected: ${masked}`);

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

    closeAuth();
  };

  /* ---------------- Full access arm (2-step) ---------------- */
  const [armFull, setArmFull] = useState(false);
  useEffect(() => {
    if (!armFull) return;
    const id = window.setTimeout(() => setArmFull(false), 6000); // auto-disarm
    return () => window.clearTimeout(id);
  }, [armFull]);

  const handleFullAccessClick = () => {
    if (!armFull) {
      setArmFull(true);
      pushLog("[auth] FULL ACCESS arm requested (confirm to proceed)");
      return;
    }
    setArmFull(false);
    openAuth("full");
  };

  /* ---------------- Mode selection ---------------- */
  const [activeAction, setActiveAction] = useState<EngineActionKey>("jal-engine");

  const goAction = (k: EngineActionKey) => {
    const a = actions.find((x) => x.key === k);
    setActiveAction(k);
    pushLog(`[hub] selected: ${k}`);
    if (a?.route) navigate(a.route);
  };

  /* ---------------- Controls (NAVIGATES) ---------------- */
  const engineStart = () => {
    setEngineStatus("running");
    setDeployStatus("ready");
    pushLog("[engine] start requested");
    navigate("/app/engine");
  };

  const engineStop = () => {
    setEngineStatus("stopped");
    pushLog("[engine] stop requested");
  };

  const engineSettings = () => {
    pushLog("[engine] settings opened");
    navigate("/app/engine/settings");
  };

  const engineAnalysis = () => {
    pushLog("[engine] log analysis opened");
    navigate("/app/engine/logs");
  };

  const primaryOutcome = authConnected ? "start" : "signin-ro";

  return (
    <main className="home-shell" aria-label="Home">
      <div className="home-wrap">
        {/* ===== Terminal Header Strip ===== */}
        <section className="terminal-bar panel-frame machine-surface" aria-label="Terminal status">
          <div className="terminal-left">
            <span className="terminal-pill ok">ONLINE</span>
            <span className="terminal-sep">•</span>
            <span className="terminal-pill">{networkLabel}</span>
            <span className="terminal-sep">•</span>
            <span className="terminal-dim">LAST UPDATE</span>
            <span className="terminal-time">{lastUpdate}</span>
          </div>

          <div className="terminal-right">
            {authConnected ? (
              <span className={`terminal-auth ${authConnected.mode === "full" ? "is-full" : "is-ro"}`}>
                AUTH: {authConnected.mode === "full" ? "FULL" : "RO"} ({authConnected.masked})
              </span>
            ) : (
              <span className="terminal-auth is-none">AUTH: NONE</span>
            )}
          </div>
        </section>

        {/* ===== Overview card (console hero) ===== */}
        <section className="card home-hero machine-surface panel-frame" aria-label="Overview">
          <div className="home-kicker">JAL SYSTEM • ONLINE</div>

          <h1 className="home-title">jalsol.com</h1>

          <p className="home-lead">
            <strong>Terminal for Solana utility.</strong> Generate tokens, create ATAs, mint accounts, and
            navigate the market through $JAL~Engine.
          </p>

          <p className="home-lead">
            Founded by <strong>Jeremy Aaron Lugg</strong> — Sol-Trader • Mechanical Metal Engineer • Digital Creator.
          </p>

          <div className="home-links" aria-label="Links">
            {links.map((l) => (
              <a key={l.label} className="chip" href={l.href} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
          </div>

          {/* Primary outcome bay */}
          <div className="home-primary" aria-label="Primary action">
            {primaryOutcome === "signin-ro" ? (
              <>
                <button type="button" className="button neon" onClick={() => openAuth("ro")}>
                  Sign in (Read Only)
                </button>
                <div className="home-primary-note">
                  View balances + market + logs. <span>No orders can be placed.</span>
                </div>
              </>
            ) : (
              <>
                <button type="button" className="button gold" onClick={engineStart}>
                  Start Engine
                </button>
                <div className="home-primary-note">
                  Execution enabled by your auth mode. <span>Use Log Analysis for verification.</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ===== Engine window (console bay) ===== */}
        <section className="card engine-window engine-window--hero machine-surface panel-frame" aria-label="$JAL~Engine">
          {/* pulsing logo behind content */}
          <div className="engine-bg" aria-hidden="true">
            <img className="engine-bg-logo" src="/JALSOL1.gif" alt="" />
          </div>

          <div className="engine-foreground">
            <div className="engine-head">
              <div className="engine-head-left" aria-hidden="true" />
              <div className="engine-head-center">
                <h2 className="engine-title">$JAL~Engine</h2>
                <div className="engine-sub">CEX connector • Jeroid deployment • logs</div>
              </div>

              <div className="engine-auth">
                <div className="engine-auth-col">
                  <button type="button" className="button" onClick={() => openAuth("ro")}>
                    Sign in (Read Only)
                  </button>
                  <div className="engine-auth-hint">View balances + market + logs. No orders.</div>
                </div>

                <div className="engine-auth-col">
                  <button
                    type="button"
                    className={`button gold ${armFull ? "armed" : ""}`}
                    onClick={handleFullAccessClick}
                  >
                    {armFull ? "CONFIRM Full Access" : "Sign in (Full Access)"}
                  </button>
                  <div className="engine-auth-hint">
                    Allows order execution. Use only on your machine.
                  </div>
                </div>
              </div>
            </div>

            {/* Selectable modules */}
            <div className="engine-select" aria-label="Engine modules">
              {actions.map((a) => {
                const isActive = activeAction === a.key;
                return (
                  <button
                    key={a.key}
                    type="button"
                    className={`engine-select-row ${isActive ? "active" : "compact"}`}
                    onClick={() => goAction(a.key)}
                  >
                    <div className="engine-select-title">{a.title}</div>
                    {isActive ? (
                      <div className="engine-select-desc">{a.desc}</div>
                    ) : (
                      <div className="engine-select-desc compact">{a.desc}</div>
                    )}
                  </button>
                );
              })}
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
              <button type="button" className="button" onClick={engineSettings}>
                Settings
              </button>
              <button type="button" className="button" onClick={engineAnalysis}>
                Log Analysis
              </button>
            </div>

            {/* Heartbeat indicators */}
            <div className="engine-indicators" aria-label="System indicators">
              <div className={`indicator ${engineStatus === "running" ? "ok" : ""}`}>
                ENGINE: <span>{engineStatus}</span>
              </div>
              <div className={`indicator ${executorStatus === "connected" ? "ok" : "warn"}`}>
                EXECUTOR: <span>{executorStatus}</span>
              </div>
              <div className={`indicator ${deployStatus === "ready" ? "ok" : "warn"}`}>
                DEPLOY: <span>{deployStatus}</span>
              </div>
            </div>

            {/* Log */}
            <div className="engine-log" aria-label="Engine log">
              <pre>{logs.join("\n")}</pre>
            </div>
          </div>
        </section>

        {/* ===== Packaged system ===== */}
        <section className="card bundle-card machine-surface panel-frame" aria-label="Packaged system">
          <h2 className="bundle-title">SYSTEM MODULE: Packaged Build</h2>
          <p className="bundle-lead">
            Includes engine + deployment + dashboard scaffolding for builders who want their own iteration.
          </p>

          <div className="engine-controls" aria-label="Bundle actions">
            <button type="button" className="button gold" onClick={() => navigate("/app/inventory")}>
              View
            </button>
            <button type="button" className="button" onClick={() => navigate("/app/inventory/purchase")}>
              Purchase
            </button>
          </div>
        </section>
      </div>

      {/* ===== Auth modal ===== */}
      {authOpen && (
        <>
          <button className="engine-modal-backdrop" aria-label="Close sign-in" onClick={closeAuth} />
          <section className="engine-modal" role="dialog" aria-modal="true" aria-label="API Sign In">
            <div className="engine-modal-head">
              <div>
                <div className="engine-modal-title">CoinSpot API Sign In</div>
                <div className="engine-modal-sub">
                  {authMode === "full"
                    ? "FULL ACCESS — enables deployment actions"
                    : "READ ONLY — enables market read + analytics"}
                </div>
              </div>

              <button type="button" className="engine-modal-close" onClick={closeAuth} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="engine-modal-body">
              <label className="engine-field">
                <span>API Key</span>
                <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoFocus placeholder="paste key" />
              </label>

              <label className="engine-field">
                <span>API Secret</span>
                <input value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} placeholder="paste secret" />
              </label>

              <label className="engine-remember">
                <input type="checkbox" checked={authRemember} onChange={(e) => setAuthRemember(e.target.checked)} />
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

              <p className="engine-modal-note">Tip: leave “Remember” off to keep keys session-only.</p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}