import { Link } from "react-router-dom";
import {
  ABN_LOOKUP_URL,
  LEGAL_ABN,
  LEGAL_CONTACT_MAILTO,
  LEGAL_OPERATOR_NAME,
} from "../lib/legal";

export default function Footer() {
  return (
    <footer className="jal-footer" aria-label="Site footer">
      <div className="jal-footer-inner">
        <div className="jal-footer-business">
          <div className="jal-footer-kicker">Jeremy Aaron Lugg</div>
          <div className="jal-footer-role">Founder / Operator</div>
          <p className="jal-footer-summary">
            Public business domain for crypto-market aligned products, founder identity, and
            physical JALSOL releases.
          </p>
          <div className="jal-footer-contact">
            <a href={LEGAL_CONTACT_MAILTO}>358jal@gmail.com</a>
            <a href={ABN_LOOKUP_URL} target="_blank" rel="noreferrer">
              ABN {LEGAL_ABN}
            </a>
            <span>Western Australia</span>
          </div>
        </div>

        <div className="jal-footer-right">
          <nav className="jal-footer-links" aria-label="Footer navigation">
            <Link to="/app/about">About</Link>
            <Link to="/app/legal">Legal</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/disclaimer">Disclaimer</Link>
          </nav>

          <div className="jal-footer-socials" aria-label="Official social links">
            <a href="https://x.com/JAL358" target="_blank" rel="noreferrer">
              X
            </a>
            <a href="https://www.tiktok.com/@358jalsol" target="_blank" rel="noreferrer">
              TikTok
            </a>
          </div>

          <div className="jal-footer-identity">
            <span>Legal operator: {LEGAL_OPERATOR_NAME}</span>
            <span>Official public business domain</span>
          </div>
        </div>

        <div className="jal-footer-meta">
          <a href={ABN_LOOKUP_URL} target="_blank" rel="noreferrer">
            Verify ABN {LEGAL_ABN}
          </a>
        </div>
      </div>
    </footer>
  );
}
