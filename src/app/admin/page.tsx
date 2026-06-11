import Link from "next/link";
import { redirect } from "next/navigation";
import { RecalculateButton } from "@/components/RecalculateButton";
import { getCurrentUser } from "@/lib/auth";
import { formatPersianNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/");

  const [matchCount, predictionCount, userCount, finishedCount] = await Promise.all([
    prisma.match.count(),
    prisma.prediction.count(),
    prisma.user.count(),
    prisma.match.count({ where: { isFinished: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">پنل مدیریت کاویان</h1>
        <p className="mt-2 text-sm text-white/70">
          بازی‌ها را مدیریت کن، نتیجه نهایی را وارد کن و پیش‌بینی‌ها را ببین
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "بازی‌ها", value: matchCount },
          { label: "پایان‌یافته", value: finishedCount },
          { label: "پیش‌بینی‌ها", value: predictionCount },
          { label: "کاربران", value: userCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
          >
            <p className="text-2xl font-black text-emerald-300">
              {formatPersianNumber(item.value)}
            </p>
            <p className="mt-1 text-sm text-white/70">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/matches"
          className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 transition hover:bg-emerald-500/20"
        >
          <h2 className="text-lg font-bold text-white">مدیریت بازی‌ها</h2>
          <p className="mt-2 text-sm text-white/70">افزودن، ویرایش و ثبت نتیجه نهایی</p>
        </Link>
        <Link
          href="/admin/predictions"
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 transition hover:bg-amber-500/20"
        >
          <h2 className="text-lg font-bold text-white">مشاهده پیش‌بینی‌ها</h2>
          <p className="mt-2 text-sm text-white/70">همه پیش‌بینی‌های کاربران</p>
        </Link>
      </div>

      <RecalculateButton />
    </div>
  );
}
