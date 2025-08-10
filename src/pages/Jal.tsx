// src/pages/Jal.tsx
import { useState } from "react";

export default function Jal() {
  const [swapOpen, setSwapOpen] = useState(false);

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
      {/* Transparent panel with glowing white full‑width borders */}
      <section
        className="jal-panel"
        style={{
          width: "min(960px, 96vw)",
          background: "rgba(0,0,0,0.35)",
          borderTop: "2px solid rgba(255,255,255,0.85)",
          borderBottom: "2px solid rgba(255,255,255,0.85)",
          borderLeft: "0",
          borderRight: "0",
          padding: "32px 24px",
          boxShadow: "0 0 24px rgba(255,255,255,0.35)",
          backdropFilter: "blur(6px)",
        }}
      >
        <h1 style={{ margin: 0, color: "#fff", textAlign: "center" }}>JAL</h1>
        <p style={{ marginTop: 12, color: "rgba(255,255,255,0.8)", textAlign: "center" }}>
          About JAL — story, mission, and how SOL ⇄ JAL works.
        </p>

        <div style={{ display: "grid", gap: 12, marginTop: 20, justifyContent: "center" }}>
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

      {/* Swap overlay shell (placeholder) */}
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
                background: "rgba(0,0,0,0.75)",
                border: "2px solid rgba(255,255,255,0.9)",
                boxShadow: "0 0 24px rgba(255,255,255,0.35)",
                borderRadius: 16,
                padding: 20,
                pointerEvents: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, color: "#fff" }}>SOL ⇄ JAL Swap</h2>
                <button
                  onClick={() => setSwapOpen(false)}
                  aria-label="Close"
                  style={{
                    border: "1px solid #fff",
                    background: "transparent",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
              <p style={{ marginTop: 10, color: "rgba(255,255,255,0.85)" }}>
                Placeholder swap UI. We’ll wire this to Raydium/Jupiter next.
              </p>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
