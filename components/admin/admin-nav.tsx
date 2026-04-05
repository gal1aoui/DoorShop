"use client";

import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LogoutIcon from "@mui/icons-material/Logout";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOutAdmin } from "@/services/auth/admin-auth.service";
import { isSupabaseConfigured } from "@/services/supabase/client";

const adminLinks = [
  { href: "/admin", label: "Dashboard", Icon: DashboardOutlinedIcon },
  { href: "/admin/orders", label: "Orders", Icon: ReceiptLongOutlinedIcon },
  { href: "/admin/products", label: "Products", Icon: Inventory2OutlinedIcon },
  { href: "/admin/analytics", label: "Analytics", Icon: AnalyticsOutlinedIcon },
];

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AdminNavProps = {
  mobile?: boolean;
};

export default function AdminNav({ mobile = false }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    if (!isSupabaseConfigured()) {
      return;
    }

    await signOutAdmin();
    router.replace("/admin/login");
  }

  if (mobile) {
    return (
      <Box
        component="nav"
        aria-label="Admin mobile navigation"
        sx={{
          display: { xs: "block", md: "none" },
          mb: 2.5,
          pb: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="overline"
          sx={{
            letterSpacing: "0.08em",
            fontWeight: 700,
            color: "text.secondary",
            display: "block",
            mb: 1.25,
          }}
        >
          Admin
        </Typography>
        <Box sx={{ overflowX: "auto", pb: 0.5 }}>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ minWidth: "max-content" }}
          >
            {adminLinks.map(({ href, label, Icon }) => {
              const active = isAdminNavActive(pathname, href);
              return (
                <Button
                  key={href}
                  component={Link}
                  href={href}
                  variant={active ? "contained" : "outlined"}
                  color={active ? "primary" : "inherit"}
                  size="small"
                  startIcon={<Icon fontSize="small" />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </Button>
              );
            })}
            <Button
              onClick={() => void handleLogout()}
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<LogoutIcon fontSize="small" />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              Log out
            </Button>
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      component="nav"
      aria-label="Admin desktop navigation"
      sx={{
        width: { md: 244, lg: 264 },
        borderRight: { md: "1px solid" },
        borderColor: "divider",
        p: 2,
        flexShrink: 0,
        bgcolor: "background.paper",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        position: "sticky",
        top: 0,
        overflowY: "auto",
      }}
    >
      <Box sx={{ mb: 2, px: 1 }}>
        <Typography
          variant="overline"
          sx={{
            letterSpacing: "0.1em",
            fontWeight: 700,
            color: "text.secondary",
            display: "block",
          }}
        >
          Boudokhane Admin
        </Typography>
      </Box>

      <List disablePadding sx={{ flex: 1 }}>
        {adminLinks.map(({ href, label, Icon }) => {
          const active = isAdminNavActive(pathname, href);
          return (
            <ListItemButton
              key={href}
              component={Link}
              href={href}
              selected={active}
              sx={{
                mb: 0.5,
                borderRadius: 2,
                py: 1.15,
                "&.Mui-selected": {
                  bgcolor: "action.selected",
                  borderLeft: "2px solid",
                  borderColor: "divider",
                  pl: 1.6,
                },
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontWeight: active ? 700 : 600,
                  fontSize: "0.92rem",
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          pt: 1.5,
          mt: "auto",
        }}
      >
        <Button
          onClick={() => void handleLogout()}
          variant="outlined"
          color="secondary"
          size="small"
          startIcon={<LogoutIcon />}
          fullWidth
          sx={{
            justifyContent: "flex-start",
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Log out
        </Button>
      </Box>
    </Box>
  );
}
