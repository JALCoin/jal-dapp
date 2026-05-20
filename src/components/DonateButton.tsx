const STRIPE_DONATE_URL = "https://buy.stripe.com/bJe28qdNCfwD3yf1880x20d";

type DonateButtonProps = {
  className?: string;
  label?: string;
};

export default function DonateButton({
  className = "",
  label = "Donate",
}: DonateButtonProps) {
  const classes = ["chip", "donate-button", className].filter(Boolean).join(" ");

  return (
    <a
      className={classes}
      href={STRIPE_DONATE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Donate via Stripe"
    >
      {label}
    </a>
  );
}
