import { SignJWT, jwtVerify } from "jose";

export type AuthUser = {
  id: string;
  email?: string | null;
  account_id?: string | null;
  full_name?: string | null;
  user_role?: string | null;
  school?: string | null;
  must_change_password?: boolean;
};

const COOKIE_NAME = "ajs_session";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set.");
  }
  return new TextEncoder().encode(secret);
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }
  const cookies = cookieHeader.split(";").map((value) => value.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.slice(name.length + 1));
    }
  }
  return null;
}

export async function signAuthToken(user: AuthUser) {
  const secret = getAuthSecret();
  return new SignJWT({
    user_role: user.user_role ?? null,
    email: user.email ?? null,
    account_id: user.account_id ?? null,
    full_name: user.full_name ?? null,
    school: user.school ?? null,
    must_change_password: Boolean(user.must_change_password),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setSubject(user.id)
    .setExpirationTime("7d")
    .sign(secret);
}

export async function getAuthUserFromRequest(request: Request) {
  const token = getCookieValue(request.headers.get("cookie"), COOKIE_NAME);
  if (!token) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (!payload.sub) {
      return null;
    }
    return {
      id: String(payload.sub),
      user_role: payload.user_role ? String(payload.user_role) : null,
      email: payload.email ? String(payload.email) : null,
      account_id: payload.account_id ? String(payload.account_id) : null,
      full_name: payload.full_name ? String(payload.full_name) : null,
      school: payload.school ? String(payload.school) : null,
      must_change_password: Boolean(payload.must_change_password),
    } satisfies AuthUser;
  } catch (error) {
    return null;
  }
}

export function getAuthCookieName() {
  return COOKIE_NAME;
}
