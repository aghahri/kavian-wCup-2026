import type { User } from "@prisma/client";

export type ClientUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  isVip: boolean;
  updatedAt: string;
};

export function toClientUser(user: User): ClientUser {
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    isAdmin: user.isAdmin,
    isVip: user.isVip,
    updatedAt: user.updatedAt.toISOString(),
  };
}
