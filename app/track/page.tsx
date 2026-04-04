"use client";

import SearchIcon from "@mui/icons-material/Search";
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
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TrackLookupPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmed = token.trim().toLowerCase();
    if (!trimmed) {
      setErrorMessage("Please enter your tracking token.");
      return;
    }

    router.push(`/track/${trimmed}`);
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Track Your Order
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Paste the secure tracking token you received after ordering.
              </Typography>
            </Box>
            <TextField
              label="Tracking token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              fullWidth
            />
            {errorMessage ? (
              <Alert severity="error">{errorMessage}</Alert>
            ) : null}
            <Button
              type="submit"
              variant="contained"
              startIcon={<SearchIcon />}
            >
              Open tracking page
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
