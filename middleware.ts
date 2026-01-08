import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = new Set([
  "/",
  "/reset-password",
]);

const PUBLIC_API_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
]);

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set.");
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname) || PUBLIC_API_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("ajs_session")?.value;
  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized." },
        { status: 401 }
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.user_role ? String(payload.user_role) : "";
    const mustChange = Boolean(payload.must_change_password);

    if (mustChange === false && pathname !== "/change-password") {
      const url = request.nextUrl.clone();
      url.pathname = "/change-password";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/super-admin") && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/teacher") && role !== "teacher") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized." },
        { status: 401 }
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
