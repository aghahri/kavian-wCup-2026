import { MatchCard } from "@/components/MatchCard";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function FixturesPage() {
  const user = await getCurrentUser();

  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: "asc" },
  });

  const predictions = user
    ? await prisma.prediction.findMany({
        where: { userId: user.id },
      })
    : [];

  const predictionMap = new Map(predictions.map((p) => [p.matchId, p]));

  const upcoming = matches.filter((m) => !m.isFinished);
  const finished = matches.filter((m) => m.isFinished);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">برنامه بازی‌ها</h1>
        <p className="mt-2 text-sm text-white/70">
          همه بازی‌های جام جهانی ۲۰۲۶ را ببینید و پیش‌بینی کنید
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-emerald-300">بازی‌های آینده</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
            بازی آینده‌ای وجود ندارد
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((match) => (
              <MatchCard
                key={match.id}
                {...match}
                userPrediction={predictionMap.get(match.id) ?? null}
                showPredictLink
              />
            ))}
          </div>
        )}
      </section>

      {finished.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-white/70">بازی‌های تمام‌شده</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {finished.map((match) => (
              <MatchCard
                key={match.id}
                {...match}
                userPrediction={predictionMap.get(match.id) ?? null}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
