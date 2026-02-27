// src/pages/Landing.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type LandingMode = "entry" | "nav";
type LandingProps = { mode: LandingMode };

type NavTo = "/app/home" | "/app/jal-sol" | "/app/about" | "/app/shop";

function NavOverlay({
  onSelect,
  onClose,
}: {
  onSelect: (to: NavTo) => void;
  onClose: () => void;
}) {
  return (
    <>
      <button
        className="nav-overlay-backdrop"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <section
        className="nav-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="nav-overlay-top">
          <button className="nav-back" type="button" onClick={onClose}>
            Back
          </button>
        </div>

        <div className="nav-overlay-body">
          <button className="nav-pill" onClick={() => onSelect("/app/home")}>
            HOME
          </button>

          {/* NEW: JAL/SOL */}
          <button className="nav-pill" onClick={() => onSelect("/app/jal-sol")}>
            JAL/SOL
          </button>

          <button className="nav-pill" onClick={() => onSelect("/app/about")}>
            ABOUT JAL
          </button>

          <button className="nav-pill" onClick={() => onSelect("/app/shop")}>
            SHOP
          </button>
        </div>
      </section>
    </>
  );
}

export default function Landing({ mode }: LandingProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // header logo should open NAV when inside /app/*
  useEffect(() => {
    const onOpen = () => {
      if (!location.pathname.startsWith("/app/")) return;
      navigate("/app/nav", { replace: true });
    };

    window.addEventListener("JALSOL:OPEN_NAV" as any, onOpen);
    return () => window.removeEventListener("JALSOL:OPEN_NAV" as any, onOpen);
  }, [navigate, location.pathname]);

  // lock scroll while nav overlay is present
  useEffect(() => {
    const on = mode === "nav";
    if (on) document.body.setAttribute("data-nav-open", "true");
    else document.body.removeAttribute("data-nav-open");
    return () => document.body.removeAttribute("data-nav-open");
  }, [mode]);

  // ENTER: show 5s loading, then open /app/nav
  const enter = () => {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      navigate("/app/nav", { replace: true });
    }, 5000);
  };

  // ENTRY screen (no header here because AppShell isn't mounted)
  if (mode === "entry") {
    return (
      <main className={`landing-blank ${loading ? "is-fading" : ""}`} aria-label="JAL/SOL">
        {!loading && (
          <button className="center-logo-btn" onClick={enter} aria-label="Enter jalsol.com">
            <img className="center-logo" src="/JALSOL1.gif" alt="JAL/SOL" />
            <div className="center-logo-hint">ENTER</div>
          </button>
        )}

        {loading && (
          <div className="loading-screen" role="status" aria-label="Loading" aria-live="polite">
            <img className="loading-logo" src="/JALSOL1.gif" alt="" />
          </div>
        )}
      </main>
    );
  }

  // NAV overlay screen (inside /app/* with header visible)
  return (
    <main className="landing-blank" aria-label="JAL/SOL">
      <NavOverlay
        onSelect={(to) => navigate(to, { replace: true })}
        onClose={() => navigate("/app/home", { replace: true })}
      />
    </main>
  );
}