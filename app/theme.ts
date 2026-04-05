"use client";
import { alpha, createTheme } from "@mui/material/styles";

const fontSans =
  '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif';
const fontDisplay = '"Manrope", "Inter", system-ui, sans-serif';

const radius = 12;

const sharedTypography = {
  fontFamily: fontSans,
  h1: {
    fontFamily: fontDisplay,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: 1.15,
  },
  h2: {
    fontFamily: fontDisplay,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  },
  h3: {
    fontFamily: fontDisplay,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    lineHeight: 1.25,
  },
  h4: {
    fontFamily: fontDisplay,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    lineHeight: 1.3,
  },
  h5: {
    fontFamily: fontDisplay,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  h6: {
    fontFamily: fontDisplay,
    fontWeight: 700,
    lineHeight: 1.4,
  },
  subtitle1: { lineHeight: 1.5, fontWeight: 500 },
  subtitle2: { lineHeight: 1.5, fontWeight: 600 },
  body1: { lineHeight: 1.65, fontSize: "1rem" },
  body2: { lineHeight: 1.65, fontSize: "0.875rem" },
  button: {
    fontWeight: 600,
    letterSpacing: "0.02em",
    textTransform: "none" as const,
  },
  caption: { lineHeight: 1.5, letterSpacing: "0.02em" },
};

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",
      light: "#3b82f6",
      dark: "#1d4ed8",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#52525b",
      light: "#71717a",
      dark: "#3f3f46",
      contrastText: "#fafafa",
    },
    error: {
      main: "#dc2626",
      light: "#ef4444",
      dark: "#b91c1c",
      contrastText: "#ffffff",
    },
    divider: "rgba(15, 23, 42, 0.08)",
    background: {
      default: "#f4f4f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#0a0a0a",
      secondary: "#52525b",
      disabled: "rgba(10, 10, 10, 0.38)",
    },
    action: {
      active: "rgba(10, 10, 10, 0.56)",
      hover: "rgba(10, 10, 10, 0.04)",
      selected: "rgba(37, 99, 235, 0.08)",
      disabled: "rgba(10, 10, 10, 0.26)",
      disabledBackground: "rgba(10, 10, 10, 0.12)",
    },
  },
  typography: sharedTypography,
  shape: { borderRadius: radius },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFeatureSettings: '"liga" 1, "kern" 1',
          WebkitFontSmoothing: "antialiased",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: radius,
          paddingLeft: "1rem",
          paddingRight: "1rem",
        },
        sizeLarge: {
          paddingTop: "0.625rem",
          paddingBottom: "0.625rem",
          fontSize: "0.9375rem",
        },
        outlined: ({ theme }) => ({
          borderWidth: "1.25px",
          borderColor:
            theme.palette.mode === "light"
              ? alpha(theme.palette.text.primary, 0.3)
              : alpha(theme.palette.common.white, 0.34),
          color: theme.palette.text.primary,
          "&:hover": {
            borderColor:
              theme.palette.mode === "light"
                ? alpha(theme.palette.text.primary, 0.55)
                : alpha(theme.palette.common.white, 0.6),
            backgroundColor:
              theme.palette.mode === "light"
                ? alpha(theme.palette.text.primary, 0.04)
                : alpha(theme.palette.common.white, 0.08),
          },
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: radius,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: "none",
        }),
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small" },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#60a5fa",
      light: "#93c5fd",
      dark: "#3b82f6",
      contrastText: "#0a0a0a",
    },
    secondary: {
      main: "#a1a1aa",
      light: "#d4d4d8",
      dark: "#71717a",
      contrastText: "#0a0a0a",
    },
    error: {
      main: "#f87171",
      light: "#fca5a5",
      dark: "#ef4444",
      contrastText: "#0a0a0a",
    },
    divider: "rgba(250, 250, 250, 0.12)",
    background: {
      default: "#09090b",
      paper: "#18181b",
    },
    text: {
      primary: "#fafafa",
      secondary: "#a1a1aa",
      disabled: "rgba(250, 250, 250, 0.38)",
    },
    action: {
      active: "rgba(250, 250, 250, 0.56)",
      hover: "rgba(250, 250, 250, 0.06)",
      selected: "rgba(96, 165, 250, 0.16)",
      disabled: "rgba(250, 250, 250, 0.3)",
      disabledBackground: "rgba(250, 250, 250, 0.12)",
    },
  },
  typography: sharedTypography,
  shape: { borderRadius: radius },
  components: lightTheme.components,
});

const theme = lightTheme;

export default theme;
