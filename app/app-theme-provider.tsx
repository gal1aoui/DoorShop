"use client";

import { CssBaseline, type PaletteMode, ThemeProvider } from "@mui/material";
import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { darkTheme, lightTheme } from "./theme";

type ColorModeContextType = {
  mode: PaletteMode;
  toggleColorMode: () => void;
};

const ColorModeContext = createContext<ColorModeContextType | undefined>(
  undefined,
);

export const useColorMode = () => {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error("useColorMode must be used within AppThemeProvider");
  }
  return context;
};

export default function AppThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<PaletteMode>("light");

  // Prime initial mode from localStorage or system preference (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.localStorage.getItem("color-mode");
    if (saved === "light" || saved === "dark") {
      setMode(saved);
      return;
    }

    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    ).matches;
    setMode(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Persist user choice and sync global CSS color vars, so non-MUI elements also follow app mode.
    window.localStorage.setItem("color-mode", mode);

    const root = document.documentElement;
    if (mode === "dark") {
      root.style.setProperty("--background", "#0b1a2b");
      root.style.setProperty("--foreground", "#e6f1ff");
    } else {
      root.style.setProperty("--background", "#eef5ff");
      root.style.setProperty("--foreground", "#0f2a43");
    }
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prev) => {
          const next = prev === "light" ? "dark" : "light";
          return next;
        });
      },
    }),
    [mode],
  );

  const appliedTheme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <ColorModeContext.Provider value={colorMode as ColorModeContextType}>
      <ThemeProvider theme={appliedTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
