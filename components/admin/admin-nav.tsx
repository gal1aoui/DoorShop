"use client";

import LogoutIcon from "@mui/icons-material/Logout";
import { Box, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOutAdmin } from "@/services/auth/admin-auth.service";
import { isSupabaseConfigured } from "@/services/supabase/client";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "Orders", icon: "📋" },
  { href: "/admin/products", label: "Products", icon: "📦" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    if (!isSupabaseConfigured()) {
      return;
    }

    await signOutAdmin();
    router.replace("/admin/login");
  }

  /**
   * Desktop sidebar nav (shown on md+ screens)
   */
  const sidebarNav = (
    <Box
      sx={{
        width: "260px",
        borderRight: "1px solid",
        borderColor: "var(--outline-variant)",
        p: 2,
        flexShrink: 0,
        backgroundColor: "var(--surface-container-lowest)",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--on-surface-variant)",
            mb: 1.5,
            px: 1,
          }}
        >
          Boudokhane Admin
        </Typography>
      </Box>

      <Stack
        component="ul"
        spacing={0.75}
        sx={{ listStyle: "none", p: 0, m: 0, flex: 1 }}
      >
        {adminLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.href}>
              <Link href={link.href}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                    borderRadius: "0.5rem",
                    textDecoration: "none",
                    color: isActive
                      ? "var(--on-primary-container)"
                      : "var(--on-surface-variant)",
                    backgroundColor: isActive
                      ? "var(--primary-container)"
                      : "transparent",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "0.875rem",
                    transition: "all 200ms ease",
                    borderLeft: isActive
                      ? "3px solid var(--primary)"
                      : "3px solid transparent",
                    "&:hover": {
                      backgroundColor: "var(--surface-container-high)",
                      color: "var(--on-surface)",
                    },
                  }}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Box>
              </Link>
            </li>
          );
        })}
      </Stack>

      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: "var(--outline-variant)",
          pt: 1.5,
          mt: 1.5,
        }}
      >
        <Button
          onClick={() => void handleLogout()}
          variant="text"
          size="small"
          startIcon={<LogoutIcon />}
          fullWidth
          sx={{
            justifyContent: "flex-start",
            color: "var(--on-surface-variant)",
            "&:hover": { color: "var(--on-surface)" },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  /**
   * Mobile header nav (shown on xs/sm screens)
   */
  const mobileNav = (
    <Box
      sx={{
        borderBottom: "1px solid",
        borderColor: "var(--outline-variant)",
        p: 2,
        mb: 3,
        display: { xs: "flex", md: "none" },
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box>
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--on-surface-variant)",
            mb: 1,
          }}
        >
          Admin Console
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {adminLinks.map((link) => (
          <Button
            key={link.href}
            component={Link}
            href={link.href}
            variant={pathname === link.href ? "contained" : "outlined"}
            size="small"
            sx={{ fontSize: "0.75rem" }}
          >
            {link.icon} {link.label}
          </Button>
        ))}
        <Button
          onClick={() => void handleLogout()}
          variant="text"
          size="small"
          startIcon={<LogoutIcon />}
          sx={{ fontSize: "0.75rem" }}
        >
          Logout
        </Button>
      </Stack>
    </Box>
  );

  return (
    <>
      {sidebarNav}
      {mobileNav}
    </>
  );
}
