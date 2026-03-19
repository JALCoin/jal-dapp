export default function Footer() {
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