import { useEffect, useState } from "react";
import { getActiveTheme, getStoredTheme, type Theme } from "../lib/theme";

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() => getActiveTheme());

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme(getActiveTheme());
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

export { getStoredTheme };
