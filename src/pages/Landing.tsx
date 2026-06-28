// src/pages/Landing.tsx
import { useEffect, useLayoutEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CampaignBanner from "../components/CampaignBanner";
import DonateButton from "../components/DonateButton";
import { JalCoinActions } from "../components/JalCoinPanel";
import ThemeToggle from "../components/ThemeToggle";
import { usePageMeta } from "../hooks/usePageMeta";
import type { ThemeMode } from "../hooks/useTheme";
import {
  LEGAL_ABN,
  LEGAL_CONTACT_EMAIL,
  LEGAL_CONTACT_MAILTO,
  LEGAL_OPERATOR_NAME,
} from "../lib/legal";

type LandingMode = "entry" | "nav";
type LandingProps = {
  mode: LandingMode;
  theme: ThemeMode;
  onToggleTheme: () => void;
};

type NavTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/compliance"
  | "/app/engine"
  | "/app/about"
  | "/app/legal"
  | "/app/shop";

type NavItem = {
  id: string;
  label: string;
  to: NavTo;
  contextTitle: string;
  contextBody: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "about",
    label: "ABOUT",
    to: "/app/about",
    contextTitle: "Understand JAL",
    contextBody: "Jeremy Aaron Lugg's story, background, and direction.",
  },
  {
    id: "home",
    label: "HOME",
    to: "/app/home",
    contextTitle: "Follow The Build",
    contextBody: "Current public status, project path, and orientation.",
  },
  {
    id: "engine",
    label: "$JAL~ENGINE",
    to: "/app/engine",
    contextTitle: "See The Engine",
    contextBody: "Public systems explanation. Operator dashboard remains private.",
  },
  {
    id: "jalsol",
    label: "JAL/SOL",
    to: "/app/jal-sol",
    contextTitle: "JAL Coin",
    contextBody: "Official links, simple path, build signals, and support address.",
  },
  {
    id: "shop",
    label: "SHOP",
    to: "/app/shop",
    contextTitle: "Support Growth",
    contextBody: "Planned physical releases, interest registration, and enquiries.",
  },
  {
    id: "settings",
    label: "SITE SETTINGS",
    to: "/app/compliance",
    contextTitle: "Current Boundaries",
    contextBody: "What is public, staged, or under review.",
  },
  {
    id: "legal",
    label: "LEGAL+BUSINESS",
    to: "/app/legal",
    contextTitle: "Trust Layer",
    contextBody: "ABN, terms, privacy, disclaimer, and public business details.",
  },
];

function NavOverlay({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (to: NavTo) => void;
  onClose: () => void;
  disabled: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSelect = (item: NavItem) => {
    if (disabled) return;

    const tapToExpand =
      typeof window !== "undefined" &&
      (window.matchMedia("(max-width: 640px)").matches ||
        window.matchMedia("(hover: none), (pointer: coarse)").matches);

    if (tapToExpand && expandedId !== item.id) {
      setExpandedId(item.id);
      return;
    }

    onSelect(item.to);
  };

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
          <div className="nav-intro" aria-label="JALSOL orientation">
            <div className="nav-intro-title">WELCOME TO JALSOL</div>
            <p className="nav-intro-copy">
              Follow Jeremy Aaron Lugg&apos;s journey from tradesman -&gt; systems builder -&gt; JAL
              Engine -&gt; JAL Coin -&gt; releases -&gt; real-world projects.
            </p>
          </div>

          <CampaignBanner
            className="nav-campaign-banner"
            variant="compact"
            primaryAction={<JalCoinActions compact />}
          />

          {NAV_ITEMS.map((item) => {
            const contextId = `nav-context-${item.id}`;
            const expanded = expandedId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`nav-pill ${expanded ? "is-expanded" : ""}`}
                data-nav-id={item.id}
                onClick={() => handleSelect(item)}
                disabled={disabled}
                aria-describedby={contextId}
                aria-expanded={expanded}
              >
                <span className="nav-pill-label">{item.label}</span>
                <span id={contextId} className="nav-pill-context">
                  <strong>{item.contextTitle}</strong> - {item.contextBody}
                </span>
              </button>
            );
          })}
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
            <DonateButton className="donate-button--landing" />
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

            <div className="landing-orientation" aria-label="Site orientation">
              <p>Founder-led systems, releases and infrastructure in development.</p>
              <p>Follow the build -&gt; Understand JAL -&gt; Join the process</p>
            </div>

            <CampaignBanner
              className="landing-promo-banner"
              variant="strip"
              showDonate={false}
            />

            <address className="landing-public-id" aria-label="Public business details">
              <span>{LEGAL_OPERATOR_NAME}</span>
              <a href={LEGAL_CONTACT_MAILTO}>{LEGAL_CONTACT_EMAIL}</a>
              <span>ABN {LEGAL_ABN}</span>
            </address>
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
