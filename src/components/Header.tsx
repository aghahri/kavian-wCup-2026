import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

const links = [
  { href: "/", label: "خانه" },
  { href: "/fixtures", label: "بازی‌ها" },
  { href: "/predict", label: "پیش‌بینی" },
  { href: "/leaderboard", label: "جدول امتیازات" },
];

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1f3a]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="text-2xl" aria-hidden>
            ⚽
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">کاویان</p>
            <p className="truncate text-xs text-emerald-300">جام جهانی ۲۰۲۶</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          {user?.isAdmin && (
            <Link
              href="/admin"
              className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/30"
            >
              مدیریت
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-white/80 md:inline">
                سلام، {user.name}
              </span>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white transition hover:bg-white/10"
                >
                  خروج
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-400"
            >
              ورود
            </Link>
          )}
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 sm:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/90"
          >
            {link.label}
          </Link>
        ))}
        {user?.isAdmin && (
          <Link
            href="/admin"
            className="shrink-0 rounded-lg bg-amber-500/20 px-3 py-2 text-xs text-amber-200"
          >
            مدیریت
          </Link>
        )}
      </nav>
    </header>
  );
}
