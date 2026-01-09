import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";

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

function getIdleTimeoutSeconds() {
  const raw = process.env.AUTH_IDLE_TIMEOUT_SECONDS;
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 30 * 60;
  }
  return parsed;
}

async function refreshSessionCookie(payload: Record<string, unknown>) {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({
    user_role: payload.user_role ?? null,
    email: payload.email ?? null,
    account_id: payload.account_id ?? null,
    full_name: payload.full_name ?? null,
    school: payload.school ?? null,
    must_change_password: Boolean(payload.must_change_password),
    last_active: now,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setSubject(String(payload.sub ?? ""))
    .setExpirationTime("7d")
    .sign(getSecret());
  return { token, now };
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
      const response = NextResponse.json(
        { ok: false, message: "Unauthorized." },
        { status: 401 }
      );
      response.cookies.set("ajs_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const response = NextResponse.redirect(url);
    response.cookies.set("ajs_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.user_role ? String(payload.user_role) : "";
    const mustChange = Boolean(payload.must_change_password);
    const lastActive =
      typeof payload.last_active === "number"
        ? payload.last_active
        : typeof payload.iat === "number"
          ? payload.iat
          : 0;
    const now = Math.floor(Date.now() / 1000);
    const idleSeconds = getIdleTimeoutSeconds();

    if (lastActive && now - lastActive > idleSeconds) {
      if (pathname.startsWith("/api")) {
        const response = NextResponse.json(
          { ok: false, message: "Session expired." },
          { status: 401 }
        );
        response.cookies.set("ajs_session", "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });
        return response;
      }
      const url = request.nextUrl.clone();
      url.pathname = "/";
      const response = NextResponse.redirect(url);
      response.cookies.set("ajs_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    if (mustChange === false && pathname !== "/change-password") {
      const url = request.nextUrl.clone();
      url.pathname = "/change-password";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/super-admin") && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      const response = NextResponse.redirect(url);
      response.cookies.set("ajs_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    if (pathname.startsWith("/teacher") && role !== "teacher") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      const response = NextResponse.redirect(url);
      response.cookies.set("ajs_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const nextResponse = NextResponse.next();
    const refreshed = await refreshSessionCookie(payload);
    nextResponse.cookies.set("ajs_session", refreshed.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return nextResponse;
  } catch (error) {
    if (pathname.startsWith("/api")) {
      const response = NextResponse.json(
        { ok: false, message: "Unauthorized." },
        { status: 401 }
      );
      response.cookies.set("ajs_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const response = NextResponse.redirect(url);
    response.cookies.set("ajs_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
