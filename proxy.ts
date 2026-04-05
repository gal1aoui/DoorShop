import { type NextRequest, NextResponse } from "next/server";

const ADMIN_LOGIN_PATH = "/admin/login";
const ADMIN_ACCESS_COOKIE = "door-admin-access-token";

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function safeAtob(value: string): string | null {
  try {
    return atob(value);
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(normalized + padding);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = decodeBase64Url(parts[1]);
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseAccessTokenFromCookie(rawCookie: string): string | null {
  const decodedValue = safeDecodeURIComponent(rawCookie);
  if (!decodedValue) {
    return null;
  }

  const payloadValue = decodedValue.startsWith("base64-")
    ? safeAtob(decodedValue.slice(7))
    : decodedValue;
  if (!payloadValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(payloadValue) as unknown;

    if (Array.isArray(parsed) && typeof parsed[0] === "string") {
      return parsed[0];
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "access_token" in parsed &&
      typeof parsed.access_token === "string"
    ) {
      return parsed.access_token;
    }
  } catch {
    if (payloadValue.split(".").length === 3) {
      return payloadValue;
    }
  }

  return null;
}

function getAccessTokenFromRequest(request: NextRequest): string | null {
  const directCookie = request.cookies.get(ADMIN_ACCESS_COOKIE)?.value;
  if (directCookie) {
    return safeDecodeURIComponent(directCookie);
  }

  const allCookies = request.cookies.getAll();
  const singleCookie = allCookies.find(
    (cookie) =>
      cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"),
  );

  if (singleCookie) {
    return parseAccessTokenFromCookie(singleCookie.value);
  }

  const chunkedCookies = allCookies
    .filter(
      (cookie) =>
        cookie.name.startsWith("sb-") && /-auth-token\.\d+$/.test(cookie.name),
    )
    .sort((left, right) => {
      const leftIndex = Number(left.name.split(".").pop() ?? "");
      const rightIndex = Number(right.name.split(".").pop() ?? "");
      return leftIndex - rightIndex;
    });

  if (!chunkedCookies.length) {
    return null;
  }

  return parseAccessTokenFromCookie(
    chunkedCookies.map((item) => item.value).join(""),
  );
}

async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }

  const accessToken = getAccessTokenFromRequest(request);
  if (!accessToken) {
    return false;
  }

  const payload = decodeJwtPayload(accessToken);
  const userId =
    payload && typeof payload.sub === "string" ? payload.sub : null;
  if (!userId) {
    return false;
  }

  const endpoint = new URL("/rest/v1/admin_profiles", supabaseUrl);
  endpoint.searchParams.set("select", "id");
  endpoint.searchParams.set("id", `eq.${userId}`);
  endpoint.searchParams.set("limit", "1");

  try {
    const response = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const rows = (await response.json()) as unknown;
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

function buildLoginRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = ADMIN_LOGIN_PATH;
  url.search = "";
  url.searchParams.set("next", nextPath);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next();
  }

  const adminRequest = await isAdminRequest(request);
  if (!adminRequest) {
    return buildLoginRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
