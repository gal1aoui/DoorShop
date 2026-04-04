"use client";

import LogoutIcon from "@mui/icons-material/Logout";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOutAdmin } from "@/services/auth/admin-auth.service";
import { isSupabaseConfigured } from "@/services/supabase/client";

const adminLinks = [
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/analytics", label: "Analytics" },
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

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Admin Console
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage catalog, orders, and sales analytics.
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
              >
                {link.label}
              </Button>
            ))}
            <Button
              onClick={() => void handleLogout()}
              variant="text"
              size="small"
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
