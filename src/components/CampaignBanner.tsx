import {
  useEffect,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from "react";
import DonateButton from "./DonateButton";

type CampaignSlide = {
  id: string;
  src: string;
  alt: string;
  kicker: string;
  title: string;
  copy: string;
  focal: string;
  mobileFocal: string;
};

type CampaignBannerProps = {
  className?: string;
  primaryAction?: ReactNode;
  showDonate?: boolean;
  variant?: "hero" | "landing" | "compact" | "strip";
};

const SLIDE_INTERVAL_MS = 5800;

const CAMPAIGN_SLIDES: CampaignSlide[] = [
  {
    id: "royal-night",
    src: "/campaign/jalsol-royal-night.jpg",
    alt: "Dark royal JALSOL promo poster with a crowned central figure, castle scenes, banners, and gold lettering.",
    kicker: "JALSOL CAMPAIGN",
    title: "Enter the JALSOL story.",
    copy: "A founder-led build across brand, software, trading systems, and real-world projects.",
    focal: "50% 42%",
    mobileFocal: "50% 36%",
  },
  {
    id: "ivory-palace",
    src: "/campaign/jalsol-ivory-palace.jpg",
    alt: "Ivory palace JALSOL promo poster with a crowned central figure, marble architecture, luxury scenes, and gold lettering.",
    kicker: "SUPPORT THE BUILD",
    title: "Follow the vision.",
    copy: "See the public story, planned releases, and private systems taking shape behind the scenes.",
    focal: "50% 43%",
    mobileFocal: "50% 37%",
  },
  {
    id: "execution",
    src: "/campaign/jalsol-execution.png",
    alt: "JALSOL execution collage with the center character in front of city, sport, and trading scenes.",
    kicker: "FOUNDER SYSTEMS",
    title: "Built in public.",
    copy: "From tradesman experience to digital infrastructure, JALSOL shows the work as it develops.",
    focal: "50% 38%",
    mobileFocal: "50% 34%",
  },
  {
    id: "luxury",
    src: "/campaign/jalsol-luxury.png",
    alt: "JALSOL luxury collage with a suited center character, city skyline, aircraft, and market visuals.",
    kicker: "PRODUCT DIRECTION",
    title: "Future releases start here.",
    copy: "Explore planned physical products, register interest, and follow the brand as it grows.",
    focal: "50% 42%",
    mobileFocal: "50% 36%",
  },
  {
    id: "real-world",
    src: "/campaign/jalsol-real-world.png",
    alt: "JALSOL real-world operations collage with the center character surrounded by work, trade, and Australian scenes.",
    kicker: "REAL WORLD OPS",
    title: "Software meets the ground.",
    copy: "Public pages explain the direction while private engine and books data stay protected.",
    focal: "50% 36%",
    mobileFocal: "50% 31%",
  },
];

export default function CampaignBanner({
  className = "",
  primaryAction,
  showDonate = true,
  variant = "hero",
}: CampaignBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const activeSlide = CAMPAIGN_SLIDES[activeIndex];
  const classes = ["campaign-banner", `campaign-banner--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => setReducedMotion(media.matches);

    syncReducedMotion();
    media.addEventListener("change", syncReducedMotion);

    return () => media.removeEventListener("change", syncReducedMotion);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % CAMPAIGN_SLIDES.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [paused, reducedMotion]);

  function goToSlide(index: number) {
    setActiveIndex(index);
  }

  function showPreviousSlide() {
    setActiveIndex((current) => (current - 1 + CAMPAIGN_SLIDES.length) % CAMPAIGN_SLIDES.length);
  }

  function showNextSlide() {
    setActiveIndex((current) => (current + 1) % CAMPAIGN_SLIDES.length);
  }

  function handleBlur(event: FocusEvent<HTMLElement>) {
    const nextTarget = event.relatedTarget;

    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      setPaused(false);
    }
  }

  return (
    <section
      className={classes}
      aria-label="JALSOL future campaign"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={handleBlur}
    >
      <div
        className="campaign-banner-track"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        aria-hidden="true"
      >
        {CAMPAIGN_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className="campaign-banner-slide"
            style={
              {
                "--campaign-focal": slide.focal,
                "--campaign-mobile-focal": slide.mobileFocal,
              } as CSSProperties
            }
          >
            <img src={slide.src} alt="" loading={index === 0 ? "eager" : "lazy"} />
          </div>
        ))}
      </div>

      <div className="campaign-banner-content">
        <div className="campaign-banner-kicker">{activeSlide.kicker}</div>
        <h2 className="campaign-banner-title">{activeSlide.title}</h2>
        <p className="campaign-banner-copy">{activeSlide.copy}</p>

        <div className="campaign-banner-actions">
          {primaryAction}
          {showDonate ? (
            <DonateButton className="campaign-banner-donate" label="DONATE" />
          ) : null}
        </div>
      </div>

      <div className="campaign-banner-controls" aria-label="Campaign slide controls">
        <button type="button" className="campaign-banner-control" onClick={showPreviousSlide}>
          <span aria-hidden="true">&lt;</span>
          <span className="sr-only">Previous campaign image</span>
        </button>
        <button type="button" className="campaign-banner-control" onClick={showNextSlide}>
          <span aria-hidden="true">&gt;</span>
          <span className="sr-only">Next campaign image</span>
        </button>
      </div>

      <div className="campaign-banner-dots" aria-label="Campaign images">
        {CAMPAIGN_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={`campaign-banner-dot ${activeIndex === index ? "is-active" : ""}`}
            aria-label={`Show ${slide.kicker} campaign image`}
            aria-current={activeIndex === index ? "true" : undefined}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>

      <span className="sr-only" aria-live="polite">
        Slide {activeIndex + 1}: {activeSlide.alt}
      </span>
    </section>
  );
}
