import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type TrashLine = { text: string; emoji: string };

function pickLines(
  members: { name: string; points: number; exact: number; streak: number }[],
  locale: Locale
): TrashLine[] {
  const lines: TrashLine[] = [];
  const worst = [...members].sort((a, b) => a.points - b.points)[0];
  const best = [...members].sort((a, b) => b.points - a.points)[0];
  const hot = members.find((m) => m.streak >= 3);

  if (worst && worst.points === 0 && members.length > 2) {
    lines.push({
      emoji: "😄",
      text:
        locale === "fa"
          ? `${worst.name} هنوز هیچ نتیجه‌ای را درست نزده!`
          : locale === "ar"
            ? `${worst.name} لم يُصِب أي نتيجة بعد!`
            : `${worst.name} hasn't nailed a result yet!`,
    });
  }

  if (hot) {
    lines.push({
      emoji: "🔥",
      text:
        locale === "fa"
          ? `${hot.name} سه بازی پشت سر هم درست پیش‌بینی کرده!`
          : locale === "ar"
            ? `${hot.name} أصاب ثلاث مباريات متتالية!`
            : `${hot.name} nailed three picks in a row!`,
    });
  }

  if (best && best.points > 10) {
    lines.push({
      emoji: "👑",
      text:
        locale === "fa"
          ? `${best.name} الان پادشاه پیش‌بینی این لیگه است.`
          : locale === "ar"
            ? `${best.name} ملك التوقعات في هذا الدوري.`
            : `${best.name} is the prediction king of this league.`,
    });
  }

  lines.push({
    emoji: "😅",
    text:
      locale === "fa"
        ? "همه فکر می‌کردند بازی راحت است — جام جهانی غافلگیرکننده است!"
        : locale === "ar"
          ? "الجميع ظنّوا أنها مباراة سهلة — كأس العالم مفاجئ!"
          : "Everyone thought it was easy — the World Cup loves surprises!",
  });

  return lines.slice(0, 4);
}

async function buildMemberStats(leagueId: string) {
  const members = await prisma.privateLeagueMember.findMany({
    where: { leagueId },
    include: { user: { select: { name: true } } },
  });

  const stats = await Promise.all(
    members.map(async (m) => {
      const preds = await prisma.prediction.findMany({
        where: { userId: m.userId },
        select: { points: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      });
      const points = preds.reduce((s, p) => s + p.points, 0);
      const exact = preds.filter((p) => p.points === 5).length;
      let streak = 0;
      for (const p of preds) {
        if (p.points > 0) streak++;
        else break;
      }
      return { name: m.user.name, points, exact, streak };
    })
  );

  return stats;
}

export async function regenerateLeagueTrashTalk(leagueId: string) {
  const stats = await buildMemberStats(leagueId);
  const fa = pickLines(stats, "fa");
  const en = pickLines(stats, "en");
  const ar = pickLines(stats, "ar");

  return prisma.leagueTrashTalk.upsert({
    where: { leagueId },
    create: {
      leagueId,
      linesFa: JSON.stringify(fa),
      linesEn: JSON.stringify(en),
      linesAr: JSON.stringify(ar),
    },
    update: {
      linesFa: JSON.stringify(fa),
      linesEn: JSON.stringify(en),
      linesAr: JSON.stringify(ar),
    },
  });
}

export async function getLeagueTrashTalk(leagueId: string, locale: Locale): Promise<TrashLine[]> {
  let row = await prisma.leagueTrashTalk.findUnique({ where: { leagueId } });
  if (!row) {
    row = await regenerateLeagueTrashTalk(leagueId);
  }

  const raw =
    locale === "en" ? row.linesEn : locale === "ar" ? row.linesAr : row.linesFa;
  try {
    return JSON.parse(raw ?? row.linesFa) as TrashLine[];
  } catch {
    return [];
  }
}

export async function refreshTrashTalkForMatch(matchId: string) {
  const predictions = await prisma.prediction.findMany({
    where: { matchId },
    select: { userId: true },
  });
  const userIds = [...new Set(predictions.map((p) => p.userId))];
  if (userIds.length === 0) return;

  const leagues = await prisma.privateLeagueMember.findMany({
    where: { userId: { in: userIds } },
    select: { leagueId: true },
  });
  const leagueIds = [...new Set(leagues.map((l) => l.leagueId))];
  await Promise.all(leagueIds.map((id) => regenerateLeagueTrashTalk(id)));
}
