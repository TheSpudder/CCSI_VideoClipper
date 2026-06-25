export type Theme = "dark" | "light";

const STORAGE_KEY = "hotspot-theme";

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
}

export function getActiveTheme(): Theme {
  const current = document.documentElement.dataset.theme;
  if (current === "light" || current === "dark") return current;
  return getStoredTheme();
}
