import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPersianNumber } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPredictionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/");

  const predictions = await prisma.prediction.findMany({
    include: {
      user: { select: { name: true, phone: true } },
      match: {
        select: {
          homeTeamFa: true,
          awayTeamFa: true,
          homeScore: true,
          awayScore: true,
          isFinished: true,
          kickoffAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">پیش‌بینی‌های کاربران</h1>
          <p className="mt-1 text-sm text-white/70">
            {formatPersianNumber(predictions.length)} پیش‌بینی ثبت شده
          </p>
        </div>
        <Link href="/admin" className="text-sm text-emerald-300 hover:underline">
          بازگشت
        </Link>
      </div>

      <div className="space-y-3">
        {predictions.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
            هنوز پیش‌بینی‌ای ثبت نشده
          </p>
        ) : (
          predictions.map((prediction) => (
            <article
              key={prediction.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-white">{prediction.user.name}</p>
                  <p className="text-xs text-white/50" dir="ltr">
                    {prediction.user.phone}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    prediction.match.isFinished
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-amber-500/20 text-amber-200"
                  }`}
                >
                  {prediction.match.isFinished ? "تمام‌شده" : "در انتظار"}
                </span>
              </div>

              <p className="mt-3 text-sm text-white/80">
                {prediction.match.homeTeamFa} - {prediction.match.awayTeamFa}
              </p>

              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <span className="text-white">
                  پیش‌بینی:{" "}
                  <strong>
                    {prediction.homeScore} - {prediction.awayScore}
                  </strong>
                </span>
                {prediction.match.isFinished &&
                  prediction.match.homeScore !== null &&
                  prediction.match.awayScore !== null && (
                    <>
                      <span className="text-white/60">
                        نتیجه واقعی: {prediction.match.homeScore} -{" "}
                        {prediction.match.awayScore}
                      </span>
                      <span className="font-bold text-emerald-300">
                        {formatPersianNumber(prediction.points)} امتیاز
                      </span>
                    </>
                  )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
