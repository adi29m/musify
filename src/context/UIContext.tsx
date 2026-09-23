"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

type UICtx = {
  leftOpen: boolean;
  setLeftOpen: (open: boolean) => void;
  toggleLeft: () => void;
  theme: Theme;
  toggleTheme: () => void;
};

const Ctx = createContext<UICtx | null>(null);

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("light", t === "light");
  try {
    localStorage.setItem("musify-theme", t);
  } catch { /* noop */ }
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem("musify-theme") === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleLeft = useCallback(() => setLeftOpen((o) => !o), []);
  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  const value = useMemo(
    () => ({ leftOpen, setLeftOpen, toggleLeft, theme, toggleTheme }),
    [leftOpen, toggleLeft, theme, toggleTheme]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI(): UICtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUI must be used within UIProvider");
  return c;
}
