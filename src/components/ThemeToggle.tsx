import type { ThemeMode } from "../hooks/useTheme";

type ThemeToggleProps = {
  theme: ThemeMode;
  onToggleTheme: () => void;
  disabled?: boolean;
};

export default function ThemeToggle({
  theme,
  onToggleTheme,
  disabled = false,
}: ThemeToggleProps) {
  const isLight = theme === "light";
  const ariaLabel = isLight ? "Switch to dark mode" : "Switch to light mode";

  return (
    <button
      type="button"
      className={`theme-toggle ${isLight ? "is-light" : "is-dark"}`}
      onClick={onToggleTheme}
      disabled={disabled}
      role="switch"
      aria-checked={isLight}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-emoji theme-toggle-emoji--moon">🌙</span>
        <span className="theme-toggle-emoji theme-toggle-emoji--sun">☀️</span>
        <span className="theme-toggle-thumb">
          <span className="theme-toggle-thumb-icon">{isLight ? "☀️" : "🌙"}</span>
        </span>
      </span>
    </button>
  );
}
