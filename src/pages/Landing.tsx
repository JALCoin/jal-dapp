// src/pages/Landing.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type LandingMode = "entry" | "nav";
type LandingProps = { mode: LandingMode };

type NavTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/engine"
  | "/app/about"
  | "/app/shop";

function NavOverlay({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (to: NavTo) => void;
  onClose: () => void;
  disabled: boolean;
}) {
  return (
    <>
      <button
        className="nav-overlay-backdrop"
        aria-label="Close navigation"
        onClick={onClose}
        disabled={disabled}
      />

      <section
        className="nav-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="nav-overlay-top">
          <button
            className="nav-back"
            type="button"
            onClick={onClose}
            disabled={disabled}
          >
            Back
          </button>
        </div>

        <div className="nav-overlay-body">
          <button
            type="button"
            className="nav-pill"
            onClick={() => onSelect("/app/home")}
            disabled={disabled}
          >
            HOME
          </button>

          <button
            type="button"
            className="nav-pill"
            onClick={() => onSelect("/app/jal-sol")}
            disabled={disabled}
          >
            JAL/SOL
          </button>

          <button
            type="button"
            className="nav-pill"
            onClick={() => onSelect("/app/engine")}
            disabled={disabled}
          >
            $JAL~Engine
          </button>

          <button
            type="button"
            className="nav-pill"
            onClick={() => onSelect("/app/about")}
            disabled={disabled}
          >
            ABOUT JAL
          </button>

          <button
            type="button"
            className="nav-pill"
            onClick={() => onSelect("/app/shop")}
            disabled={disabled}
          >
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

  useEffect(() => {
    const onOpen = () => {
      if (!location.pathname.startsWith("/app/")) return;
      navigate("/app/nav");
    };

    window.addEventListener("JALSOL:OPEN_NAV" as any, onOpen);
    return () => window.removeEventListener("JALSOL:OPEN_NAV" as any, onOpen);
  }, [navigate, location.pathname]);

  useEffect(() => {
    const on = mode === "nav";
    if (on) document.body.setAttribute("data-nav-open", "true");
    else document.body.removeAttribute("data-nav-open");

    return () => document.body.removeAttribute("data-nav-open");
  }, [mode]);

  const showLoadingThenNavigate = (to: NavTo | "/app/nav") => {
    if (loading) return;

    setLoading(true);

    window.setTimeout(() => {
      setLoading(false);
      navigate(to);
    }, 5000);
  };

  const enter = () => {
    showLoadingThenNavigate("/app/nav");
  };

  const handleNavSelect = (to: NavTo) => {
    showLoadingThenNavigate(to);
  };

  if (mode === "entry") {
    return (
      <main
        className={`landing-blank ${loading ? "is-fading" : ""}`}
        aria-label="JAL/SOL"
      >
        {!loading && (
          <button
            className="center-logo-btn"
            onClick={enter}
            aria-label="Enter jalsol.com"
          >
            <img className="center-logo" src="/JALSOL1.gif" alt="JAL/SOL" />
            <div className="center-logo-hint">ENTER</div>
          </button>
        )}

        {loading && (
          <div
            className="loading-screen"
            role="status"
            aria-label="Loading"
            aria-live="polite"
          >
            <img className="loading-logo" src="/JALSOL1.gif" alt="" />
          </div>
        )}
      </main>
    );
  }

  return (
    <main
      className={`landing-blank ${loading ? "is-fading" : ""}`}
      aria-label="JAL/SOL"
    >
      {!loading && (
        <NavOverlay
          onSelect={handleNavSelect}
          onClose={() => navigate("/app/home")}
          disabled={loading}
        />
      )}

      {loading && (
        <div
          className="loading-screen"
          role="status"
          aria-label="Loading"
          aria-live="polite"
        >
          <img className="loading-logo" src="/JALSOL1.gif" alt="" />
        </div>
      )}
    </main>
  );
}