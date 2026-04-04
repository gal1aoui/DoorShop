"use client";

import {
  Box,
  Container,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";

export default function SiteFooter() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#1a1f26",
        color: "#a8b0b8",
        py: 6,
        mt: 12,
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4} alignItems="center">
          {/* Logo */}
          <Typography
            variant="h6"
            sx={{
              color: "#f0f1f3",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              fontFamily: '"Manrope", sans-serif',
              fontSize: "1.25rem",
            }}
          >
            Boudokhane Doors
          </Typography>

          {/* Links */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2, md: 4 }}
            justifyContent="center"
            alignItems="center"
            sx={{
              flexWrap: "wrap",
              textAlign: "center",
            }}
          >
            <MuiLink
              href="#"
              sx={{
                color: "#a8b0b8",
                textDecoration: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                transition: "color 0.2s ease",
                "&:hover": {
                  color: "#e8eef5",
                },
              }}
            >
              Privacy Policy
            </MuiLink>
            <MuiLink
              href="#"
              sx={{
                color: "#a8b0b8",
                textDecoration: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                transition: "color 0.2s ease",
                "&:hover": {
                  color: "#e8eef5",
                },
              }}
            >
              Terms of Service
            </MuiLink>
            <MuiLink
              href="#"
              sx={{
                color: "#a8b0b8",
                textDecoration: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                transition: "color 0.2s ease",
                "&:hover": {
                  color: "#e8eef5",
                },
              }}
            >
              Installation Guides
            </MuiLink>
            <MuiLink
              href="#"
              sx={{
                color: "#a8b0b8",
                textDecoration: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                transition: "color 0.2s ease",
                "&:hover": {
                  color: "#e8eef5",
                },
              }}
            >
              Contact Sales
            </MuiLink>
          </Stack>

          {/* Copyright */}
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.75rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#6f767f",
              textAlign: "center",
            }}
          >
            © 2024 Boudokhane Doors. Architectural Integrity.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
