import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { JAL_MINT } from "../config/tokens";

const Jal = lazy(() => import("./Jal"));

type Panel = "none" | "grid" | "shop" | "jal" | "vault" | "payments" | "loans" | "support";
type TileKey = Exclude<Panel, "none" | "grid">;
type LandingProps = { initialPanel?: Panel };

const WALLET_MODAL_SELECTORS =
  '.wallet-adapter-modal, .wallet-adapter-modal-container, .wcm-modal, [class*="walletconnect"]';

function DisconnectButton({ className }: { className?: string }) {
  const { connected, disconnect } = useWallet();
  if (!connected) return null;
  return (
    <button type="button" className={className ?? "wallet-disconnect-btn"} onClick={() => disconnect().catch(() => {})}>
      Disconnect
    </button>
  );
}
function ConnectButton({ className }: { className?: string }) {
  return <WalletMultiButton className={className ?? "landing-wallet"} />;
}

export default function Landing({ initialPanel = "none" }: LandingProps) {
  const { publicKey, connected, wallet } = useWallet(); // trimmed: no unused vars
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [params, setParams] = useSearchParams();

  const [activePanel, setActivePanel] = useState<Panel>("none");
  const [merging, setMerging] = useState(false);
  const timerRef = useRef<number | null>(null);

  const hubBodyRef = useRef<HTMLDivElement | null>(null);
  const hubTitleRef = useRef<HTMLHeadingElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const tiles = useMemo<{ key: TileKey; title: string; sub?: string; gif: string; disabled?: boolean }[]>(
    () => [
      { key: "jal", title: "JAL", sub: "About & Swap", gif: "/JAL.gif" },
      { key: "shop", title: "JAL/SOL — SHOP", sub: "Buy items with JAL", gif: "/JALSOL.gif" },
      { key: "vault", title: "VAULT", sub: "Your assets", gif: "/VAULT.gif" },
    ],
    []
  );

  /* ---------- preload gifs ---------- */
  useEffect(() => {
    const imgs = tiles.map((t) => { const i = new Image(); i.decoding = "async"; i.loading = "eager"; i.src = t.gif; return i; });
    return () => imgs.forEach((i) => (i.src = ""));
  }, [tiles]);

  /* ---------- URL/session init ---------- */
  useEffect(() => {
    const fromUrl = params.get("panel") as Panel | null;
    const fromSession = (sessionStorage.getItem("landing:lastPanel") as Panel | null) ?? null;
    const isPanel = (v: unknown): v is Panel =>
      v === "none" || v === "grid" || v === "shop" || v === "jal" || v === "vault" || v === "payments" || v === "loans" || v === "support";
    const start: Panel =
      (fromUrl && isPanel(fromUrl) ? fromUrl : null) ??
      (fromSession && isPanel(fromSession) ? fromSession : null) ??
      initialPanel;
    setActivePanel(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activePanel) return;
    sessionStorage.setItem("landing:lastPanel", activePanel);
    const urlPanel = params.get("panel");
    if (activePanel === "none") {
      if (urlPanel) { params.delete("panel"); setParams(params, { replace: true }); }
    } else if (urlPanel !== activePanel) {
      params.set("panel", activePanel); setParams(params, { replace: true });
    }
  }, [activePanel, params, setParams]);

  /* ---------- Wallet events / merge effect ---------- */
  useEffect(() => {
    if (!wallet?.adapter) return;
    const onConnect = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMerging(true);
      const delay = reducedMotion ? 0 : 350;
      timerRef.current = window.setTimeout(() => setMerging(false), delay);
      setActivePanel((p) => (p === "none" ? "grid" : p));
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }));
    };
    wallet.adapter.on("connect", onConnect);
    return () => { wallet.adapter.off("connect", onConnect); if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = null; };
  }, [wallet, reducedMotion]);

  /* ---------- wallet modal visibility flag ---------- */
  const setWalletFlag = useCallback((on: boolean) => {
    const root = document.body;
    if (on) root.setAttribute("data-wallet-visible", "true"); else root.removeAttribute("data-wallet-visible");
  }, []);
  useEffect(() => {
    const check = () => setWalletFlag(!!document.querySelector(WALLET_MODAL_SELECTORS));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => { obs.disconnect(); setWalletFlag(false); };
  }, [setWalletFlag]);

  /* ---------- overlay controls ---------- */
  const overlayOpen = activePanel !== "none" && activePanel !== "grid";
  useEffect(() => {
    if (overlayOpen) document.body.setAttribute("data-hub-open", "true");
    else document.body.removeAttribute("data-hub-open");
    return () => document.body.removeAttribute("data-hub-open");
  }, [overlayOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && overlayOpen) setActivePanel("none"); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen]);

  /* ---------- open helpers ---------- */
  const requiresWallet: Panel[] = ["jal", "vault", "payments", "loans"];
  const { setVisible } = useWalletModal();
  const openPanel = (id: Panel) => {
    setActivePanel(id);
    if (!connected && requiresWallet.includes(id)) setVisible(true);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }));
  };
  const panelTitle =
    activePanel === "grid" ? "Hub" :
    activePanel === "shop" ? "Shop" :
    activePanel === "jal" ? "JAL" :
    activePanel === "vault" ? "Vault" :
    activePanel === "payments" ? "Payments" :
    activePanel === "loans" ? "Loans" :
    activePanel === "support" ? "Support" : "Welcome";

  /* ---------- LIVE BALANCES ---------- */
  const [sol, setSol] = useState<number | null>(null);
  const [jal, setJal] = useState<number | null>(null);
  const [balLoading, setBalLoading] = useState(false);
  const [balErr, setBalErr] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connected) { setSol(null); setJal(null); return; }
    setBalErr(null);
    setBalLoading(true);
    try {
      const lamports = await connection.getBalance(publicKey, "confirmed");
      setSol(lamports / LAMPORTS_PER_SOL);
    } catch (e) {
      console.error("[balances] SOL fetch failed:", e);
      setSol(null);
      setBalErr("rpc");
    }
    try {
      const resp = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID }, "confirmed");
      const total = resp.value.reduce((sum, { account }) => {
        const info = account.data.parsed.info;
        if (info.mint !== JAL_MINT) return sum;
        const amountStr = String(info.tokenAmount?.amount ?? "0");
        const dec = Number(info.tokenAmount?.decimals ?? 0);
        const ui = Number(amountStr) / 10 ** dec;
        return sum + (isFinite(ui) ? ui : 0);
      }, 0);
      setJal(total);
    } catch (e) {
      console.error("[balances] JAL fetch failed:", e);
      setJal(null);
      setBalErr((s) => s ?? "rpc");
    } finally {
      setBalLoading(false);
    }
  }, [connection, connected, publicKey]);

  useEffect(() => {
    if (!connected || !publicKey) { setSol(null); setJal(null); return; }
    void fetchBalances();
    const poll = setInterval(fetchBalances, 15000);
    const subId = connection.onAccountChange(
      publicKey,
      (ai) => setSol(ai.lamports / LAMPORTS_PER_SOL),
      "confirmed"
    );
    return () => {
      clearInterval(poll);
      connection.removeAccountChangeListener(subId).catch(() => {});
    };
  }, [connection, connected, publicKey, fetchBalances]);

  const fmt = (n: number | null, digits = 4) =>
    n == null ? "--" : n.toLocaleString(undefined, { maximumFractionDigits: digits });

  return (
    <main className={`landing-gradient ${merging ? "landing-merge" : ""}`} aria-live="polite">
      <section className="bank-landing container" aria-label="Overview">
        <div className="bank-status">
          {connected ? "WALLET CONNECTED" : "WALLET NOT CONNECTED"}
          {connected && (
            <button className="chip" style={{ marginLeft: 10 }} onClick={fetchBalances} aria-label="Refresh balances">
              ↻ Refresh
            </button>
          )}
        </div>

        <div className="balance-row">
          <div className={`balance-card ${balLoading ? "loading" : ""} ${balErr ? "error" : ""}`}>
            <div className="balance-amount">{fmt(jal)} JAL</div>
            <div className="balance-label">JAL • Total</div>
          </div>
          <div className={`balance-card ${balLoading ? "loading" : ""} ${balErr ? "error" : ""}`}>
            <div className="balance-amount">{fmt(sol)} SOL</div>
            <div className="balance-label">SOL • Total</div>
          </div>
        </div>

        <div className="feature-grid">
          <button className="feature-card" onClick={() => openPanel("jal")} aria-label="Open JAL">
            <h4>JAL</h4><div className="title">About &amp; Swap</div><div className="icon">➕</div>
          </button>
          <button className="feature-card" onClick={() => openPanel("shop")} aria-label="Open Store">
            <h4>Store</h4><div className="title">Buy with JAL</div><div className="icon">🏬</div>
          </button>
          <button className="feature-card" onClick={() => openPanel("vault")} aria-label="Open Vault">
            <h4>Vault</h4><div className="title">Assets &amp; Activity</div><div className="icon">💳</div>
          </button>
          <button className="feature-card" onClick={() => openPanel("grid")} aria-label="Open Hub">
            <h4>Hub</h4><div className="title">All Panels</div><div className="icon">🔗</div>
          </button>

          <div className="feature-card feature-wide" role="group" aria-label="Get Started">
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ opacity: 0.85 }}>Get Started</div>
              <div className="title">What do you want to do?</div>
              <div className="chip-row">
                <button className="chip" onClick={() => openPanel("shop")}>Merch</button>
                <button className="chip" onClick={() => openPanel("jal")}>Tokens</button>
                <button className="chip" onClick={() => openPanel("grid")}>Currency Generator</button>
                <button className="chip" onClick={() => openPanel("grid")}>NFT Generator</button>
              </div>
            </div>
            <div className="icon" aria-hidden>⚡</div>
          </div>
        </div>

        {!connected && <ConnectButton />}
      </section>

      {overlayOpen && (
        <button className="hub-overlay" aria-label="Close panel" onClick={() => setActivePanel("none")} />
      )}

      <section
        id="hub-panel"
        className={`hub-panel hub-panel--fit ${overlayOpen ? "hub-panel--overlay" : "hub-preview"}`}
        role={overlayOpen ? "dialog" : "region"}
        aria-modal={overlayOpen || undefined}
        aria-label="JAL/SOL Hub"
        ref={panelRef as any}
      >
        <div className="hub-panel-top">
          <h2 className="hub-title" ref={hubTitleRef} tabIndex={-1}>{panelTitle}</h2>
          {connected ? <DisconnectButton className="wallet-disconnect-btn" /> : <ConnectButton className="wallet-disconnect-btn" />}
        </div>

        <div className="hub-panel-body" ref={hubBodyRef}>
          {(activePanel !== "grid" && activePanel !== "none") && (
            <div className="hub-controls">
              <button type="button" className="button ghost" onClick={() => setActivePanel("grid")}>← Back to Hub</button>
            </div>
          )}

          {(activePanel === "grid" || activePanel === "none") && (
            <div className="hub-stack hub-stack--responsive" role="list">
              {tiles.map((t) => (
                <button key={t.key} type="button" className="img-btn" onClick={() => openPanel(t.key)} role="listitem"
                        aria-describedby={`tile-sub-${t.key}`} disabled={t.disabled}>
                  <img src={t.gif} alt="" className="hub-gif" loading="lazy" width={960} height={540}
                       onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  <div className="hub-btn">
                    {t.title}
                    {t.sub && <span id={`tile-sub-${t.key}`} className="sub">{t.sub}</span>}
                    {t.disabled && <span className="locked">Connect wallet to use</span>}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="hub-content">
            {(activePanel === "grid" || activePanel === "none") && !connected && (
              <div className="card">
                <h3>Welcome to JAL/SOL</h3>
                <p>Connect your wallet to unlock features. Use the tiles above to explore.</p>
              </div>
            )}

            {activePanel === "shop" && (
              <div className="card">
                <h3>Shop</h3>
                <p>🛒 Browse items purchasable with JAL. (Hook your product list here.)</p>
                {!connected && (
                  <>
                    <p style={{ opacity: .85 }}>Preview mode — connect to checkout.</p>
                    <ConnectButton className="button gold" />
                  </>
                )}
                <div className="chip-row" style={{ marginTop: 10 }}>
                  <button className="chip">Merch</button>
                  <button className="chip">Digital</button>
                  <button className="chip">Gift Cards</button>
                </div>
              </div>
            )}

            {activePanel === "jal" && (
              <div className="in-hub">
                <Suspense fallback={<div className="card">Loading JAL…</div>}>
                  <Jal inHub />
                </Suspense>
              </div>
            )}

            {activePanel === "vault" && (
              connected ? (
                <div className="card">
                  <h3>Your Wallet</h3>
                  <p>JAL: <strong>{fmt(jal)}</strong> • SOL: <strong>{fmt(sol)}</strong></p>
                  <p style={{ opacity: .85 }}>Recent activity and positions would appear here.</p>
                </div>
              ) : (
                <div className="card">
                  <h3>Vault</h3>
                  <p>Connect to view balances and recent activity.</p>
                  <ConnectButton className="button gold" />
                </div>
              )
            )}

            {["payments", "loans", "support"].includes(activePanel) && (
              <div className="card">
                <h3>{panelTitle}</h3>
                <p>Coming soon. {activePanel !== "support" ? "Preview only." : "For help, join our Telegram or reach us on X."}</p>
                {activePanel === "support" && (
                  <div className="chip-row" style={{ marginTop: 10 }}>
                    <a className="chip" href="https://t.me/jalsolcommute" target="_blank" rel="noreferrer">Telegram</a>
                    <a className="chip" href="https://x.com/JAL358" target="_blank" rel="noreferrer">X</a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
