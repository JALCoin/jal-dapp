// src/pages/Landing.tsx
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { JAL_MINT } from "../config/tokens";

const Jal = lazy(() => import("./Jal"));

type Panel =
  | "none"
  | "grid"
  | "shop"
  | "jal"
  | "vault"
  | "payments"
  | "loans"
  | "support";
type TileKey = Exclude<Panel, "none" | "grid">;
type LandingProps = { initialPanel?: Panel };

const WALLET_MODAL_SELECTORS =
  '.wallet-adapter-modal, .wallet-adapter-modal-container, .wcm-modal, [class*="walletconnect"]';

// Poster art (used for hover/promo reveals)
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

/* ---------- Product model (Shop) ---------- */
type Product = {
  id: string;
  name: string;
  tag: "Merch" | "Digital" | "Gift Cards";
  priceJal: number; // display only (payments not live)
  img?: string;
  blurb?: string;
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

  /* ---------- preload gifs + poster ---------- */
  useEffect(() => {
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
  }, [tiles]);

  /* ---------- URL/session init ---------- */
  const isPanel = (v: unknown): v is Panel =>
    v === "none" ||
    v === "grid" ||
    v === "shop" ||
    v === "jal" ||
    v === "vault" ||
    v === "payments" ||
    v === "loans" ||
    v === "support";

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

  // Keep URL in sync with state
  useEffect(() => {
    if (!activePanel) return;
    sessionStorage.setItem("landing:lastPanel", activePanel);
    const urlPanel = params.get("panel");
    if (activePanel === "none") {
      if (urlPanel) {
        params.delete("panel");
        setParams(params, { replace: true });
      }
    } else if (urlPanel !== activePanel) {
      params.set("panel", activePanel);
      setParams(params, { replace: true });
    }
  }, [activePanel, params, setParams]);

  // Keep state in sync when user uses back/forward
  useEffect(() => {
    const onPop = () => {
      const urlPanel = params.get("panel") as Panel | null;
      setActivePanel(urlPanel && isPanel(urlPanel) ? urlPanel : "none");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
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
        panelRef.current?.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "start",
        })
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
    return () => {
      obs.disconnect();
      setWalletFlag(false);
    };
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
    // focus the panel title for screen readers/keyboard users
    hubTitleRef.current?.focus?.();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const first = firstFocusRef.current;
      const last = lastFocusRef.current;
      if (!first || !last) return;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [overlayOpen]);

  /* ---------- Open helpers ---------- */
  const requiresWallet: Panel[] = ["jal", "vault", "payments", "loans"];
  const openPanel = useCallback(
    (id: Panel) => {
      setActivePanel(id);
      if (!connected && requiresWallet.includes(id)) setVisible(true);
      requestAnimationFrame(() =>
        panelRef.current?.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "start",
        })
      );
    },
    [connected, reducedMotion, setVisible]
  );

  const panelTitle =
    activePanel === "grid"
      ? "Hub"
      : activePanel === "shop"
      ? "Shop"
      : activePanel === "jal"
      ? "JAL"
      : activePanel === "vault"
      ? "Vault"
      : activePanel === "payments"
      ? "Payments"
      : activePanel === "loans"
      ? "Loans"
      : activePanel === "support"
      ? "Support"
      : "Welcome";

  /* ---------- LIVE BALANCES (SOL + JAL) ---------- */
  const [sol, setSol] = useState<number | null>(null);
  const [jal, setJal] = useState<number | null>(null);
  const [balLoading, setBalLoading] = useState(false);
  const [balErr, setBalErr] = useState<string | null>(null);

  const getEndpoint = () =>
    (window as any).__SOLANA_RPC_ENDPOINT__ ??
    import.meta.env.VITE_SOLANA_RPC ??
    clusterApiUrl("mainnet-beta");

  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connected) {
      setSol(null);
      setJal(null);
      return;
    }
    setBalErr(null);
    setBalLoading(true);

    const freshConn = new Connection(getEndpoint(), "confirmed");

    try {
      const lamports = await freshConn.getBalance(publicKey, "confirmed");
      setSol(lamports / LAMPORTS_PER_SOL);
    } catch (e) {
      console.error("[balances] SOL fetch failed:", e);
      setSol(null);
      setBalErr("rpc");
    }

    try {
      const resp = await freshConn.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID },
        "confirmed"
      );
      const total = resp.value.reduce((sum, { account }) => {
        const info = account.data.parsed.info;
        if (info.mint !== JAL_MINT) return sum;
        const raw = Number(info.tokenAmount?.amount ?? 0);
        const dec = Number(info.tokenAmount?.decimals ?? 0);
        const ui = raw / 10 ** dec;
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
  }, [publicKey, connected]);

  useEffect(() => {
    if (!connected || !publicKey) {
      setSol(null);
      setJal(null);
      return;
    }
    void fetchBalances();

    const poll = setInterval(fetchBalances, 15000);

    const wsConn = new Connection(getEndpoint(), "confirmed");
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
    const onConnectBalances = () => {
      void fetchBalances();
    };
    adapter.on("connect", onConnectBalances);
    return () => {
      try {
        adapter.off("connect", onConnectBalances);
      } catch {
        /* no-op */
      }
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
  const overlayActive = overlayOpen; // alias for readability

  return (
    <main className={`landing-gradient ${merging ? "landing-merge" : ""}`} aria-live="polite">
      {/* ===== Banking-style landing ===== */}
      <section className="bank-landing container" aria-label="Overview" aria-hidden={overlayActive || undefined}>
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
          {/* Apply poster hover art to ALL feature cards */}
          <button
            className="feature-card has-art"
            style={art(ART_MAP.jal!.pos, ART_MAP.jal!.zoom)}
            onClick={() => openPanel("jal")}
            aria-label="Open JAL"
          >
            <h4>JAL</h4>
            <div className="title">About &amp; Swap</div>
            <div className="icon">➕</div>
          </button>

          <button
            className="feature-card has-art"
            style={art(ART_MAP.shop!.pos, ART_MAP.shop!.zoom)}
            onClick={() => openPanel("shop")}
            aria-label="Open Store"
          >
            <h4>Store</h4>
            <div className="title">Buy with JAL</div>
            <div className="icon">🏬</div>
          </button>

          <button
            className="feature-card has-art"
            style={art(ART_MAP.vault!.pos, ART_MAP.vault!.zoom)}
            onClick={() => openPanel("vault")}
            aria-label="Open Vault"
          >
            <h4>Vault</h4>
            <div className="title">Assets &amp; Activity</div>
            <div className="icon">💳</div>
          </button>

          <button
            className="feature-card has-art"
            style={art("75% 78%", "240%")} // Hub slice
            onClick={() => openPanel("grid")}
            aria-label="Open Hub"
          >
            <h4>Hub</h4>
            <div className="title">All Panels</div>
            <div className="icon">🔗</div>
          </button>

        <div className="feature-card feature-wide" role="group" aria-label="Get Started">
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ opacity: 0.85 }}>Get Started</div>
              <div className="title">What do you want to do?</div>
              <div className="chip-row">
                <button className="chip" onClick={() => openPanel("shop")}>
                  Merch
                </button>
                <button className="chip" onClick={() => openPanel("jal")}>
                  Tokens
                </button>
                <button className="chip" onClick={() => openPanel("grid")}>
                  Currency Generator
                </button>
                <button className="chip" onClick={() => openPanel("grid")}>
                  NFT Generator
                </button>
              </div>
            </div>
            <div className="icon" aria-hidden>
              ⚡
            </div>
          </div>
        </div>

        {!connected && <ConnectButton />}
      </section>

      {/* Backdrop for overlay panels */}
      {overlayActive && (
        <button
          className="hub-overlay"
          aria-label="Close panel"
          onClick={() => setActivePanel("none")}
          ref={firstFocusRef}
        />
      )}

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
          {connected ? (
            <DisconnectButton className="wallet-disconnect-btn" />
          ) : (
            <ConnectButton className="wallet-disconnect-btn" />
          )}
        </div>

        <div className="hub-panel-body" ref={hubBodyRef}>
          {activePanel !== "grid" && activePanel !== "none" && (
            <div className="hub-controls">
              <button type="button" className="button ghost" onClick={() => setActivePanel("grid")}>
                ← Back to Hub
              </button>
            </div>
          )}

          {(activePanel === "grid" || activePanel === "none") && (
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
                    disabled={t.disabled}
                  >
                    <img
                      src={t.gif}
                      alt=""
                      className="hub-gif"
                      loading="lazy"
                      width={960}
                      height={540}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="hub-btn">
                      {t.title}
                      {t.sub && (
                        <span id={`tile-sub-${t.key}`} className="sub">
                          {t.sub}
                        </span>
                      )}
                      {t.disabled && <span className="locked">Connect wallet to use</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="hub-content">
            {(activePanel === "grid" || activePanel === "none") && !connected && (
              <div className="card">
                <h3>Welcome to JAL/SOL</h3>
                <p>Connect your wallet to unlock features. Use the tiles above to explore.</p>
              </div>
            )}

            {/* ===== SHOP (product cards + promo + coming-soon flow) ===== */}
            {activePanel === "shop" && (
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Shop</h3>
                <p className="muted" style={{ marginTop: 4 }}>
                  Payments are <strong>coming soon</strong>. Browse the catalog—CTAs are disabled until checkout goes live.
                </p>

                {/* Promo banner: Currency & NFT Generators */}
                <section
                  className="shop-promo has-art"
                  style={art("60% 44%", "220%")}
                  role="region"
                  aria-label="Create with JAL/SOL"
                >
                  <div className="shop-promo-inner">
                    <div className="promo-head">
                      <span className="promo-badge">NEW</span>
                      <h4 className="promo-title">Create with JAL/SOL</h4>
                    </div>
                    <p className="promo-sub">
                      Spin up a SOL-based currency or launch an NFT collection in minutes.
                    </p>
                    <div className="cta-group">
                      <button className="button gold" onClick={() => openPanel("grid")}>
                        Currency Generator
                      </button>
                      <button className="button neon" onClick={() => openPanel("grid")}>
                        NFT Generator
                      </button>
                    </div>
                  </div>
                </section>

                {shopNotice && (
                  <div className="shop-notice soon" role="status" aria-live="polite" style={{ marginTop: 10 }}>
                    {shopNotice}
                  </div>
                )}

                {/* Category filter */}
                <div className="chip-row" style={{ marginTop: 10 }}>
                  {(["All", "Merch", "Digital", "Gift Cards"] as const).map((cat) => (
                    <button
                      key={cat}
                      className={`chip ${shopFilter === cat ? "active" : ""}`}
                      onClick={() => setShopFilter(cat)}
                      aria-pressed={shopFilter === cat}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Product grid */}
                <div className="product-grid" role="list" style={{ marginTop: 14 }}>
                  {visibleProducts.map((p) => (
                    <article key={p.id} className="product-card" role="listitem" aria-label={p.name}>
                      <div className={`product-media ${p.img ? "" : "noimg"}`} aria-hidden>
                        {p.img ? (
                          <img
                            src={p.img}
                            alt=""
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
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
                  <p>
                    JAL: <strong>{fmt(jal)}</strong> • SOL: <strong>{fmt(sol)}</strong>
                  </p>
                  <p style={{ opacity: 0.85 }}>Recent activity and positions would appear here.</p>
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
                    <a className="chip" href="https://t.me/jalsolcommute" target="_blank" rel="noreferrer">
                      Telegram
                    </a>
                    <a className="chip" href="https://x.com/JAL358" target="_blank" rel="noreferrer">
                      X
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* hidden focus-sentinel when overlay is open */}
        {overlayActive && (
          <button
            ref={lastFocusRef}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
            aria-hidden="true"
            tabIndex={0}
            onFocus={() => {
              // cycle back to first element (backdrop)
              firstFocusRef.current?.focus();
            }}
          />
        )}
      </section>
    </main>
  );
}
