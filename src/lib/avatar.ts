export function getDefaultAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}&backgroundColor=059669,0b1f3a`;
}

export function resolveAvatarUrl(user: { id: string; avatarUrl: string | null }): string {
  return user.avatarUrl ?? getDefaultAvatarUrl(user.id);
}
