const STRIPE_DONATE_URL = "https://donate.stripe.com/cNi3cu4d284b3yfaII0x20c";

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
