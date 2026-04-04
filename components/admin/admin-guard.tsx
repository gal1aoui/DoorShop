"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getCurrentAdminAccess,
  signOutAdmin,
} from "@/services/auth/admin-auth.service";
import { isSupabaseConfigured } from "@/services/supabase/client";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function verifyAdminSession() {
      if (!isSupabaseConfigured()) {
        if (!mounted) return;
        setMessage("Supabase keys are missing.");
        setIsChecking(false);
        return;
      }

      const result = await getCurrentAdminAccess();
      if (result.error) {
        if (!mounted) return;
        setMessage(result.error);
        setIsChecking(false);
        return;
      }

      if (!result.data?.hasSession) {
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      if (!result.data.isAdmin) {
        await signOutAdmin();
        router.replace("/admin/login?error=You are not listed as an admin.");
        return;
      }

      if (!mounted) return;
      setIsAllowed(true);
      setIsChecking(false);
    }

    void verifyAdminSession();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (isChecking) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          p: 3,
        }}
      >
        <Box>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Checking admin session...</Typography>
        </Box>
      </Box>
    );
  }

  if (!isAllowed) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error">{message ?? "Access denied."}</Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
