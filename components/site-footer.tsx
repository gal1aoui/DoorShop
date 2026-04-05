"use client";

import {
  Box,
  Container,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export default function SiteFooter() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const footerBg = isDark
    ? alpha(theme.palette.common.black, 0.45)
    : theme.palette.grey[100];
  const muted = isDark ? theme.palette.text.secondary : theme.palette.grey[700];
  const heading = theme.palette.text.primary;
  const linkHover = theme.palette.primary.main;

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: footerBg,
        color: muted,
        py: { xs: 5, md: 6 },
        mt: { xs: 8, md: 10 },
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3} alignItems="center">
          <Typography
            variant="h6"
            sx={{
              color: heading,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              fontFamily: (t) => t.typography.h6.fontFamily,
              fontSize: "1.25rem",
            }}
          >
            Boudokhane Doors
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1.5, sm: 3 }}
            justifyContent="center"
            alignItems="center"
            sx={{
              flexWrap: "wrap",
              textAlign: "center",
              rowGap: 1,
            }}
          >
            {[
              "Privacy Policy",
              "Terms of Service",
              "Installation Guides",
              "Contact Sales",
            ].map((label) => (
              <MuiLink
                key={label}
                href="#"
                sx={{
                  color: muted,
                  textDecoration: "none",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  transition: "color 0.2s ease",
                  "&:hover": {
                    color: linkHover,
                  },
                }}
              >
                {label}
              </MuiLink>
            ))}
          </Stack>

          <Typography
            variant="caption"
            sx={{
              fontSize: "0.75rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: isDark ? theme.palette.grey[600] : theme.palette.grey[500],
              textAlign: "center",
            }}
          >
            (c) {new Date().getFullYear()} Boudokhane Doors. Architectural
            Integrity.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
