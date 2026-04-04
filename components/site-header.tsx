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
  { href: "/", label: "Catalog" },
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
          color={pathname === link.href ? "primary" : "inherit"}
          onClick={() => setMobileOpen(false)}
          sx={{ justifyContent: "flex-start", py: 1.5 }}
        >
          {link.label}
        </Button>
      )),
    [pathname],
  );

  return (
    <>
      <AppBar position="sticky" color="default" elevation={0}>
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton
            color="inherit"
            edge="start"
            sx={{ display: { xs: "inline-flex", md: "none" } }}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component={Link}
            href="/"
            variant="h6"
            sx={{
              textDecoration: "none",
              color: "inherit",
              fontWeight: 700,
              flexGrow: 1,
            }}
          >
            Boudokhane Doors
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}
          >
            {links.map((link) => (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                variant={pathname === link.href ? "contained" : "text"}
                size="small"
              >
                {link.label}
              </Button>
            ))}
          </Stack>
          <ThemeToggleButton />
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        <Box sx={{ width: 280, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Navigation
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Stack spacing={0.5}>{drawerLinks}</Stack>
        </Box>
      </Drawer>
    </>
  );
}
