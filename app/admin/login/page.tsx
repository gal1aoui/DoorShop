"use client";

import LoginIcon from "@mui/icons-material/Login";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import SupabaseConfigAlert from "@/components/supabase-config-alert";
import { signInAsAdmin } from "@/services/auth/admin-auth.service";
import { isSupabaseConfigured } from "@/services/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("a123456A");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    searchParams.get("error"),
  );
  const [isLoading, setIsLoading] = useState(false);

  const requestedNextPath = searchParams.get("next");
  const nextPath = requestedNextPath?.startsWith("/admin")
    ? requestedNextPath
    : "/admin/orders";

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!isSupabaseConfigured()) {
      setErrorMessage("Supabase keys are missing.");
      return;
    }

    setIsLoading(true);
    const result = await signInAsAdmin(email, password);

    if (result.error) {
      setErrorMessage(result.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    router.replace(nextPath);
  }

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Stack spacing={2}>
        {!isSupabaseConfigured() ? <SupabaseConfigAlert /> : null}
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2} component="form" onSubmit={handleLogin}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Admin Login
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign in to manage products, orders, and analytics.
                </Typography>
              </Box>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              {errorMessage ? (
                <Alert severity="error">{errorMessage}</Alert>
              ) : null}
              <Button
                type="submit"
                variant="contained"
                startIcon={<LoginIcon />}
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
