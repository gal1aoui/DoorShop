import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary, #5d5e61)",
        "on-primary": "var(--on-primary, #f7f7fa)",
        "primary-container": "var(--primary-container, #e2e2e5)",
        "on-primary-container": "var(--on-primary-container, #505254)",
        "primary-fixed": "var(--primary-fixed, #e2e2e5)",
        "primary-fixed-dim": "var(--primary-fixed-dim, #d4d4d7)",
        "on-primary-fixed": "var(--on-primary-fixed, #3e3f42)",
        "on-primary-fixed-variant": "var(--on-primary-fixed-variant, #5a5c5e)",
        "primary-dim": "var(--primary-dim, #515255)",

        secondary: "var(--secondary, #5b6065)",
        "on-secondary": "var(--on-secondary, #f5f9ff)",
        "secondary-container": "var(--secondary-container, #dee3e9)",
        "on-secondary-container": "var(--on-secondary-container, #4d5257)",
        "secondary-fixed": "var(--secondary-fixed, #dee3e9)",
        "secondary-fixed-dim": "var(--secondary-fixed-dim, #d0d5da)",
        "on-secondary-fixed": "var(--on-secondary-fixed, #3b4045)",
        "on-secondary-fixed-variant":
          "var(--on-secondary-fixed-variant, #575c61)",
        "secondary-dim": "var(--secondary-dim, #4f5458)",

        tertiary: "var(--tertiary, #815534)",
        "on-tertiary": "var(--on-tertiary, #fff7f4)",
        "tertiary-container": "var(--tertiary-container, #fac097)",
        "on-tertiary-container": "var(--on-tertiary-container, #613b1c)",
        "tertiary-fixed": "var(--tertiary-fixed, #fac097)",
        "tertiary-fixed-dim": "var(--tertiary-fixed-dim, #ebb38a)",
        "on-tertiary-fixed": "var(--on-tertiary-fixed, #4a280a)",
        "on-tertiary-fixed-variant":
          "var(--on-tertiary-fixed-variant, #6c4324)",
        "tertiary-dim": "var(--tertiary-dim, #734a29)",

        surface: "var(--surface, #f9f9fb)",
        "surface-dim": "var(--surface-dim, #d3dbe3)",
        "surface-bright": "var(--surface-bright, #f9f9fb)",
        "surface-container-lowest": "var(--surface-container-lowest, #ffffff)",
        "surface-container-low": "var(--surface-container-low, #f2f4f7)",
        "surface-container": "var(--surface-container, #ebeef3)",
        "surface-container-high": "var(--surface-container-high, #e4e9ee)",
        "surface-container-highest":
          "var(--surface-container-highest, #dde3ea)",

        "on-surface": "var(--on-surface, #2d3338)",
        "on-surface-variant": "var(--on-surface-variant, #596066)",

        outline: "var(--outline, #757b82)",
        "outline-variant": "var(--outline-variant, #acb3b9)",
        "surface-variant": "var(--surface-variant, #dde3ea)",

        error: "var(--error, #9f403d)",
        "on-error": "var(--on-error, #fff7f6)",
        "error-container": "var(--error-container, #fe8983)",
        "on-error-container": "var(--on-error-container, #752121)",
        "error-dim": "var(--error-dim, #4e0309)",

        background: "var(--background, #f9f9fb)",
        foreground: "var(--foreground, #2d3338)",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
