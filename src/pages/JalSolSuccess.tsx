import { useEffect, useState } from "react";
import {
  getLevel1AccessBySessionId,
  persistLevel1Access,
} from "../lib/access";

export default function JalSolSuccess() {
  const [message, setMessage] = useState("Verifying payment...");

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");

      if (!sessionId) {
        setMessage("Missing session ID.");
        return;
      }

      const result = await getLevel1AccessBySessionId(sessionId);

      if (!result.ok) {
        setMessage("Payment found, but access is not ready yet.");
        return;
      }

      persistLevel1Access(sessionId, result.email);
      setMessage("Access granted. Entering Level 1...");

      window.setTimeout(() => {
        window.location.href = "/app/jal-sol/level-1";
      }, 900);
    };

    run();
  }, []);

  return (
    <main className="home-shell jal-shell" aria-label="JAL/SOL Success">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <div className="jal-hero">
            <div className="jal-kicker">JAL / SOL</div>
            <h1 className="home-title jal-title">Payment Received</h1>
            <p className="home-lead jal-lead">{message}</p>

            <div className="jal-bay-actions">
              <a className="button ghost" href="/app/jal-sol">
                Back to JAL/SOL
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}