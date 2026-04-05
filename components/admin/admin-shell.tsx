"use client";

import { Box, Container } from "@mui/material";
import { usePathname } from "next/navigation";
import AdminGuard from "@/components/admin/admin-guard";
import AdminNav from "@/components/admin/admin-nav";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return <>{children}</>;
  }

  return (
    <AdminGuard>
      <Box
        sx={{
          display: "flex",
          minHeight: "100dvh",
          bgcolor: "background.default",
        }}
      >
        <AdminNav />
        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: "100dvh",
            overflowY: "auto",
            overflowX: "hidden",
            bgcolor: "background.default",
          }}
        >
          <Container
            maxWidth="lg"
            sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}
          >
            <AdminNav mobile />
            {children}
          </Container>
        </Box>
      </Box>
    </AdminGuard>
  );
}
