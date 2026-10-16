import { pbkdf2, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const derive = promisify(pbkdf2);
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export async function verifyLegacyPassword(
  password: string,
  salt: string,
  hash: string,
) {
  if (!/^[a-f0-9]{64}$/i.test(salt) || !/^[a-f0-9]{1024}$/i.test(hash))
    return false;
  const candidate = await derive(password, salt, 25000, 512, "sha256");
  return timingSafeEqual(candidate, Buffer.from(hash, "hex"));
}
export function safeStaffRedirect(path?: string) {
  if (
    !path ||
    /[\\\r\n]/.test(path) ||
    !/^\/admin\/(CRM|evaluations)(?:[/?]|$)/.test(path)
  )
    return "/admin/CRM";
  const url = new URL(path, "https://staff.invalid");
  return /^\/admin\/(CRM|evaluations)(?:\/|$)/.test(url.pathname)
    ? url.pathname + url.search
    : "/admin/CRM";
}
