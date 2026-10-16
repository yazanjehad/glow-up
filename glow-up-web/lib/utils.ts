import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const USED_COUPON_CODES_KEY = "usedCouponCodes";

export function getUsedCouponCodes(): string[] {
  try {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(USED_COUPON_CODES_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((c: unknown) => String(c).toUpperCase().trim()) : [];
  } catch {
    return [];
  }
}

export function markCouponCodeAsUsed(code: string) {
  const normalized = String(code).toUpperCase().trim();
  if (!normalized) return;
  const codes = getUsedCouponCodes();
  if (codes.includes(normalized)) return;
  sessionStorage.setItem(USED_COUPON_CODES_KEY, JSON.stringify([...codes, normalized]));
}

const USED_USER_PACKAGE_IDS_BY_USER_KEY = "usedUserPackageIdsByUser";

export function getUsedUserPackageIds(userId: string | null): string[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(USED_USER_PACKAGE_IDS_BY_USER_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, string[]>;
    const ids = map[userId];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function markUserPackageAsUsed(userId: string | null, userPackageId: string): void {
  if (typeof window === "undefined" || !userId || !userPackageId) return;
  try {
    const raw = localStorage.getItem(USED_USER_PACKAGE_IDS_BY_USER_KEY);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    const ids = map[userId] ?? [];
    if (ids.includes(userPackageId)) return;
    map[userId] = [...ids, userPackageId];
    localStorage.setItem(USED_USER_PACKAGE_IDS_BY_USER_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function clearBookingSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(USED_COUPON_CODES_KEY);
}
