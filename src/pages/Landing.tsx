// src/pages/Landing.tsx
import type React from "react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, /* If your version exports it: */ TOKEN_2022_PROGRAM_ID as TOKEN_2022_ID_MAYBE } from "@solana/spl-token";
// If your @solana/spl-token version doesn't export TOKEN_2022_PROGRAM_ID,
// change the import above and uncomment this fallback:
// import { TOKEN_2022_PROGRAM_ID as TOKEN_2022_ID_MAYBE } from "@solana/spl-token-2022";

import { JAL_MINT } from "../config/tokens";
import { makeConnection } from "../config/rpc";

const Jal = lazy(() => import("./Jal"));

type Panel = "none" | "grid" | "shop" | "jal" | "vault" | "payments" | "loans" | "support";
type TileKey = Exclude<Panel, "none" | "grid">;
type LandingProps = { initialPanel?: Panel };

// Poster art / wallet modal selectors
const WALLET_MODAL_SELECTORS =
  '.wallet-adapter-modal, .wallet-adapter-modal-container, .wcm-modal, [class*="walletconnect"]';

const POSTER = "/fdfd19ca-7b20-42d8-b430-4ca75a94f0eb.png";
const art = (pos: string, zoom = "240%"): React.CSSProperties =>
  ({
    ["--art-img" as any]: `url('${POSTER}')`,
    ["--art-pos" as any]: pos,
    ["--art-zoom" as any]: zoom,
  } as React.CSSProperties);

/* ---------- Small helpers ---------- */
function DisconnectButton({ className }: { className?: string }) {
  const { connected, disconnect } = useWallet();
  if (!connected) return null;
  return (
    <button
      type="button"
      className={className ?? "wallet-disconnect-btn"}
      onClick={() => disconnect().catch(() => {})}
    >
      Disconnect
    </button>
  );
}
function ConnectButton({ className }: { className?: string }) {
  return <WalletMultiButton className={className ?? "landing-wallet"} />;
}

/* ---------- How-to: Create Liquidity with JAL (helpers) ---------- */
function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        } catch { /* noop */ }
      }}
      aria-live="polite"
    >
      {ok ? "Copied ✓" : "Copy Checklist"}
    </button>
  );
}

function LiquidityCalc() {
  const [tokenAmount, setTokenAmount] = useState<number>(1);
  const [priceInJal, setPriceInJal] = useState<number>(100);
  const jalNeeded =
    isFinite(tokenAmount) && isFinite(priceInJal) ? tokenAmount * priceInJal : 0;

  return (
    <div className="card" style={{ marginTop: 10 }}>
      <h4 style={{ marginTop: 0 }}>Quick calc</h4>
      <p className="muted" style={{ marginTop: 4 }}>
        AMMs require equal <em>value</em> on both sides. Estimate the JAL you’ll pair with your token.
      </p>

      <div className="chip-row" style={{ marginTop: 8 }}>
        <label className="chip" style={{ gap: 8 }}>
          <span>Deposit</span>
          <input
            aria-label="Your token amount"
            type="number"
            step="any"
            min="0"
            value={Number.isFinite(tokenAmount) ? tokenAmount : ""}
            onChange={(e) => setTokenAmount(Number(e.target.value))}
            className="shop-search"
            style={{ width: 120 }}
          />
          <span>YOUR</span>
        </label>

        <label className="chip" style={{ gap: 8 }}>
          <span>Price</span>
          <input
            aria-label="Price in JAL"
            type="number"
            step="any"
            min="0"
            value={Number.isFinite(priceInJal) ? priceInJal : ""}
            onChange={(e) => setPriceInJal(Number(e.target.value))}
            className="shop-search"
            style={{ width: 120 }}
          />
          <span>JAL / YOUR</span>
        </label>
      </div>

      <div style={{ marginTop: 10 }}>
        You’ll need approximately{" "}
        <strong>{jalNeeded.toLocaleString(undefined, { maximumFractionDigits: 6 })} JAL</strong>{" "}
        to pair with{" "}
        <strong>{tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} YOUR</strong>{" "}
        at{" "}
        <strong>{priceInJal.toLocaleString(undefined, { maximumFractionDigits: 6 })} JAL</strong>{" "}
        per YOUR.
      </div>
    </div>
  );
}

function LiquidityHowToCard() {
  const checklist = [
    "Prepare: have YOUR token mint, some JAL, and SOL for fees.",
    "Choose pair: YOUR/JAL (ecosystem) or YOUR/SOL (base).",
    "Pick a DEX (Raydium AMM/CLMM, etc.) and connect wallet.",
    "If no pool exists, create one; otherwise Add Liquidity.",
    "Select YOUR + JAL; AMM: deposit equal value. CLMM: set price/range.",
    "Confirm transactions; save and share the pool address.",
    "Optional: publish pool links on site/socials & aggregators.",
  ]
    .map((s, i) => `${i + 1}. ${s}`)
    .join("\n");

  return (
    <section
      className="card cyan"
      role="region"
      aria-label="How to: Create Liquidity with JAL"
      style={{ marginTop: 14 }}
    >
      <h3 style={{ marginTop: 0 }}>How to: Create Liquidity with JAL</h3>
      <p className="muted" style={{ marginTop: 4 }}>
        Pair your token with <strong>JAL</strong> (or SOL) to enable trading & price discovery.
      </p>

      <ol style={{ marginTop: 8 }}>
        <li><strong>Prepare assets.</strong> YOUR token, JAL, and some SOL for fees.</li>
        <li><strong>Pick a pair.</strong> <em>YOUR/JAL</em> or <em>YOUR/SOL</em>.</li>
        <li><strong>Choose a DEX.</strong> Use a permissionless AMM/CLMM (e.g., Raydium).</li>
        <li><strong>Create/Add Liquidity.</strong> Select YOUR + JAL, deposit equal value (AMM) or set price/range (CLMM).</li>
        <li><strong>Confirm transactions.</strong> Save the pool address and share it.</li>
        <li><strong>Optional.</strong> Link the pool across your channels for discovery.</li>
      </ol>

      <LiquidityCalc />

      <div className="chip-row" style={{ marginTop: 12 }}>
        <a className="chip" href="https://raydium.io" target="_blank" rel="noreferrer">Open Raydium</a>
        <a className="chip" href="https://jup.ag" target="_blank" rel="noreferrer">Open Jupiter</a>
      </div>

      <div className="cta-group" style={{ marginTop: 10 }}>
        <CopyBtn text={checklist} />
        <Link className="button gold" to="/crypto-generator/engine#step4">Mint/Distribute Supply</Link>
        <Link className="button" to="/crypto-generator/engine#step5">Finalize Metadata</Link>
      </div>
    </section>
  );
}

/* ---------- Product model (Shop) ---------- */
type Product = {
  id: string;
  name: string;
  tag: "Merch" | "Digital" | "Gift Cards";
  priceJal: number;
  img?: string;
  blurb?: string;
};

/* ---------- WalletToken model for Vault portfolio ---------- */
type WalletToken = {
  mint: string;
  uiAmount: number;
  decimals: number;
  symbol?: string; // to be filled later from metadata
};

export default function Landing({ initialPanel = "none" }: LandingProps) {
  const { publicKey, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [params, setParams] = useSearchParams();

  const [activePanel, setActivePanel] = useState<Panel>("none");
  const [merging, setMerging] = useState(false);
  const timerRef = useRef<number | null>(null);

  const hubBodyRef = useRef<HTMLDivElement | null>(null);
  const hubTitleRef = useRef<HTMLHeadingElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  // focus trap refs
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLButtonElement | null>(null);

  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false,
    []
  );
  const saveData =
    typeof navigator !== "undefined" &&
    // @ts-expect-error
    (navigator.connection?.saveData === true);

  // Prefetch heavy generator routes on intent (hover/focus)
  const prefetchGenerator = useCallback(() => {
    import("./CryptoGeneratorIntro");
    import("./CryptoGenerator");
  }, []);

  const tiles = useMemo<
    { key: TileKey; title: string; sub?: string; gif: string; disabled?: boolean }[]
  >(
    () => [
      { key: "jal", title: "JAL", sub: "About & Swap", gif: "/JAL.gif" },
      { key: "shop", title: "JAL/SOL — SHOP", sub: "Buy items with JAL", gif: "/JALSOL.gif" },
      { key: "vault", title: "VAULT", sub: "Your assets", gif: "/VAULT.gif" },
    ],
    []
  );

  /* ---------- SHOP: demo catalog + filtering ---------- */
  const products = useMemo<Product[]>(
    () => [
      { id: "hoodie", name: "JAL Hoodie", tag: "Merch", priceJal: 420, img: "/products/hoodie.png", blurb: "Heavyweight, embroidered." },
      { id: "cap", name: "Logo Cap", tag: "Merch", priceJal: 180, img: "/products/cap.png", blurb: "Adjustable snapback." },
      { id: "sticker", name: "Sticker Pack", tag: "Merch", priceJal: 60, img: "/products/stickers.png", blurb: "Glossy vinyl set." },
      { id: "gift25", name: "Gift Card 25", tag: "Gift Cards", priceJal: 250, img: "/products/gift25.png", blurb: "Send JAL love." },
      { id: "gift50", name: "Gift Card 50", tag: "Gift Cards", priceJal: 500, img: "/products/gift50.png" },
      { id: "wallp", name: "Phone Wallpaper", tag: "Digital", priceJal: 15, img: "/products/wallpaper.png", blurb: "4K / OLED-friendly." },
    ],
    []
  );
  const [shopFilter, setShopFilter] = useState<"All" | Product["tag"]>("All");
  const [shopNotice, setShopNotice] = useState<string | null>(null);

  const visibleProducts = useMemo(
    () => products.filter((p) => (shopFilter === "All" ? true : p.tag === shopFilter)),
    [products, shopFilter]
  );

  /* ---------- preload gifs + poster (respect Save-Data) ---------- */
  useEffect(() => {
    if (saveData) {
      const i = new Image();
      i.src = POSTER;
      return () => { i.src = ""; };
    }
    const imgs = [
      ...tiles.map((t) => {
        const i = new Image();
        i.decoding = "async";
        i.loading = "eager";
        i.src = t.gif;
        return i;
      }),
      (() => {
        const i = new Image();
        i.src = POSTER;
        return i;
      })(),
    ];
    return () => imgs.forEach((i) => (i.src = ""));
  }, [tiles, saveData]);

  /* ---------- URL/session init + sync ---------- */
  const isPanel = (v: unknown): v is Panel =>
    v === "none" || v === "grid" || v === "shop" || v === "jal" || v === "vault" || v === "payments" || v === "loans" || v === "support";

  useEffect(() => {
    const fromUrl = params.get("panel") as Panel | null;
    const fromSession = (sessionStorage.getItem("landing:lastPanel") as Panel | null) ?? null;
    const start: Panel =
      (fromUrl && isPanel(fromUrl) ? fromUrl : null) ??
      (fromSession && isPanel(fromSession) ? fromSession : null) ??
      initialPanel;
    setActivePanel(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionStorage.setItem("landing:lastPanel", activePanel);
    const next = new URLSearchParams(params);
    const urlPanel = params.get("panel");
    if (activePanel === "none") {
      if (urlPanel) {
        next.delete("panel");
        setParams(next, { replace: true });
      }
    } else if (urlPanel !== activePanel) {
      next.set("panel", activePanel);
      setParams(next, { replace: true });
    }
  }, [activePanel, params, setParams]);

  useEffect(() => {
    const urlPanel = params.get("panel") as Panel | null;
    const next: Panel = urlPanel && isPanel(urlPanel) ? urlPanel : "none";
    setActivePanel((p) => (p === next ? p : next));
  }, [params]);

  /* ---------- Wallet events / merge effect ---------- */
  useEffect(() => {
    if (!wallet?.adapter) return;
    const onConnect = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMerging(true);
      const delay = reducedMotion ? 0 : 350;
      timerRef.current = window.setTimeout(() => setMerging(false), delay);
      setActivePanel((p) => (p === "none" ? "grid" : p));
      requestAnimationFrame(() =>
        panelRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" })
      );
    };
    wallet.adapter.on("connect", onConnect);
    return () => {
      wallet.adapter.off("connect", onConnect);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [wallet, reducedMotion]);

  /* ---------- wallet modal visibility flag ---------- */
  const setWalletFlag = useCallback((on: boolean) => {
    const root = document.body;
    if (on) root.setAttribute("data-wallet-visible", "true");
    else root.removeAttribute("data-wallet-visible");
  }, []);
  useEffect(() => {
    const check = () => setWalletFlag(!!document.querySelector(WALLET_MODAL_SELECTORS));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => { obs.disconnect(); setWalletFlag(false); };
  }, [setWalletFlag]);

  /* ---------- overlay controls (scroll lock + Escape) ---------- */
  const overlayOpen = activePanel !== "none" && activePanel !== "grid";
  useEffect(() => {
    if (overlayOpen) document.body.setAttribute("data-hub-open", "true");
    else document.body.removeAttribute("data-hub-open");
    return () => document.body.removeAttribute("data-hub-open");
  }, [overlayOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && overlayOpen) setActivePanel("none");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen]);

  // Overlay focus trap + focus management
  useEffect(() => {
    if (!overlayOpen) return;
    hubTitleRef.current?.focus?.();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const first = firstFocusRef.current;
      const last = lastFocusRef.current;
      if (!first || !last) return;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first) { e.preventDefault(); last.focus(); }
      } else {
        if (active === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [overlayOpen]);

  // Re-center overlay on resize/orientation change
  useEffect(() => {
    const onResize = () => {
      if (overlayOpen) {
        panelRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      }
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize as any);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize as any);
    };
  }, [overlayOpen, reducedMotion]);

  /* ---------- Open helpers ---------- */
  const requiresWallet: Panel[] = ["jal", "vault", "payments", "loans"];
  const openPanel = useCallback(
    (id: Panel) => {
      setActivePanel(id);
      if (!connected && requiresWallet.includes(id)) setVisible(true);
      requestAnimationFrame(() =>
        panelRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" })
      );
    },
    [connected, reducedMotion, setVisible]
  );

  const panelTitle =
    activePanel === "grid" ? "Hub" :
    activePanel === "shop" ? "Shop" :
    activePanel === "jal" ? "JAL" :
    activePanel === "vault" ? "Vault" :
    activePanel === "payments" ? "Payments" :
    activePanel === "loans" ? "Loans" :
    activePanel === "support" ? "Support" : "Welcome";

  /* ---------- LIVE BALANCES (SOL + JAL + Portfolio) ---------- */
  const [sol, setSol] = useState<number | null>(null);
  const [jal, setJal] = useState<number | null>(null);
  const [portfolio, setPortfolio] = useState<WalletToken[]>([]);
  const [balLoading, setBalLoading] = useState(false);
  const [balErr, setBalErr] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connected) {
      setSol(null);
      setJal(null);
      setPortfolio([]);
      return;
    }
    setBalErr(null);
    setBalLoading(true);

    const freshConn = makeConnection("confirmed");

    try {
      const lamports = await freshConn.getBalance(publicKey, "confirmed");
      setSol(lamports / LAMPORTS_PER_SOL);
    } catch (e) {
      console.error("[balances] SOL fetch failed:", e);
      setSol(null); setBalErr("rpc");
    }

    try {
      // Fetch legacy + token-2022 accounts
      const TOKEN_2022_PROGRAM_ID = TOKEN_2022_ID_MAYBE as unknown as typeof TOKEN_PROGRAM_ID;
      const [legacy, t22] = await Promise.all([
        freshConn.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_PROGRAM_ID },
          "confirmed"
        ),
        TOKEN_2022_PROGRAM_ID
          ? freshConn.getParsedTokenAccountsByOwner(
              publicKey,
              { programId: TOKEN_2022_PROGRAM_ID },
              "confirmed"
            ).catch(() => ({ value: [] as typeof legacy.value }))
          : Promise.resolve({ value: [] as typeof legacy.value }),
      ]);

      const merged = [...legacy.value, ...t22.value];

      const tokens: WalletToken[] = merged
        .map(({ account }) => {
          const info = account.data.parsed.info;
          const raw = Number(info.tokenAmount?.amount ?? 0);
          const dec = Number(info.tokenAmount?.decimals ?? 0);
          const ui = dec > 0 ? raw / 10 ** dec : raw;
          return {
            mint: info.mint as string,
            uiAmount: Number.isFinite(ui) ? ui : 0,
            decimals: dec,
          };
        })
        .filter(t => t.uiAmount > 0);

      // JAL total derived from portfolio
      const jalTotal = tokens
        .filter(t => t.mint === JAL_MINT)
        .reduce((s, t) => s + t.uiAmount, 0);

      setJal(jalTotal);
      setPortfolio(tokens);
    } catch (e) {
      console.error("[balances] token accounts fetch failed:", e);
      setPortfolio([]);
      setJal((v) => v ?? null);
      setBalErr((s) => s ?? "rpc");
    } finally {
      setBalLoading(false);
    }
  }, [publicKey, connected]);

  useEffect(() => {
    if (!connected || !publicKey) { setSol(null); setJal(null); setPortfolio([]); return; }
    void fetchBalances();

    const poll = setInterval(fetchBalances, 15000);

    const wsConn = makeConnection("confirmed");
    const sub = wsConn.onAccountChange(
      publicKey,
      (ai) => setSol(ai.lamports / LAMPORTS_PER_SOL),
      "confirmed"
    );

    return () => {
      clearInterval(poll);
      wsConn.removeAccountChangeListener(sub).catch(() => {});
    };
  }, [connected, publicKey, fetchBalances]);

  useEffect(() => {
    const adapter = wallet?.adapter;
    if (!adapter) return;
    const onConnectBalances = () => { void fetchBalances(); };
    adapter.on("connect", onConnectBalances);
    return () => {
      try { adapter.off("connect", onConnectBalances); } catch { /* no-op */ }
    };
  }, [wallet, fetchBalances]);

  const fmt = (n: number | null, digits = 4) =>
    n == null ? "--" : n.toLocaleString(undefined, { maximumFractionDigits: digits });

  // Hover art presets for hub tiles
  const ART_MAP: Partial<Record<TileKey, { pos: string; zoom?: string }>> = {
    jal: { pos: "26% 38%", zoom: "240%" },
    shop: { pos: "73% 38%", zoom: "240%" },
    vault: { pos: "28% 78%", zoom: "240%" },
    payments: { pos: "46% 64%", zoom: "240%" },
    loans: { pos: "62% 42%", zoom: "240%" },
    support: { pos: "82% 28%", zoom: "240%" },
  };

  /* ===========================================================
     Render
  ============================================================ */
  const overlayActive = activePanel !== "none" && activePanel !== "grid";
  const shouldLoadGifs = !saveData && !reducedMotion;

  return (
    <main className={`landing-gradient ${merging ? "landing-merge" : ""}`} aria-live="polite">
      {/* Backdrop for overlay panels */}
      {overlayActive && (
        <button
          type="button"
          className="hub-overlay"
          aria-label="Close panel"
          onClick={() => setActivePanel("none")}
          ref={firstFocusRef}
        />
      )}

      {/* Render Hub only when not 'none' */}
      {activePanel !== "none" && (
        <section
          id="hub-panel"
          className={`hub-panel hub-panel--fit ${overlayActive ? "hub-panel--overlay" : "hub-preview"}`}
          role={overlayActive ? "dialog" : "region"}
          aria-modal={overlayActive || undefined}
          aria-label="JAL/SOL Hub"
          ref={panelRef as any}
        >
          <div className="hub-panel-top">
            <h2 className="hub-title" ref={hubTitleRef} tabIndex={-1}>
              {panelTitle}
            </h2>
            {connected ? <DisconnectButton className="wallet-disconnect-btn" /> : <ConnectButton className="wallet-disconnect-btn" />}
          </div>

          <div className="hub-panel-body" ref={hubBodyRef}>
            {/* Dashboard (balances + feature grid) INSIDE the hub when panel=grid */}
            {activePanel === "grid" && (
              <div className="hub-dashboard">
                <div className="bank-status">
                  {connected ? "WALLET CONNECTED" : "WALLET NOT CONNECTED"}
                  {connected && (
                    <button
                      className="chip"
                      type="button"
                      style={{ marginLeft: 10 }}
                      onClick={fetchBalances}
                      aria-label="Refresh balances"
                    >
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
                  <button
                    type="button"
                    className="feature-card has-art"
                    style={art(ART_MAP.jal!.pos, ART_MAP.jal!.zoom)}
                    onClick={() => openPanel("jal")}
                    aria-label="Open JAL"
                  >
                    <h4>JAL</h4>
                    <div className="title">About &amp; Swap</div>
                    <div className="icon" aria-hidden>➕</div>
                  </button>

                  <button
                    type="button"
                    className="feature-card has-art"
                    style={art(ART_MAP.shop!.pos, ART_MAP.shop!.zoom)}
                    onClick={() => openPanel("shop")}
                    aria-label="Open Store"
                  >
                    <h4>Store</h4>
                    <div className="title">Buy with JAL</div>
                    <div className="icon" aria-hidden>🏬</div>
                  </button>

                  <button
                    type="button"
                    className="feature-card has-art"
                    style={art(ART_MAP.vault!.pos, ART_MAP.vault!.zoom)}
                    onClick={() => openPanel("vault")}
                    aria-label="Open Vault"
                  >
                    <h4>Vault</h4>
                    <div className="title">Assets &amp; Activity</div>
                    <div className="icon" aria-hidden>💳</div>
                  </button>

                  <div className="feature-card feature-wide" role="group" aria-label="Get Started">
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ opacity: 0.85 }}>Get Started</div>
                      <div className="title">What do you want to do?</div>
                      <div className="chip-row">
                        <Link className="chip" to="/crypto-generator/engine#step1" onMouseEnter={prefetchGenerator} onFocus={prefetchGenerator}>
                          Create Token
                        </Link>
                        <Link className="chip" to="/crypto-generator" onMouseEnter={prefetchGenerator} onFocus={prefetchGenerator}>
                          Create NFT
                        </Link>
                        <a className="chip" href="https://raydium.io" target="_blank" rel="noreferrer">Add Liquidity</a>
                        <a className="chip" href="https://jup.ag" target="_blank" rel="noreferrer">Swap Aggregator</a>
                      </div>
                    </div>
                    <div className="icon" aria-hidden>⚡</div>
                  </div>
                </div>
              </div>
            )}

            {/* Back button only when not grid */}
            {activePanel !== "grid" && (
              <div className="hub-controls">
                <button type="button" className="button ghost" onClick={() => setActivePanel("grid")}>
                  ← Back to Hub
                </button>
              </div>
            )}

            {/* Tiles appear only in grid mode */}
            {activePanel === "grid" && (
              <div className="hub-stack hub-stack--responsive" role="list" aria-hidden={overlayActive || undefined}>
                {tiles.map((t) => {
                  const artCfg = ART_MAP[t.key];
                  const hasArt = !!artCfg;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      className={`img-btn${hasArt ? " has-art" : ""}`}
                      style={hasArt ? art(artCfg!.pos, artCfg!.zoom) : undefined}
                      onClick={() => openPanel(t.key)}
                      role="listitem"
                      aria-describedby={`tile-sub-${t.key}`}
                    >
                      {shouldLoadGifs && (
                        <img
                          src={t.gif}
                          alt=""
                          className="hub-gif"
                          loading="lazy"
                          width={960}
                          height={540}
                          decoding="async"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <div className="hub-btn">
                        {t.title}
                        {t.sub && <span id={`tile-sub-${t.key}`} className="sub">{t.sub}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="hub-content">
              {activePanel === "shop" && (
                <div className="card">
                  <h3 style={{ marginTop: 0 }}>Shop</h3>
                  <p className="muted" style={{ marginTop: 4 }}>
                    Payments are <strong>coming soon</strong>. Browse the catalog—CTAs are disabled until checkout goes live.
                  </p>

                  <section
                    className="shop-promo has-art"
                    style={art("58% 42%", "220%")}
                    role="region"
                    aria-label="Create with JAL/SOL"
                  >
                    <div className="shop-promo-inner">
                      <div className="promo-head">
                        <span className="promo-badge">NEW</span>
                        <h4 className="promo-title">Create with JAL/SOL</h4>
                      </div>
                      <p className="promo-sub">Choose what you’re launching. We’ll guide you step-by-step.</p>

                      <div className="product-grid" style={{ marginTop: 8 }}>
                        <article className="product-card">
                          <div className="product-body">
                            <h4 className="product-title">Currency / Token (Fungible)</h4>
                            <div className="product-blurb">
                              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                                <li>Interchangeable units (e.g., 1 JAL = 1 JAL)</li>
                                <li>Great for points, memecoins, governance</li>
                                <li>Supply + mint authority you control</li>
                              </ul>
                            </div>
                            <div className="muted" style={{ marginTop: 8 }}>Creates: SPL mint + ATA + Metadata</div>
                            <div style={{ marginTop: 10 }}>
                              <Link className="button gold" to="/crypto-generator/engine#step1">Start Token</Link>
                            </div>
                            <div className="chip-row" style={{ marginTop: 10 }}>
                              <span className="chip">Loyalty</span>
                              <span className="chip">Governance</span>
                              <span className="chip">Memecoin</span>
                            </div>
                          </div>
                        </article>

                        <article className="product-card">
                          <div className="product-body">
                            <h4 className="product-title">NFT (Non-Fungible)</h4>
                            <div className="product-blurb">
                              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                                <li>Unique items or passes (1/1 or small series)</li>
                                <li>Artwork stored via Lighthouse/IPFS</li>
                                <li>Collection metadata for discovery</li>
                              </ul>
                            </div>
                            <div className="muted" style={{ marginTop: 8 }}>Creates: NFT mint(s) + Collection Metadata</div>
                            <div style={{ marginTop: 10 }}>
                              <Link className="button neon" to="/crypto-generator">Start NFT</Link>
                            </div>
                            <div className="chip-row" style={{ marginTop: 10 }}>
                              <span className="chip">Art</span>
                              <span className="chip">Membership</span>
                              <span className="chip">Access Pass</span>
                            </div>
                          </div>
                        </article>
                      </div>
                    </div>
                  </section>

                  <LiquidityHowToCard />

                  {shopNotice && (
                    <div className="shop-notice soon" role="status" aria-live="polite" style={{ marginTop: 10 }}>
                      {shopNotice}
                    </div>
                  )}

                  <div className="chip-row" style={{ marginTop: 10 }}>
                    {(["All", "Merch", "Digital", "Gift Cards"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`chip ${shopFilter === cat ? "active" : ""}`}
                        onClick={() => setShopFilter(cat)}
                        aria-pressed={shopFilter === cat}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="product-grid" role="list" style={{ marginTop: 14 }}>
                    {visibleProducts.map((p) => (
                      <article key={p.id} className="product-card" role="listitem" aria-label={p.name}>
                        <div className={`product-media ${p.img ? "" : "noimg"}`} aria-hidden>
                          {p.img ? (
                            <img
                              src={p.img}
                              alt=""
                              width={800}
                              height={600}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : null}
                          <span className="badge soon">Coming&nbsp;soon</span>
                        </div>
                        <div className="product-body">
                          <h4 className="product-title">{p.name}</h4>
                          {p.blurb && <div className="product-blurb">{p.blurb}</div>}
                          <div className="product-price">
                            <span className="price-jal">{p.priceJal.toLocaleString()} JAL</span>
                            <span className="muted">• {p.tag}</span>
                          </div>
                          <button
                            type="button"
                            className="button"
                            aria-disabled="true"
                            title="Checkout not available yet"
                            onClick={(e) => {
                              e.preventDefault();
                              setShopNotice("Checkout isn’t live yet — payments with JAL are coming soon.");
                            }}
                          >
                            Pay with JAL
                          </button>
                        </div>
                      </article>
                    ))}
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

              {activePanel === "vault" &&
                (connected ? (
                  <div className="card">
                    <h3>Your Wallet</h3>
                    <p>JAL: <strong>{fmt(jal)}</strong> • SOL: <strong>{fmt(sol)}</strong></p>

                    {portfolio.length ? (
                      <div style={{ marginTop: 10 }}>
                        <div className="product-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                          {portfolio.map(t => (
                            <article key={t.mint} className="product-card">
                              <div className="product-body">
                                <h4 className="product-title">{t.symbol ?? `${t.mint.slice(0,4)}…${t.mint.slice(-4)}`}</h4>
                                <div className="product-blurb mono-sm">Mint: {t.mint}</div>
                                <div className="product-price">
                                  <span className="price-jal">
                                    {t.uiAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                  </span>
                                  <span className="muted">• {t.decimals} dec</span>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p style={{ opacity: 0.85, marginTop: 8 }}>No SPL balances detected.</p>
                    )}
                  </div>
                ) : (
                  <div className="card">
                    <h3>Vault</h3>
                    <p>Connect to view balances and recent activity.</p>
                    <ConnectButton className="button gold" />
                  </div>
                ))}

              {["payments", "loans", "support"].includes(activePanel) && (
                <div className="card">
                  <h3>{panelTitle}</h3>
                  <p>
                    Coming soon.{" "}
                    {activePanel !== "support" ? "Preview only." : "For help, join our Telegram or reach us on X."}
                  </p>
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

          {/* hidden focus-sentinel when overlay is open */}
          {overlayActive && (
            <button
              type="button"
              ref={lastFocusRef}
              style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
              aria-hidden="true"
              tabIndex={0}
              onFocus={() => { firstFocusRef.current?.focus(); }}
            />
          )}
        </section>
      )}
    </main>
  );
}
