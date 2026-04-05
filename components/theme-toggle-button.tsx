"use client";

import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { IconButton, Tooltip } from "@mui/material";
import { useColorMode } from "@/app/app-theme-provider";

export default function ThemeToggleButton() {
  const { mode, toggleColorMode } = useColorMode();

  return (
    <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}>
      <IconButton
        onClick={toggleColorMode}
        size="small"
        aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
        sx={{
          color: "text.primary",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
