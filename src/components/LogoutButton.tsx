"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/routing";

type LogoutButtonProps = {
  locale: Locale;
  label: string;
};

export function LogoutButton({ locale, label }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/${locale}`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white transition hover:bg-white/10"
    >
      {label}
    </button>
  );
}
