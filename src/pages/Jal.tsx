// src/pages/Jal.tsx
import { useState, useMemo } from "react";

const JAL_MINT = "9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v"; 
const RAYDIUM_URL = "https://raydium.io/swap/?inputMint=sol&outputMint=9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v";

export default function Jal() {
  const [swapOpen, setSwapOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
          boxShadow: "0 0 24px rgba(255,255,255,0.35)",
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
            }}
          >
            Open SOL ⇄ JAL Swap
          </button>
        </div>
      </section>

      {/* Swap overlay with Raydium */}
      {swapOpen && (
        <>
          <div
            onClick={() => setSwapOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(3px)",
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
                width: "min(520px, 94vw)",
                background: "rgba(0,0,0,0.9)",
                border: "2px solid rgba(255,255,255,0.9)",
                boxShadow: "0 0 24px rgba(255,255,255,0.35)",
                borderRadius: 16,
                padding: 12,
                pointerEvents: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <h2 style={{ margin: 0, color: "#fff", fontSize: "1.1rem" }}>
                  SOL ⇄ JAL Swap (Raydium)
                </h2>
                <button
                  onClick={() => setSwapOpen(false)}
                  aria-label="Close"
                  style={{
                    border: "1px solid #fff",
                    background: "transparent",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
              <iframe
                title="Raydium Swap"
                src={RAYDIUM_URL}
                style={{
                  width: "100%",
                  height: "600px",
                  border: 0,
                  borderRadius: 12,
                }}
              />
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <a
                  href={RAYDIUM_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#fff",
                    fontSize: "0.9rem",
                    textDecoration: "underline",
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
