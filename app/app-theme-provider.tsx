"use client";

import { CssBaseline, type PaletteMode, ThemeProvider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { darkTheme, lightTheme } from "./theme";
import { applyMuiThemeToCssVars } from "./theme-css-bridge";

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

function ThemeCssVarSync({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  useEffect(() => {
    applyMuiThemeToCssVars(theme);
  }, [theme]);

  return <>{children}</>;
}

export default function AppThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<PaletteMode>("light");

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

    window.localStorage.setItem("color-mode", mode);
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.documentElement.style.colorScheme =
      mode === "dark" ? "dark" : "light";
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prev) => (prev === "light" ? "dark" : "light"));
      },
    }),
    [mode],
  );

  const appliedTheme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <ColorModeContext.Provider value={colorMode as ColorModeContextType}>
      <ThemeProvider theme={appliedTheme}>
        <CssBaseline />
        <ThemeCssVarSync>{children}</ThemeCssVarSync>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
