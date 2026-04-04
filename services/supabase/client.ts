"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let authCookieSyncRegistered = false;
const ADMIN_ACCESS_COOKIE = "door-admin-access-token";

function buildCookieSuffix(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.protocol === "https:"
    ? "; SameSite=Lax; Path=/; Secure"
    : "; SameSite=Lax; Path=/";
}

export function persistAccessTokenCookie(accessToken: string | null): void {
  if (typeof document === "undefined") {
    return;
  }

  const suffix = buildCookieSuffix();

  if (!accessToken) {
    // biome-ignore lint/suspicious/noDocumentCookie: We intentionally sync auth token to a cookie for proxy-based route protection.
    document.cookie = `${ADMIN_ACCESS_COOKIE}=; Max-Age=0${suffix}`;
    return;
  }

  // biome-ignore lint/suspicious/noDocumentCookie: We intentionally sync auth token to a cookie for proxy-based route protection.
  document.cookie = `${ADMIN_ACCESS_COOKIE}=${encodeURIComponent(accessToken)}; Max-Age=31536000${suffix}`;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  if (!authCookieSyncRegistered) {
    authCookieSyncRegistered = true;

    browserClient.auth.onAuthStateChange((_event, session) => {
      persistAccessTokenCookie(session?.access_token ?? null);
    });

    void browserClient.auth
      .getSession()
      .then(({ data }) => {
        persistAccessTokenCookie(data.session?.access_token ?? null);
      })
      .catch(() => {
        persistAccessTokenCookie(null);
      });
  }

  return browserClient;
}
