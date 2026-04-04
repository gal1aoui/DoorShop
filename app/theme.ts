"use client";
import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#5d5e61",
      light: "#8a8b8f",
      dark: "#515255",
      contrastText: "#f7f7fa",
    },
    secondary: {
      main: "#5b6065",
      light: "#8a8f94",
      dark: "#4f5458",
      contrastText: "#f5f9ff",
    },
    background: {
      default: "#f9f9fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#2d3338",
      secondary: "#596066",
    },
  },
  typography: {
    fontFamily:
      '"Segoe UI", "Roboto", "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#8a8b8f",
      light: "#b8bbc0",
      dark: "#5d5e61",
      contrastText: "#0b1a2b",
    },
    secondary: {
      main: "#8a8f94",
      light: "#b8bfc5",
      dark: "#5b6065",
      contrastText: "#0b1a2b",
    },
    background: {
      default: "#0b1a2b",
      paper: "#10253d",
    },
    text: {
      primary: "#e6f1ff",
      secondary: "#a8b8c5",
    },
  },
  typography: {
    fontFamily:
      '"Segoe UI", "Roboto", "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },
});

const theme = lightTheme;

export default theme;
