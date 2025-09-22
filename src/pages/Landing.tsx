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
import { Link, useSearchParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID as TOKEN_2022_ID_MAYBE,
} from "@solana/spl-token";
// If your @solana/spl-token does NOT export TOKEN_2022_PROGRAM_ID:
// import { TOKEN_2022_PROGRAM_ID as TOKEN_2022_ID_MAYBE } from "@solana/spl-token-2022";

import { JAL_MINT } from "../config/tokens";
import { makeConnection } from "../config/rpc";

const Jal = lazy(() => import("./Jal"));

/* ────────────────────────────────────────────────────────────────────────── */

type Panel = "grid" | "shop" | "jal" | "vault" | "payments" | "loans" | "support";
type TileKey = Panel;
type LandingProps = { initialPanel?: Panel };

const WALLET_MODAL_SELECTORS =
  '.wallet-adapter-modal, .wallet-adapter-modal-container, .wcm-modal, [class*="walletconnect"]';

const POSTER = "/fdfd19ca-7b20-42d8-b430-4ca75a94f0eb.png";
const art = (pos: string, zoom = "240%"): React.CSSProperties =>
  ({
    ["--art-img" as any]: `url('${POSTER}')`,
    ["--art-pos" as any]: pos,
    ["--art-zoom" as any]: zoom,
  } as React.CSSProperties);

// TOKEN_2022 id resolver (handles differing package exports)
const TOKEN_2022_PROGRAM_ID: PublicKey = (() => {
  try {
    const maybe = TOKEN_2022_ID_MAYBE as unknown as any;
    if (!maybe) return new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
    if (maybe instanceof PublicKey) return maybe;
    if (typeof maybe === "string") return new PublicKey(maybe);
    if (maybe?.toBase58) return new PublicKey(maybe.toBase58());
    return new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
  } catch {
    return new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
  }
})();

const RAYDIUM_PAIR_URL =
  `https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${encodeURIComponent(JAL_MINT)}&fixed=in`;

const safeConn = () => {
  try {
    return makeConnection("confirmed");
  } catch (e) {
    console.error("[rpc] makeConnection failed", e);
    throw e;
  }
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Small helpers                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

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
        } catch {}
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

/* ────────────────────────────────────────────────────────────────────────── */
/* Fiat: contained/collapsible picker + **per-token** fiat prices            */
/* ────────────────────────────────────────────────────────────────────────── */

type Fiat =
  | "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD" | "CHF" | "SEK"
  | "NOK" | "DKK" | "SGD" | "HKD" | "INR";

const FIATS: Fiat[] = ["USD","EUR","GBP","JPY","AUD","CAD","CHF","SEK","NOK","DKK","SGD","HKD","INR"];

function inferDefaultFiat(): Fiat {
  try {
    const saved = localStorage.getItem("jal:fiat") as Fiat | null;
    if (saved && FIATS.includes(saved)) return saved;
  } catch {}
  try {
    const loc = navigator.language.toLowerCase();
    if (loc.includes("-au")) return "AUD";
    if (loc.includes("-gb")) return "GBP";
    if (loc.includes("-jp")) return "JPY";
    if (loc.includes("-ca")) return "CAD";
    if (loc.includes("-ch")) return "CHF";
    if (loc.includes("-se")) return "SEK";
    if (loc.includes("-no")) return "NOK";
    if (loc.includes("-dk")) return "DKK";
    if (loc.includes("-sg")) return "SGD";
    if (loc.includes("-hk")) return "HKD";
    if (loc.includes("-in")) return "INR";
    if (/-de|-fr|-es|-it|-nl|-pt|-be|-fi|-ie/.test(loc)) return "EUR";
  } catch {}
  return "USD";
}

// Collapsible fiat picker popover
function FiatPicker({
  value, onChange,
}: { value: Fiat; onChange: (v: Fiat) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div ref={ref} style={{ position:"relative", display:"inline-block" }}>
      <button
        type="button"
        className="chip sm mono"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        title="Choose fiat currency"
      >
        Fiat: {value}
      </button>

      {open && (
        <div
          role="listbox"
          className="glass"
          style={{
            position:"absolute", insetInlineStart:0, marginTop:8,
            border:"1px solid var(--stroke)", borderRadius:12, padding:8,
            minWidth:220, zIndex:10, boxShadow:"0 10px 30px rgba(0,0,0,.55)"
          }}
        >
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, maxHeight:180, overflow:"auto" }}>
            {FIATS.map(code => (
              <button
                key={code}
                role="option"
                aria-selected={value===code}
                className={`chip sm ${value===code ? "active" : ""}`}
                onClick={() => { onChange(code); setOpen(false); try { localStorage.setItem("jal:fiat", code); } catch {} }}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Data fetchers
async function getFxUSD(): Promise<Record<string, number> | null> {
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD");
    const j = await r.json();
    return j?.rates ?? null;
  } catch { return null; }
}
async function getSolUsd(): Promise<number | null> {
  try {
    const r = await fetch("https://price.jup.ag/v6/price?ids=SOL");
    const j = await r.json();
    const p = Number(j?.data?.SOL?.price);
    return Number.isFinite(p) ? p : null;
  } catch { return null; }
}
async function getJalUsd(): Promise<number | null> {
  try {
    const id = encodeURIComponent(String(JAL_MINT));
    const r = await fetch(`https://price.jup.ag/v6/price?ids=${id}`);
    const j = await r.json();
    const p = Number(j?.data?.[String(JAL_MINT)]?.price);
    return Number.isFinite(p) ? p : null;
  } catch { return null; }
}
const fmtMoney = (v: number | null, fiat: Fiat) =>
  v == null ? "—" : new Intl.NumberFormat(undefined, { style:"currency", currency: fiat, maximumFractionDigits: 6 }).format(v);

/* ────────────────────────────────────────────────────────────────────────── */
/* Swap fee helpers (visual-only estimates)                                  */
/* ────────────────────────────────────────────────────────────────────────── */

const AMM_FEE_BPS = 25;                 // 0.25% typical AMM taker fee
const BASE_TX_LAMPORTS = 5_000;         // base network fee (no priority)
const LAMPORTS_PER_SOL_F = 1_000_000_000;

function estimateNetworkFeeSol(): number {
  return BASE_TX_LAMPORTS / LAMPORTS_PER_SOL_F;
}

function fmtNetworkFee(
  solUsd: number | null,
  fxUSD: Record<string, number> | null,
  fiat: Fiat
): { sol: string; fiat: string } {
  const solFee = estimateNetworkFeeSol();
  const fiatRate = fxUSD?.[fiat] ?? 1;
  const feeFiat = solUsd != null ? solFee * solUsd * fiatRate : null;

  const solStr = `${solFee.toLocaleString(undefined, { maximumFractionDigits: 6 })} SOL`;
  const fiatStr =
    feeFiat == null
      ? "—"
      : new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: fiat,
          maximumFractionDigits: 6,
        }).format(feeFiat);

  return { sol: solStr, fiat: fiatStr };
}

function SwapFeeChip({
  label,
  solUsd,
  fxUSD,
  fiat,
}: {
  label: string; // "SOL→JAL" | "JAL→SOL"
  solUsd: number | null;
  fxUSD: Record<string, number> | null;
  fiat: Fiat;
}) {
  const { sol, fiat: fiatTxt } = fmtNetworkFee(solUsd, fxUSD, fiat);
  return (
    <span className="chip sm mono" title={`${label} estimated fees`}>
      {label}: DEX ≈ {(AMM_FEE_BPS / 100).toFixed(2)}% • Net ≈ {sol} ({fiatTxt})
    </span>
  );
}

/* Models */
type Product = {
  id: string;
  name: string;
  tag: "Merch" | "Digital" | "Gift Cards";
  priceJal: number;
  img?: string;
  blurb?: string;
};
type TokenRow = {
  mint: string;
  uiAmount: number;
  decimals: number;
  program: "spl-token" | "token-2022";
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Component                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export default function Landing({ initialPanel = "grid" }: LandingProps) {
  const { publicKey, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [params, setParams] = useSearchParams();

  const [activePanel, setActivePanel] = useState<Panel>("grid");
  const [merging, setMerging] = useState(false);

  const didInitRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const hubBodyRef = useRef<HTMLDivElement | null>(null);
  const hubTitleRef = useRef<HTMLHeadingElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
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

  const prefetchGenerator = useCallback((): void => {
    import("./CryptoGeneratorIntro");
    import("./CryptoGenerator");
  }, []);

  const tiles = useMemo(
    () => [
      { key: "jal" as const, title: "JAL", sub: "About & Swap", gif: "/JAL.gif" },
      { key: "shop" as const, title: "JAL/SOL — SHOP", sub: "Buy items with JAL", gif: "/JALSOL.gif" },
      { key: "vault" as const, title: "VAULT", sub: "Your assets", gif: "/VAULT.gif" },
    ],
    []
  );

  /* Shop demo data */
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

  /* Preload gifs/poster (respect Save-Data) */
  useEffect(() => {
    if (saveData) {
      const i = new Image();
      i.src = POSTER;
      return () => void (i.src = "");
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

  /* URL/session helpers */
  const isPanel = (v: unknown): v is Panel =>
    ["grid", "shop", "jal", "vault", "payments", "loans", "support"].includes(String(v));

  // Clean any sticky flags on mount/unmount
  useEffect(() => {
    document.body.removeAttribute("data-hub-open");
    document.body.removeAttribute("data-wallet-visible");
    return () => {
      document.body.removeAttribute("data-hub-open");
      document.body.removeAttribute("data-wallet-visible");
    };
  }, []);

  // INITIALIZE from URL or session (once) — default to grid
  useEffect(() => {
    const fromUrl = params.get("panel") as Panel | null;
    const fromSession = (sessionStorage.getItem("landing:lastPanel") as Panel | null) ?? null;
    const start: Panel =
      (fromUrl && isPanel(fromUrl) ? fromUrl : null) ??
      (fromSession && isPanel(fromSession) ? fromSession : null) ??
      initialPanel ?? "grid";

    setActivePanel(start);
    didInitRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SYNC activePanel -> URL + session (grid = no param)
  useEffect(() => {
    if (!didInitRef.current) return;

    sessionStorage.setItem("landing:lastPanel", activePanel);

    const next = new URLSearchParams(params);
    const urlPanel = params.get("panel");
    if (activePanel === "grid") {
      if (urlPanel) {
        next.delete("panel");
        setParams(next, { replace: true });
      }
    } else if (urlPanel !== activePanel) {
      next.set("panel", activePanel);
      setParams(next, { replace: true });
    }
  }, [activePanel, params, setParams]);

  // React to URL changes (external nav)
  useEffect(() => {
    const urlPanel = params.get("panel") as Panel | null;
    const next: Panel = urlPanel && isPanel(urlPanel) ? urlPanel : "grid";
    setActivePanel((p) => (p === next ? p : next));
  }, [params]);

  /* Wallet events / merge effect */
  useEffect(() => {
    if (!wallet?.adapter) return;
    const onConnect = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMerging(true);
      const delay = reducedMotion ? 0 : 350;
      timerRef.current = window.setTimeout(() => setMerging(false), delay);
      setActivePanel((p) => (p === "grid" ? "grid" : p));
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

  /* Close hub on disconnect => go back to grid (not empty) */
  useEffect(() => {
    if (!connected) setActivePanel("grid");
  }, [connected]);

  useEffect(() => {
    const adapter = wallet?.adapter;
    if (!adapter) return;
    const onDisconnect = () => setActivePanel("grid");
    adapter.on("disconnect", onDisconnect);
    return () => { try { adapter.off("disconnect", onDisconnect); } catch {} };
  }, [wallet]);

  // Re-open Hub grid when already connected and no explicit URL
  useEffect(() => {
    if (!didInitRef.current) return;
    const urlPanel = params.get("panel");
    if (urlPanel && isPanel(urlPanel)) return;
    if (connected && activePanel === "grid") {
      const last = (sessionStorage.getItem("landing:lastPanel") as Panel | null) ?? null;
      if (last && isPanel(last) && last !== "grid") setActivePanel("grid");
    }
  }, [connected, activePanel, params]);

  /* Window helpers */
  useEffect(() => {
    (window as any).openHub = () => setActivePanel("grid");
    (window as any).closeHub = () => setActivePanel("grid");
    return () => {
      try { delete (window as any).openHub; delete (window as any).closeHub; } catch {}
    };
  }, []);

  /* Wallet modal visibility flag */
  const setWalletFlag = useCallback((on: boolean): void => {
    const root = document.body;
    if (on) root.setAttribute("data-wallet-visible", "true");
    else root.removeAttribute("data-wallet-visible");
  }, []);
  useEffect(() => {
    const check = (): void => setWalletFlag(!!document.querySelector(WALLET_MODAL_SELECTORS));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      obs.disconnect();
      setWalletFlag(false);
    };
  }, [setWalletFlag]);

  /* Overlay controls (scroll lock + Escape) */
  const overlayOpen = activePanel !== "grid";
  useEffect(() => {
    if (overlayOpen) document.body.setAttribute("data-hub-open", "true");
    else document.body.removeAttribute("data-hub-open");
    return () => document.body.removeAttribute("data-hub-open");
  }, [overlayOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && overlayOpen) setActivePanel("grid");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayOpen]);

  // Focus trap while overlay open
  useEffect(() => {
    if (!overlayOpen) return;
    hubTitleRef.current?.focus?.();
    const trap = (e: KeyboardEvent): void => {
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
    const onResize = (): void => {
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

  /* Panel open helper */
  const requiresWallet: Panel[] = ["jal", "vault", "payments", "loans"];
  const openPanel = useCallback(
    (id: Panel): void => {
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
    "Support";

  const ART_MAP: Partial<Record<TileKey, { pos: string; zoom?: string }>> = {
    jal: { pos: "26% 38%", zoom: "240%" },
    shop: { pos: "73% 38%", zoom: "240%" },
    vault: { pos: "28% 78%", zoom: "240%" },
    payments: { pos: "46% 64%", zoom: "240%" },
    loans: { pos: "62% 42%", zoom: "240%" },
    support: { pos: "82% 28%", zoom: "240%" },
  };

  /* Live balances */
  const [sol, setSol] = useState<number | null>(null);
  const [jal, setJal] = useState<number | null>(null);
  const [balLoading, setBalLoading] = useState<boolean>(false);
  const [balErr, setBalErr] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<TokenRow[]>([]);

  const fetchPortfolio = useCallback(async (): Promise<void> => {
    if (!publicKey || !connected) {
      setSol(null);
      setJal(null);
      setPortfolio([]);
      return;
    }

    setBalErr(null);
    setBalLoading(true);

    const conn = safeConn();

    try {
      const lamports = await conn.getBalance(publicKey, "confirmed");
      setSol(lamports / LAMPORTS_PER_SOL);
    } catch (e) {
      console.error("[balances] SOL fetch failed:", e);
      setSol(null);
      setBalErr("rpc");
    }

    try {
      const [splRes, t22Res] = await Promise.all([
        conn.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_PROGRAM_ID },
          "confirmed"
        ),
        conn.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_2022_PROGRAM_ID },
          "confirmed"
        ),
      ]);

      const rows: TokenRow[] = [];
      const pushRows = (list: typeof splRes.value, program: TokenRow["program"]): void => {
        for (const { account } of list) {
          const info = (account.data as any).parsed?.info;
          const amount = Number(info?.tokenAmount?.amount ?? 0);
          const decimals = Number(info?.tokenAmount?.decimals ?? 0);
          const mint = String(info?.mint ?? "");
          if (!mint || !Number.isFinite(amount) || !Number.isFinite(decimals)) continue;
          const ui = decimals > 0 ? amount / 10 ** decimals : amount;
          rows.push({ mint, uiAmount: ui, decimals, program });
        }
      };

      pushRows(splRes.value, "spl-token");
      pushRows(t22Res.value, "token-2022");

      setPortfolio(rows);

      const jalMint = String(JAL_MINT);
      const jalTotal = rows.reduce((sum, r) => (r.mint === jalMint ? sum + r.uiAmount : sum), 0);
      setJal(jalTotal);
    } catch (e) {
      console.error("[balances] token accounts fetch failed:", e);
      setPortfolio([]);
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
      setPortfolio([]);
      return;
    }
    void fetchPortfolio();

    const poll = setInterval(fetchPortfolio, 15000);

    const wsConn = safeConn();
    const sub = wsConn.onAccountChange(
      publicKey,
      (ai) => setSol(ai.lamports / LAMPORTS_PER_SOL),
      "confirmed"
    );

    return () => {
      clearInterval(poll);
      wsConn.removeAccountChangeListener(sub).catch(() => {});
    };
  }, [connected, publicKey, fetchPortfolio]);

  useEffect(() => {
    const adapter = wallet?.adapter;
    if (!adapter) return;
    const onConnectBalances = () => { void fetchPortfolio(); };
    adapter.on("connect", onConnectBalances);
    return () => {
      try { adapter.off("connect", onConnectBalances); } catch {}
    };
  }, [wallet, fetchPortfolio]);

  /* Fiat state & polling (per-token prices, not totals) */
  const [fiat, setFiat] = useState<Fiat>(() => inferDefaultFiat());
  const [fxUSD, setFxUSD] = useState<Record<string, number> | null>(null);
  const [solUsd, setSolUsd] = useState<number | null>(null);
  const [jalUsd, setJalUsd] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => { const m = await getFxUSD(); if (alive) setFxUSD(m); })();
    const t = setInterval(async () => { const m = await getFxUSD(); if (alive && m) setFxUSD(m); }, 60_000 * 30);
    return () => { alive = false; clearInterval(t); };
  }, []);
  useEffect(() => {
    let alive = true;
    const run = async () => {
      const [pSol, pJal] = await Promise.all([getSolUsd(), getJalUsd()]);
      if (!alive) return;
      setSolUsd(pSol); setJalUsd(pJal);
    };
    run();
    const t = setInterval(run, 20_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const usdToFiat = (n: number | null): number | null =>
    n == null ? null : (fxUSD?.[fiat] ?? 1) * n;
  const perSOL = usdToFiat(solUsd);
  const perJAL = usdToFiat(jalUsd);

  const fmt = (n: number | null, digits = 4): string =>
    n == null ? "--" : n.toLocaleString(undefined, { maximumFractionDigits: digits });

  /* Render */
  const overlayActive = activePanel !== "grid";
  const shouldLoadGifs = !saveData && !reducedMotion;

  return (
    <main className={`landing-gradient ${merging ? "landing-merge" : ""}`} aria-live="polite">
      <div style={{ position: "relative" }}>
        {/* Hub / Grid + overlays */}
        <section
          id="hub-panel"
          className={`hub-panel hub-panel--fit ${overlayActive ? "hub-panel--overlay" : "hub-preview"}`}
          role={overlayActive ? "dialog" : "region"}
          aria-modal={overlayActive || undefined}
          aria-label="JAL/SOL Hub"
          ref={panelRef as any}
          style={{ position: "relative", zIndex: 20 }}   // ABOVE overlay
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
            {/* Dashboard (grid) */}
            {activePanel === "grid" && (
              <div className="hub-dashboard">
                <div className="bank-status">
                  {connected ? "WALLET CONNECTED" : "WALLET NOT CONNECTED"}
                  {connected && (
                    <button
                      className="chip"
                      type="button"
                      style={{ marginLeft: 10 }}
                      onClick={fetchPortfolio}
                      aria-label="Refresh balances"
                    >
                      ↻ Refresh
                    </button>
                  )}
                </div>

                {/* Collapsible fiat options + unit price chips */}
                <div style={{ display:"flex", justifyContent:"center", gap:10, flexWrap:"wrap", marginTop: 6 }}>
                  <FiatPicker value={fiat} onChange={setFiat} />
                  <span className="chip sm mono">SOL ≈ {fmtMoney(perSOL, fiat)}</span>
                  <span className="chip sm mono">JAL ≈ {fmtMoney(perJAL, fiat)}</span>
                </div>

                {/* Estimated swap fees (directional) */}
                <div style={{ display:"flex", justifyContent:"center", gap:10, flexWrap:"wrap", marginTop: 6 }}>
                  <SwapFeeChip label="SOL→JAL" solUsd={solUsd} fxUSD={fxUSD} fiat={fiat} />
                  <SwapFeeChip label="JAL→SOL" solUsd={solUsd} fxUSD={fxUSD} fiat={fiat} />
                </div>

                <div className="balance-row">
                  <div className={`balance-card ${balLoading ? "loading" : ""} ${balErr ? "error" : ""}`}>
                    <div className="balance-amount">{fmt(jal)} JAL</div>
                    <div className="balance-label">JAL • Price ≈ {fmtMoney(perJAL, fiat)}</div>
                  </div>
                  <div className={`balance-card ${balLoading ? "loading" : ""} ${balErr ? "error" : ""}`}>
                    <div className="balance-amount">{fmt(sol)} SOL</div>
                    <div className="balance-label">SOL • Price ≈ {fmtMoney(perSOL, fiat)}</div>
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

            {/* Tiles only in grid */}
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
              {/* Shop */}
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
                            <span className="muted" style={{ marginLeft: 8 }}>
                              {jalUsd ? `≈ ${fmtMoney((fxUSD?.[fiat] ?? 1) * (jalUsd * p.priceJal), fiat)}` : ""}
                            </span>
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

              {/* JAL */}
              {activePanel === "jal" && (
                <div className="in-hub">
                  <div className="chip-row" style={{ marginBottom: 8 }}>
                    <button
                      className="button gold"
                      onClick={() => window.open(RAYDIUM_PAIR_URL, "_blank", "noopener,noreferrer")}
                    >
                      Open Swap on Raydium
                    </button>
                    <a className="button" href="https://jup.ag" target="_blank" rel="noreferrer">
                      Open Jupiter
                    </a>
                  </div>

                  <Suspense fallback={<div className="card">Loading JAL…</div>}>
                    <Jal inHub />
                  </Suspense>
                </div>
              )}

              {/* Vault */}
              {activePanel === "vault" &&
                (connected ? (
                  <div className="card">
                    <h3>Your Wallet</h3>
                    <p>
                      JAL: <strong>{fmt(jal)}</strong>
                      {"  "}•{"  "}
                      SOL: <strong>{fmt(sol)}</strong>
                    </p>
                    <div className="chip-row" style={{ marginTop: 4 }}>
                      <span className="chip sm mono">JAL price ≈ {fmtMoney(perJAL, fiat)}</span>
                      <span className="chip sm mono">SOL price ≈ {fmtMoney(perSOL, fiat)}</span>
                    </div>
                    {/* Optional: show fee chips in Vault as well */}
                    <div className="chip-row" style={{ marginTop: 6 }}>
                      <SwapFeeChip label="SOL→JAL" solUsd={solUsd} fxUSD={fxUSD} fiat={fiat} />
                      <SwapFeeChip label="JAL→SOL" solUsd={solUsd} fxUSD={fxUSD} fiat={fiat} />
                    </div>

                    {portfolio.length ? (
                      <div style={{ marginTop: 10 }}>
                        <div className="product-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                          {portfolio.map((t) => (
                            <article key={t.mint} className="product-card">
                              <div className="product-body">
                                <h4 className="product-title">{`${t.mint.slice(0,4)}…${t.mint.slice(-4)}`}</h4>
                                <div className="product-blurb mono-sm">Mint: {t.mint}</div>
                                <div className="product-price">
                                  <span className="price-jal">
                                    {t.uiAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                  </span>
                                  <span className="muted">• {t.decimals} dec</span>
                                </div>
                                <div className="muted" style={{ fontSize: ".85rem" }}>{t.program}</div>
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

              {/* Coming-soon panels */}
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

        {/* Backdrop for overlay panels — render AFTER panel; keep z-index lower */}
        {overlayActive && (
          <button
            type="button"
            className="hub-overlay"
            aria-label="Close panel"
            onClick={() => setActivePanel("grid")}
            ref={firstFocusRef}
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
          />
        )}
      </div>
    </main>
  );
}
