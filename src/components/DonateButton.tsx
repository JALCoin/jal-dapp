import { useEffect, useId, useState } from "react";

const STRIPE_DONATE_URL = "https://buy.stripe.com/bJe28qdNCfwD3yf1880x20d";

type DonateButtonProps = {
  className?: string;
  label?: string;
};

export default function DonateButton({
  className = "",
  label = "Donate",
}: DonateButtonProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descId = useId();
  const classes = ["chip", "donate-button", className].filter(Boolean).join(" ");

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={classes}
        aria-label="Open donation context"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>

      {open ? (
        <div className="donate-modal-layer" role="presentation" onMouseDown={() => setOpen(false)}>
          <div
            className="donate-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="donate-modal-close"
              aria-label="Close donation context"
              onClick={() => setOpen(false)}
            >
              X
            </button>

            <div className="donate-modal-kicker">Join The Process</div>
            <h2 id={titleId} className="donate-modal-title">
              Voluntary JALSOL Support
            </h2>
            <p id={descId} className="donate-modal-copy">
              Join the process. Voluntary support for Jeremy Aaron Lugg&apos;s ongoing JALSOL build.
            </p>
            <p className="donate-modal-boundary">
              Not a product purchase, investment, token sale, equity offer, tax-deductible gift, or
              promise of future benefit.
            </p>

            <div className="donate-modal-actions">
              <a
                className="button gold"
                href={STRIPE_DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                Continue To Stripe
              </a>
              <button type="button" className="button ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
