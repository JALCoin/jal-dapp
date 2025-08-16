// src/pages/Jal.tsx
import { useEffect, useMemo, useState } from "react";

const JAL_MINT =
  "9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v";
const RAYDIUM_URL =
  "https://raydium.io/swap/?inputMint=sol&outputMint=9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v";

export default function Jal() {
  const [swapOpen, setSwapOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // close on ESC
  useEffect(() => {
    if (!swapOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSwapOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [swapOpen]);

  const shortMint = useMemo(
    () =>
      JAL_MINT.length > 12
        ? `${JAL_MINT.slice(0, 6)}...${JAL_MINT.slice(-6)}`
        : JAL_MINT,
    []
  );

  const copyMint = async () => {
    try {
      await navigator.clipboard.writeText(JAL_MINT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {}
  };

  return (
    <main
      className="jal-page"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "transparent",
        position: "relative",
        padding: "24px",
      }}
    >
      {/* Transparent panel */}
      <section
        className="jal-panel"
        style={{
          width: "min(960px, 96vw)",
          background: "rgba(0,0,0,0.35)",
          borderTop: "2px solid rgba(255,255,255,0.85)",
          borderBottom: "2px solid rgba(255,255,255,0.85)",
          padding: "32px 24px",
          boxShadow:
            "0 0 24px rgba(255,255,255,0.35), 0 0 2px rgba(255,255,255,0.8) inset",
          backdropFilter: "blur(6px)",
        }}
      >
        <h1 style={{ margin: 0, color: "#fff", textAlign: "center" }}>JAL</h1>
        <p
          style={{
            marginTop: 12,
            color: "rgba(255,255,255,0.8)",
            textAlign: "center",
          }}
        >
          About JAL — story, mission, and how SOL ⇄ JAL works.
        </p>

        {/* Mint actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginTop: 16,
            flexWrap: "wrap",
          }}
        >
          <code
            style={{
              background: "#000",
              color: "#fff",
              padding: "6px 10px",
              borderRadius: 8,
              fontSize: "0.9rem",
              border: "1px solid rgba(255,255,255,.7)",
            }}
            title={JAL_MINT}
          >
            {shortMint}
          </code>
          <button
            onClick={copyMint}
            style={{
              border: "1px solid #fff",
              background: "transparent",
              color: "#fff",
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            {copied ? "Copied!" : "Copy Mint"}
          </button>
          <a
            href={`https://explorer.solana.com/address/${JAL_MINT}`}
            target="_blank"
            rel="noreferrer"
            style={{
              border: "1px solid #fff",
              background: "transparent",
              color: "#fff",
              borderRadius: 8,
              padding: "6px 12px",
              textDecoration: "none",
            }}
          >
            View on Explorer
          </a>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            marginTop: 20,
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => setSwapOpen(true)}
            style={{
              border: "2px solid #fff",
              background: "transparent",
              color: "#fff",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "0.85rem 1.25rem",
              borderRadius: 12,
              cursor: "pointer",
              boxShadow:
                "0 0 18px rgba(255,255,255,.25), 0 0 1px rgba(255,255,255,.8) inset",
            }}
          >
            Open SOL ⇄ JAL Swap
          </button>
        </div>
      </section>

      {/* Stylized swap overlay with Raydium */}
      {swapOpen && (
        <>
          <div
            onClick={() => setSwapOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background:
                "radial-gradient(1200px 600px at 50% 30%, rgba(255,255,255,.08), transparent 60%) , rgba(0,0,0,0.55)",
              backdropFilter: "blur(2px)",
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              display: "grid",
              placeItems: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: "min(560px, 94vw)",
                background: "rgba(0,0,0,0.78)",
                border: "1.6px solid rgba(255,255,255,0.9)",
                borderRadius: 18,
                padding: 12,
                pointerEvents: "auto",
                transform: "translateY(4px) scale(0.98)",
                opacity: 0,
                animation:
                  "modalIn .28s ease-out forwards, glowPulse 2.4s ease-in-out infinite",
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,.18) inset, 0 14px 38px rgba(0,0,0,.55), 0 0 24px rgba(255,255,255,.28)",
              }}
            >
              {/* small inline keyframes */}
              <style>
                {`
                  @keyframes modalIn {
                    to { transform: translateY(0) scale(1); opacity: 1; }
                  }
                  @keyframes glowPulse {
                    0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,.18) inset, 0 14px 38px rgba(0,0,0,.55), 0 0 18px rgba(255,255,255,.22); }
                    50% { box-shadow: 0 0 0 1px rgba(255,255,255,.22) inset, 0 16px 42px rgba(0,0,0,.6), 0 0 28px rgba(255,255,255,.36); }
                  }
                `}
              </style>

              {/* header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  justifyContent: "space-between",
                  padding: "4px 6px 10px",
                }}
              >
                <div style={{ width: 36 }} />
                <div
                  style={{
                    textAlign: "center",
                    color: "#fff",
                    letterSpacing: ".06em",
                    fontWeight: 700,
                  }}
                >
                  <div style={{ opacity: 0.92 }}>SOL ⇄ JAL Swap</div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.7,
                      marginTop: 2,
                    }}
                  >
                    Powered by Raydium
                  </div>
                </div>
                <button
                  onClick={() => setSwapOpen(false)}
                  aria-label="Close"
                  style={{
                    border: "1px solid #fff",
                    background: "transparent",
                    color: "#fff",
                    borderRadius: 10,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* iframe */}
              <iframe
                title="Raydium Swap"
                src={RAYDIUM_URL}
                style={{
                  width: "100%",
                  height: "600px",
                  border: 0,
                  borderRadius: 14,
                }}
              />

              {/* footer link */}
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <a
                  href={RAYDIUM_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#fff",
                    fontSize: "0.92rem",
                    textDecoration: "underline",
                    opacity: 0.95,
                  }}
                >
                  Open on Raydium
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
