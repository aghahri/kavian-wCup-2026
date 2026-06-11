import type { User } from "@prisma/client";

export function userHasVipAccess(user: User | null): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  if (!user.isVip) return false;
  if (!user.vipUntil) return true;
  return user.vipUntil > new Date();
}
