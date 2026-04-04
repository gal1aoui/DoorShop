"use client";

import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import ThemeToggleButton from "./theme-toggle-button";

const links = [
  { href: "/", label: "Home" },
  { href: "#collections", label: "Collections" },
  { href: "/track", label: "Track Order" },
  { href: "/admin/login", label: "Admin" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawerLinks = useMemo(
    () =>
      links.map((link) => (
        <Button
          key={link.href}
          component={Link}
          href={link.href}
          sx={{
            justifyContent: "flex-start",
            py: 1.5,
            color: pathname === link.href ? "primary" : "inherit",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
          onClick={() => setMobileOpen(false)}
        >
          {link.label}
        </Button>
      )),
    [pathname],
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backdropFilter: "blur(16px)",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1.5,
            maxWidth: "100%",
            mx: "auto",
            width: "100%",
            px: { xs: 2, md: 4 },
          }}
        >
          {/* Logo */}
          <Typography
            component={Link}
            href="/"
            variant="h6"
            sx={{
              textDecoration: "none",
              color: "text.primary",
              fontWeight: 800,
              fontSize: { xs: "1.25rem", md: "1.5rem" },
              letterSpacing: "-0.02em",
              fontFamily: '"Manrope", sans-serif',
            }}
          >
            Boudokhane Doors
          </Typography>

          {/* Desktop Links */}
          <Stack
            direction="row"
            spacing={3}
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              flexGrow: 1,
              ml: 4,
            }}
          >
            {links.slice(0, 3).map((link) => (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                sx={{
                  textTransform: "none",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: pathname === link.href ? "primary" : "text.secondary",
                  borderBottom:
                    pathname === link.href
                      ? "2px solid"
                      : "2px solid transparent",
                  borderColor: "primary",
                  pb: 0.5,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    color: "primary",
                  },
                }}
              >
                {link.label}
              </Button>
            ))}
          </Stack>

          {/* Right Actions */}
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            <Button
              component={Link}
              href="/track"
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                px: 2.5,
                py: 1,
                borderRadius: "0.5rem",
              }}
            >
              Track Order
            </Button>
            <ThemeToggleButton />
          </Stack>

          {/* Mobile Menu Button */}
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ display: { xs: "flex", md: "none" } }}
          >
            <ThemeToggleButton />
            <IconButton
              color="inherit"
              edge="end"
              onClick={() => setMobileOpen(true)}
              size="small"
            >
              <MenuIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      >
        <Box sx={{ width: 280, p: 2 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 700, fontFamily: '"Manrope", sans-serif' }}
          >
            Navigation
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={0.5}>{drawerLinks}</Stack>
        </Box>
      </Drawer>
    </>
  );
}
