import { useState } from "react";

export default function TrackPage() {
  const [tracking, setTracking] = useState("");

  function handleTrack() {
    const value = tracking.trim();
    if (!value) return;

    window.open(
      `https://auspost.com.au/mypost/track/search?q=${encodeURIComponent(value)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="home-shell shop-shell" aria-label="Track Order">
      <div className="home-wrap shop-wrap">
        <section className="card machine-surface panel-frame shop-panel track-panel">
          <div className="shop-header track-header">
            <div className="shop-header-main">
              <p className="shop-eyebrow">JALSOL Storefront</p>
              <h1 className="home-title shop-title">Track Order</h1>

              <p className="home-lead shop-lead">
                Enter your Australia Post tracking number to continue into the official shipment
                tracker.
              </p>
            </div>

            <div className="shop-header-links">
              <a
                className="chip"
                href="https://auspost.com.au/mypost/track/search"
                target="_blank"
                rel="noreferrer"
              >
                Australia Post
              </a>
            </div>
          </div>

          <section className="shop-section track-section" aria-label="Tracking form">
            <div className="shop-section-head">
              <div>
                <p className="shop-section-kicker">Shipment Access</p>
                <h2 className="shop-section-title">Tracking Console</h2>
                <p className="shop-section-copy">
                  Use the shipment reference supplied after purchase or dispatch confirmation.
                </p>
              </div>
            </div>

            <div className="track-console" role="search" aria-label="Track shipment">
              <label className="track-label" htmlFor="tracking-number">
                Tracking Number
              </label>

              <input
                id="tracking-number"
                className="track-input"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTrack();
                }}
                placeholder="Enter Australia Post tracking number"
                autoComplete="off"
                inputMode="text"
              />

              <div className="track-actions">
                <button type="button" className="shop-card-primary track-button" onClick={handleTrack}>
                  Track Shipment
                </button>
              </div>

              <p className="track-help">
                You will be redirected to Australia Post tracking in a new tab.
              </p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}