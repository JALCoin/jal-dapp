import { useState } from "react";

export default function TrackPage() {
  const [tracking, setTracking] = useState("");

  function handleTrack() {
    if (!tracking) return;
    window.open(`https://auspost.com.au/mypost/track/search?q=${tracking}`, "_blank");
  }

  return (
    <main className="home-shell">
      <div className="home-wrap">

        <h1>Track Order</h1>

        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Tracking number"
        />

        <button onClick={handleTrack}>
          Track Shipment
        </button>

      </div>
    </main>
  );
}