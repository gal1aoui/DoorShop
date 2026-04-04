import {
  getSupabaseClient,
  persistAccessTokenCookie,
} from "@/services/supabase/client";
import { fail, ok, type ServiceResult } from "@/types/service";

export interface AdminSessionAccess {
  hasSession: boolean;
  isAdmin: boolean;
  userId: string | null;
}

export async function signInAsAdmin(
  email: string,
  password: string,
): Promise<ServiceResult<{ userId: string }>> {
  const supabase = getSupabaseClient();
  const { data: loginData, error: loginError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (loginError || !loginData.user) {
    return fail(loginError?.message ?? "Failed to sign in.");
  }

  const { data: adminRow, error: adminError } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", loginData.user.id)
    .maybeSingle();

  if (adminError || !adminRow) {
    await supabase.auth.signOut();
    persistAccessTokenCookie(null);
    return fail("This account is not an admin account.");
  }

  persistAccessTokenCookie(loginData.session?.access_token ?? null);

  return ok({ userId: loginData.user.id });
}

export async function getCurrentAdminAccess(): Promise<
  ServiceResult<AdminSessionAccess>
> {
  const supabase = getSupabaseClient();
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    return fail(sessionError.message);
  }

  const userId = sessionData.session?.user.id ?? null;
  if (!userId) {
    return ok({
      hasSession: false,
      isAdmin: false,
      userId: null,
    });
  }

  const { data: adminRow, error: adminError } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (adminError) {
    return fail(adminError.message);
  }

  return ok({
    hasSession: true,
    isAdmin: Boolean(adminRow),
    userId,
  });
}

export async function signOutAdmin(): Promise<void> {
  await getSupabaseClient().auth.signOut();
  persistAccessTokenCookie(null);
}
