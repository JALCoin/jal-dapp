import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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

  if (isAppRoute) {
    const current =
      location.pathname === "/app/home"
        ? "HOME"
        : location.pathname === "/app/jal-sol"
        ? "HUB"
        : location.pathname === "/app/nav"
        ? "NAV"
        : location.pathname === "/app/shop"
        ? "ACCESS"
        : location.pathname.replace("/app/", "").toUpperCase();

    return (
      <>
        <footer className="jal-system-footer" aria-label="System Footer">
          <div className="jal-system-footer-inner">
            <div className="jal-system-footer-left">
              <span>JAL/SOL</span>
              <span>ACTIVE</span>
            </div>

            <div className="jal-system-footer-center">
              <span>{current}</span>
            </div>

            <div className="jal-system-footer-right">
              <button type="button" onClick={() => beginRoute("/app/home")}>
                HOME
              </button>
              <button type="button" onClick={() => beginRoute("/app/jal-sol")}>
                HUB
              </button>
              <button type="button" onClick={() => beginRoute("/app/nav")}>
                NAV
              </button>
              <button type="button" onClick={() => beginRoute("/app/shop")}>
                ACCESS
              </button>
            </div>
          </div>
        </footer>

        {loading && (
          <div className="loading-screen" role="status" aria-label="Loading">
            <img className="loading-logo" src="/JALSOL1.gif" alt="" />
          </div>
        )}
      </>
    );
  }

  return (
    <footer className="jal-footer" aria-label="Site footer">
      <div className="jal-footer-inner">
        <div className="jal-footer-links">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/disclaimer">Disclaimer</Link>
          <a href="mailto:358jal@gmail.com">Contact</a>
        </div>

        <div className="jal-footer-meta">© {new Date().getFullYear()} JALSOL</div>
      </div>
    </footer>
  );
}