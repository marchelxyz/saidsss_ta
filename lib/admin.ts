import { getAdminToken } from "./env";

export function getAdminCookieValue(cookieHeader: string | null) {
  if (!cookieHeader) return "";
  const match = cookieHeader.match(/(?:^|; )admin_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function isAdminSession(cookieHeader: string | null) {
  const token = getAdminToken();
  if (!token) return false;
  return getAdminCookieValue(cookieHeader) === token;
}
