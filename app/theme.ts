"use client";
import { createTheme } from "@mui/material/styles";

const sharedTypography = {
  fontFamily:
    '"Segoe UI", "Roboto", "Helvetica Neue", Arial, "Noto Sans", sans-serif',
};

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1565c0",
      light: "#5e92f3",
      dark: "#003c8f",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#0288d1",
      light: "#5eb8ff",
      dark: "#005b9f",
      contrastText: "#ffffff",
    },
    background: {
      default: "#eef5ff",
      paper: "#ffffff",
    },
  },
  typography: sharedTypography,
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#64b5f6",
      light: "#9be7ff",
      dark: "#2286c3",
      contrastText: "#001a33",
    },
    secondary: {
      main: "#4fc3f7",
      light: "#8bf6ff",
      dark: "#0093c4",
      contrastText: "#00202d",
    },
    background: {
      default: "#0b1a2b",
      paper: "#10253d",
    },
  },
  typography: sharedTypography,
});

const theme = lightTheme;

export default theme;
