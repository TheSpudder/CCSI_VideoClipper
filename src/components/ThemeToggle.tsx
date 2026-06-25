import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, type Theme } from "../lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      <span className="theme-toggle__icon" aria-hidden>
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
      <span className="theme-toggle__label">
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </button>
  );
}
