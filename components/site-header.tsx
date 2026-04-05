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
import { alpha, useTheme } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import ThemeToggleButton from "./theme-toggle-button";

const links = [
  { href: "/", label: "Home" },
  { href: "/collections", label: "Collections" },
  { href: "/track", label: "Track Order" },
  { href: "/admin/login", label: "Admin" },
];

function navHrefActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const theme = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const appBarBg =
    theme.palette.mode === "dark"
      ? alpha(theme.palette.background.default, 0.85)
      : alpha(theme.palette.background.paper, 0.88);

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
            color: navHrefActive(pathname, link.href)
              ? "primary.main"
              : "text.primary",
            fontSize: "0.9375rem",
            fontWeight: navHrefActive(pathname, link.href) ? 600 : 500,
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
        color="transparent"
        elevation={0}
        sx={{
          color: "text.primary",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          backgroundColor: appBarBg,
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
            minHeight: { xs: 56, sm: 64 },
          }}
        >
          <Typography
            component={Link}
            href="/"
            variant="h6"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              textDecoration: "none",
              color: "text.primary",
              fontWeight: 800,
              fontSize: { xs: "1.125rem", md: "1.25rem" },
              letterSpacing: "-0.02em",
              fontFamily: (t) => t.typography.h6.fontFamily,
            }}
          >
            <Box
              component="img"
              src="/boudokhane-logo.svg"
              alt="Boudokhane Doors"
              sx={{ width: 28, height: 28, display: "block" }}
            />
            Boudokhane
          </Typography>

          <Stack
            direction="row"
            spacing={2.5}
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              flexGrow: 1,
              ml: 4,
            }}
          >
            {links.slice(0, 2).map((link) => {
              const active = navHrefActive(pathname, link.href);
              return (
                <Button
                  key={link.href}
                  component={Link}
                  href={link.href}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.9375rem",
                    fontWeight: active ? 600 : 500,
                    color: active ? "primary.main" : "text.secondary",
                    borderBottom: active
                      ? "2px solid"
                      : "2px solid transparent",
                    borderColor: "text.primary",
                    borderRadius: 0,
                    pb: 0.5,
                    transition: "color 0.2s ease, border-color 0.2s ease",
                    "&:hover": {
                      color: "primary.main",
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  {link.label}
                </Button>
              );
            })}
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            <Button
              component={Link}
              href="/track"
              variant="contained"
              color="primary"
              size="small"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                px: 2.5,
                py: 1,
                borderRadius: 2,
                color: "primary.contrastText",
              }}
            >
              Track Order
            </Button>
            <ThemeToggleButton />
          </Stack>

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ display: { xs: "flex", md: "none" } }}
          >
            <ThemeToggleButton />
            <IconButton
              edge="end"
              onClick={() => setMobileOpen(true)}
              size="small"
              aria-label="Open navigation menu"
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
              <MenuIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            pt: 2,
            px: 1,
            bgcolor: "background.paper",
          },
        }}
      >
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              mb: 1,
              fontWeight: 700,
              fontFamily: (t) => t.typography.h6.fontFamily,
            }}
          >
            Menu
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={0.5}>{drawerLinks}</Stack>
          <Divider sx={{ my: 2 }} />
          <Button
            component={Link}
            href="/track"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ textTransform: "none", fontWeight: 600, py: 1.25 }}
            onClick={() => setMobileOpen(false)}
          >
            Track Order
          </Button>
          <Button
            component={Link}
            href="/admin/login"
            variant="outlined"
            fullWidth
            sx={{ mt: 1.5, textTransform: "none", fontWeight: 600 }}
            onClick={() => setMobileOpen(false)}
          >
            Admin
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
