// src/pages/Landing.tsx
import { useEffect, useLayoutEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { usePageMeta } from "../hooks/usePageMeta";
import type { ThemeMode } from "../hooks/useTheme";

type LandingMode = "entry" | "nav";
type LandingProps = {
  mode: LandingMode;
  theme: ThemeMode;
  onToggleTheme: () => void;
};

type NavTo =
  | "/app/home"
  | "/app/compliance"
  | "/app/engine"
  | "/app/about"
  | "/app/legal"
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
            onClick={() => onSelect("/app/about")}
            disabled={disabled}
          >
            ABOUT
          </button>

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
            onClick={() => onSelect("/app/engine")}
            disabled={disabled}
          >
            $JAL~ENGINE
          </button>

          <button
            type="button"
            className="nav-pill"
            onClick={() => onSelect("/app/shop")}
            disabled={disabled}
          >
            SHOP
          </button>

          <button
            type="button"
            className="nav-pill"
            onClick={() => onSelect("/app/compliance")}
            disabled={disabled}
          >
            SITE SETTINGS
          </button>

          <button
            type="button"
            className="nav-pill"
            onClick={() => onSelect("/app/legal")}
            disabled={disabled}
          >
            LEGAL+BUSINESS
          </button>
        </div>
      </section>
    </>
  );
}

export default function Landing({ mode, theme, onToggleTheme }: LandingProps) {
  usePageMeta(
    mode === "nav" ? "Site Navigation" : "Jeremy Aaron Lugg",
    mode === "nav"
      ? "Navigate the JALSOL founder site across home, about, legal and business details, the store, and current public-site settings."
      : "Enter the founder-led public business domain of Jeremy Aaron Lugg and explore JALSOL across identity, legal clarity, and physical releases."
  );

  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const brandLogoSrc = theme === "light" ? "/JALSOLLIGHT.gif" : "/JALSOL1.gif";
  const loadingLabel = mode === "nav" ? "Opening section" : "Opening public site";

  useEffect(() => {
    const onOpen = () => {
      if (!location.pathname.startsWith("/app/")) return;
      navigate("/app/nav");
    };

    window.addEventListener("JALSOL:OPEN_NAV", onOpen as EventListener);
    return () => window.removeEventListener("JALSOL:OPEN_NAV", onOpen as EventListener);
  }, [navigate, location.pathname]);

  useEffect(() => {
    const on = mode === "nav";
    if (on) document.body.setAttribute("data-nav-open", "true");
    else document.body.removeAttribute("data-nav-open");

    return () => document.body.removeAttribute("data-nav-open");
  }, [mode]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;

    const syncViewportHeight = () => {
      const visibleHeight = viewport?.height ?? window.innerHeight;
      root.style.setProperty("--landing-viewport-height", `${visibleHeight}px`);
    };

    syncViewportHeight();

    viewport?.addEventListener("resize", syncViewportHeight);
    viewport?.addEventListener("scroll", syncViewportHeight);
    window.addEventListener("resize", syncViewportHeight);
    window.addEventListener("orientationchange", syncViewportHeight);

    return () => {
      viewport?.removeEventListener("resize", syncViewportHeight);
      viewport?.removeEventListener("scroll", syncViewportHeight);
      window.removeEventListener("resize", syncViewportHeight);
      window.removeEventListener("orientationchange", syncViewportHeight);
      root.style.removeProperty("--landing-viewport-height");
    };
  }, []);

  const showLoadingThenNavigate = (to: NavTo | "/app/nav") => {
    if (loading) return;

    setLoading(true);

    window.setTimeout(() => {
      setLoading(false);
      navigate(to);
    }, 900);
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
        aria-label="Jeremy Aaron Lugg"
      >
        {!loading && (
          <>
            <div className="landing-tools">
              <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
            </div>

            <button
              className="center-logo-btn"
              onClick={enter}
              aria-label="Enter Jeremy Aaron Lugg site"
            >
              <img className="center-logo" src={brandLogoSrc} alt="Jeremy Aaron Lugg" />
              <div className="center-logo-hint">ENTER SITE</div>
            </button>
          </>
        )}

        {loading && (
          <div
            className="loading-screen"
            role="status"
            aria-label="Loading"
            aria-live="polite"
          >
            <div className="loading-brand-lockup">
              <div className="loading-logo-frame">
                <img className="loading-logo" src={brandLogoSrc} alt="" />
              </div>
              <div className="loading-caption">{loadingLabel}</div>
              <div className="loading-progress" aria-hidden="true">
                <span className="loading-progress-bar" />
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main
      className={`landing-blank is-nav-route ${loading ? "is-fading" : ""}`}
      aria-label="Jeremy Aaron Lugg"
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
          <div className="loading-brand-lockup">
            <div className="loading-logo-frame">
              <img className="loading-logo" src={brandLogoSrc} alt="" />
            </div>
            <div className="loading-caption">{loadingLabel}</div>
            <div className="loading-progress" aria-hidden="true">
              <span className="loading-progress-bar" />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
