"use client";

import { Alert, AlertTitle, Stack, Typography } from "@mui/material";

export default function SupabaseConfigAlert() {
  return (
    <Alert severity="warning" sx={{ mt: 3 }}>
      <AlertTitle>Supabase keys are missing</AlertTitle>
      <Stack spacing={0.5}>
        <Typography variant="body2">
          Add these variables to your environment before using data features:
        </Typography>
        <Typography variant="body2">
          `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        </Typography>
      </Stack>
    </Alert>
  );
}
