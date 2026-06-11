import Link from "next/link";
import { MatchCard } from "@/components/MatchCard";
import { getCurrentUser } from "@/lib/auth";
import { formatPersianNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const user = await getCurrentUser();

  const [upcomingMatches, topPlayers, totalPredictions, totalMatches] = await Promise.all([
    prisma.match.findMany({
      where: { isFinished: false },
      orderBy: { kickoffAt: "asc" },
      take: 3,
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        predictions: { select: { points: true } },
      },
    }),
    prisma.prediction.count(),
    prisma.match.count(),
  ]);

  const leaderboard = topPlayers
    .map((player) => ({
      id: player.id,
      name: player.name,
      total: player.predictions.reduce((sum, p) => sum + p.points, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-600/30 via-[#0b1f3a] to-[#071526] p-6 shadow-2xl sm:p-10">
        <p className="mb-2 text-sm font-medium text-emerald-200">به مسابقه خوش آمدید</p>
        <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">
          کاویان
          <span className="block text-emerald-300">جام جهانی ۲۰۲۶</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
          بازی‌ها را پیش‌بینی کن، با دوستانت رقابت کن و ببین چه کسی بهترین پیش‌بینی‌کننده
          جام جهانی است!
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/predict"
            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-400"
          >
            شروع پیش‌بینی
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            جدول امتیازات
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-2xl font-black text-emerald-300">
            {formatPersianNumber(totalMatches)}
          </p>
          <p className="mt-1 text-sm text-white/70">بازی نمونه</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-2xl font-black text-emerald-300">
            {formatPersianNumber(totalPredictions)}
          </p>
          <p className="mt-1 text-sm text-white/70">پیش‌بینی ثبت‌شده</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-2xl font-black text-emerald-300">
            {user ? "✓" : "؟"}
          </p>
          <p className="mt-1 text-sm text-white/70">
            {user ? `وارد شده: ${user.name}` : "هنوز وارد نشده‌اید"}
          </p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">بازی‌های نزدیک</h2>
          <Link href="/fixtures" className="text-sm text-emerald-300 hover:underline">
            همه بازی‌ها
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingMatches.map((match) => (
            <MatchCard key={match.id} {...match} showPredictLink />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">برترین‌ها</h2>
          <Link href="/leaderboard" className="text-sm text-emerald-300 hover:underline">
            جدول کامل
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {leaderboard.length === 0 ? (
            <p className="p-4 text-center text-sm text-white/60">هنوز امتیازی ثبت نشده</p>
          ) : (
            <ul>
              {leaderboard.map((player, index) => (
                <li
                  key={player.id}
                  className="flex items-center justify-between border-b border-white/5 px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-200">
                      {formatPersianNumber(index + 1)}
                    </span>
                    <span className="font-medium text-white">{player.name}</span>
                  </div>
                  <span className="font-bold text-emerald-300">
                    {formatPersianNumber(player.total)} امتیاز
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
