import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="jal-footer" aria-label="Site footer">
      <div className="jal-footer-inner">
        <nav className="jal-footer-links" aria-label="Footer navigation">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/disclaimer">Disclaimer</Link>
        </nav>

        <div className="jal-footer-identity">
          <span>Operated by Jeremy Aaron Lugg</span>
          <span>ABN 35 780 648 234</span>
        </div>
      </div>
    </footer>
  );
}