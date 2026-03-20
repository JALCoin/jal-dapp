import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";

export default function Footer() {
  const location = useLocation();
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);

  const isAppRoute = location.pathname.startsWith("/app");

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  function beginRoute(to: string) {
    if (loading || location.pathname === to) return;

    setLoading(true);

    timerRef.current = window.setTimeout(() => {
      navigate(to);
    }, 500);
  }

  // =========================
  // SYSTEM FOOTER (APP MODE)
  // =========================
  if (isAppRoute) {
    return (
      <>
        <footer className="jal-system-footer" aria-label="System Footer">
          <div className="jal-footer-inner">

            <div className="jal-footer-left">
              <span>JAL/SOL</span>
              <span>ACTIVE</span>
            </div>

            <div className="jal-footer-center">
              <span>
                {location.pathname.replace("/app/", "").toUpperCase() || "HOME"}
              </span>
            </div>

            <div className="jal-footer-right">
              <button onClick={() => beginRoute("/app/home")}>HOME</button>
              <button onClick={() => beginRoute("/app/jal-sol")}>HUB</button>
              <button onClick={() => beginRoute("/app/nav")}>NAV</button>
              <button onClick={() => beginRoute("/app/shop")}>ACCESS</button>
            </div>

          </div>
        </footer>

        {loading && (
          <div className="loading-screen">
            <img src="/JALSOL1.gif" className="loading-logo" />
          </div>
        )}
      </>
    );
  }

  // =========================
  // LEGAL FOOTER (PUBLIC)
  // =========================
  return (
    <footer className="jal-footer" aria-label="Site footer">
      <div className="jal-footer-inner">
        <div className="jal-footer-links">
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/disclaimer">Disclaimer</a>
          <a href="mailto:358jal@gmail.com">Contact</a>
        </div>

        <div className="jal-footer-meta">
          © {new Date().getFullYear()} JALSOL
        </div>
      </div>
    </footer>
  );
}