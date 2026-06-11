import Link from "next/link";
import { redirect } from "next/navigation";
import { PredictionForm } from "@/components/PredictionForm";
import { getCurrentUser } from "@/lib/auth";
import { isPredictionOpen } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type PredictPageProps = {
  searchParams: Promise<{ match?: string }>;
};

export default async function PredictPage({ searchParams }: PredictPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { match: selectedMatchId } = await searchParams;

  const matches = await prisma.match.findMany({
    where: { isFinished: false },
    orderBy: { kickoffAt: "asc" },
  });

  const openMatches = matches.filter((m) => isPredictionOpen(m.kickoffAt, m.isFinished));

  const predictions = await prisma.prediction.findMany({
    where: { userId: user.id },
  });
  const predictionMap = new Map(predictions.map((p) => [p.matchId, p]));

  const activeMatch =
    openMatches.find((m) => m.id === selectedMatchId) ?? openMatches[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">پیش‌بینی بازی</h1>
        <p className="mt-2 text-sm text-white/70">
          قبل از شروع بازی پیش‌بینی خود را ثبت کنید
        </p>
      </div>

      {openMatches.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-white/70">الان بازی باز برای پیش‌بینی وجود ندارد</p>
          <Link href="/fixtures" className="mt-4 inline-block text-emerald-300 hover:underline">
            مشاهده برنامه بازی‌ها
          </Link>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {openMatches.map((match) => (
              <Link
                key={match.id}
                href={`/predict?match=${match.id}`}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm transition ${
                  activeMatch?.id === match.id
                    ? "bg-emerald-500 text-white"
                    : "bg-white/10 text-white/80 hover:bg-white/15"
                }`}
              >
                {match.homeTeamFa} - {match.awayTeamFa}
              </Link>
            ))}
          </div>

          {activeMatch && (
            <PredictionForm
              matchId={activeMatch.id}
              homeTeamFa={activeMatch.homeTeamFa}
              awayTeamFa={activeMatch.awayTeamFa}
              stage={activeMatch.stage}
              initialHome={predictionMap.get(activeMatch.id)?.homeScore ?? 0}
              initialAway={predictionMap.get(activeMatch.id)?.awayScore ?? 0}
            />
          )}
        </>
      )}
    </div>
  );
}
