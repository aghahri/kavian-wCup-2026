export function getDefaultAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}&backgroundColor=059669,0b1f3a`;
}

type AvatarUser = {
  id: string;
  avatarUrl: string | null;
  updatedAt?: string | Date;
};

export function resolveAvatarUrl(user: AvatarUser): string {
  const base = user.avatarUrl ?? getDefaultAvatarUrl(user.id);

  if (base.includes("?v=")) {
    return base;
  }

  const version = user.updatedAt
    ? new Date(user.updatedAt).getTime()
    : user.id;

  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}v=${version}`;
}
