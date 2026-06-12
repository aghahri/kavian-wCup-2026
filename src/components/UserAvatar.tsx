"use client";

import { resolveAvatarUrl } from "@/lib/avatar";

type UserAvatarProps = {
  user: { id: string; name: string; avatarUrl?: string | null; updatedAt?: string | Date };
  size?: number;
  className?: string;
};

export function UserAvatar({ user, size = 40, className = "" }: UserAvatarProps) {
  const src = resolveAvatarUrl({
    id: user.id,
    avatarUrl: user.avatarUrl ?? null,
    updatedAt: user.updatedAt,
  });
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-emerald-500/20 ring-2 ring-white/10 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={user.name}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = "none";
          const fallback = el.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <span
        className="absolute inset-0 hidden items-center justify-center text-sm font-bold text-emerald-200"
        aria-hidden
      >
        {initial}
      </span>
    </div>
  );
}
