import type { Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";

/**
 * Keeps legacy `var(--*)` usages in sync with the active MUI theme (MUI-first).
 */
export function applyMuiThemeToCssVars(theme: Theme): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const { palette } = theme;
  const mode = palette.mode;

  root.style.setProperty("--background", palette.background.default);
  root.style.setProperty("--foreground", palette.text.primary);

  root.style.setProperty("--primary", palette.primary.main);
  root.style.setProperty("--on-primary", palette.primary.contrastText);
  root.style.setProperty(
    "--primary-container",
    mode === "light"
      ? alpha(palette.primary.main, 0.12)
      : alpha(palette.primary.main, 0.22),
  );
  root.style.setProperty(
    "--on-primary-container",
    mode === "light" ? palette.primary.dark : palette.primary.light,
  );
  root.style.setProperty("--primary-fixed-dim", palette.primary.dark);
  root.style.setProperty("--primary-dim", palette.primary.dark);

  root.style.setProperty("--secondary", palette.secondary.main);
  root.style.setProperty("--on-secondary", palette.secondary.contrastText);
  root.style.setProperty(
    "--secondary-container",
    mode === "light" ? palette.grey[200] : alpha(palette.grey[400], 0.18),
  );
  root.style.setProperty(
    "--on-secondary-container",
    mode === "light" ? palette.grey[800] : palette.grey[200],
  );

  root.style.setProperty("--tertiary", palette.primary.light);
  root.style.setProperty("--on-tertiary", palette.primary.contrastText);
  root.style.setProperty(
    "--tertiary-container",
    mode === "light"
      ? alpha(palette.primary.main, 0.08)
      : alpha(palette.primary.main, 0.16),
  );
  root.style.setProperty(
    "--on-tertiary-container",
    mode === "light" ? palette.primary.dark : palette.primary.light,
  );
  root.style.setProperty("--tertiary-dim", palette.primary.main);

  root.style.setProperty("--surface", palette.background.default);
  root.style.setProperty(
    "--surface-dim",
    mode === "light" ? palette.grey[300] : palette.grey[800],
  );
  root.style.setProperty("--surface-bright", palette.background.paper);
  root.style.setProperty(
    "--surface-container-lowest",
    palette.background.paper,
  );
  root.style.setProperty(
    "--surface-container-low",
    mode === "light" ? palette.grey[100] : "#18181b",
  );
  root.style.setProperty(
    "--surface-container",
    mode === "light" ? palette.grey[200] : "#27272a",
  );
  root.style.setProperty(
    "--surface-container-high",
    mode === "light" ? palette.grey[300] : "#3f3f46",
  );
  root.style.setProperty(
    "--surface-container-highest",
    mode === "light" ? palette.grey[400] : "#52525b",
  );

  root.style.setProperty("--on-surface", palette.text.primary);
  root.style.setProperty("--on-surface-variant", palette.text.secondary);

  root.style.setProperty("--outline", palette.divider);
  root.style.setProperty(
    "--outline-variant",
    mode === "light" ? palette.grey[300] : palette.grey[700],
  );
  root.style.setProperty(
    "--surface-variant",
    mode === "light" ? palette.grey[200] : palette.grey[800],
  );

  root.style.setProperty("--error", palette.error.main);
  root.style.setProperty("--on-error", palette.error.contrastText);
  root.style.setProperty(
    "--error-container",
    mode === "light"
      ? alpha(palette.error.main, 0.12)
      : alpha(palette.error.main, 0.2),
  );
  root.style.setProperty(
    "--on-error-container",
    mode === "light" ? palette.error.dark : palette.error.light,
  );

  root.style.setProperty("--success", palette.success.main);
  root.style.setProperty("--warning", palette.warning.main);
}
