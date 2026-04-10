import { Link } from "react-router-dom";
import { ABN_LOOKUP_URL, LEGAL_ABN, LEGAL_OPERATOR_NAME } from "../lib/legal";

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
          <span>Legal operator: {LEGAL_OPERATOR_NAME}</span>
          <a href={ABN_LOOKUP_URL} target="_blank" rel="noreferrer">
            ABN {LEGAL_ABN} | ABN Lookup
          </a>
        </div>
      </div>
    </footer>
  );
}
