"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MatchSourceRow } from "@/lib/admin-match-sources";

type AdminMatchSourcesPanelProps = {
  locale: string;
  missingScore: MatchSourceRow[];
  finishedNotVerified: MatchSourceRow[];
  missingHighlights: MatchSourceRow[];
  missingAiRefresh: MatchSourceRow[];
  labels: {
    edit: string;
    verify: string;
    refresh: string;
  };
};

function MatchOpsRow({
  row,
  locale,
  labels,
  onVerify,
  onRefresh,
}: {
  row: MatchSourceRow;
  locale: string;
  labels: AdminMatchSourcesPanelProps["labels"];
  onVerify?: () => void;
  onRefresh?: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2 text-sm">
      <span className="text-white">
        {row.homeTeamFa} - {row.awayTeamFa}
        {row.homeScore !== null && row.awayScore !== null && (
          <span className="ms-2 text-emerald-300">
            {row.homeScore}-{row.awayScore}
          </span>
        )}
      </span>
      <div className="flex gap-2">
        <Link
          href={`/${locale}/admin/matches`}
          className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
        >
          {labels.edit}
        </Link>
        {onVerify && (
          <button type="button" onClick={onVerify} className="rounded-lg bg-sky-600 px-2 py-1 text-xs text-white">
            {labels.verify}
          </button>
        )}
        {onRefresh && (
          <button type="button" onClick={onRefresh} className="rounded-lg bg-violet-600 px-2 py-1 text-xs text-white">
            {labels.refresh}
          </button>
        )}
      </div>
    </li>
  );
}

export function AdminMatchSourcesPanel({
  locale,
  missingScore,
  finishedNotVerified,
  missingHighlights,
  missingAiRefresh,
  labels,
}: AdminMatchSourcesPanelProps) {
  const router = useRouter();

  async function verifyMatch(id: string) {
    await fetch(`/api/admin/matches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markVerified: true }),
    });
    router.refresh();
  }

  async function refreshMatch(id: string) {
    await fetch(`/api/admin/matches/${id}/refresh`, { method: "POST" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-lg font-bold text-amber-200">بدون نتیجه نهایی ({missingScore.length})</h2>
        {missingScore.length === 0 ? (
          <p className="text-sm text-white/50">همه بازی‌های گذشته نتیجه دارند.</p>
        ) : (
          <ul className="space-y-2">
            {missingScore.map((row) => (
              <MatchOpsRow key={row.id} row={row} locale={locale} labels={labels} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-sky-200">تمام‌شده اما تأیید نشده ({finishedNotVerified.length})</h2>
        {finishedNotVerified.length === 0 ? (
          <p className="text-sm text-white/50">همه نتایج تأیید شده‌اند.</p>
        ) : (
          <ul className="space-y-2">
            {finishedNotVerified.map((row) => (
              <MatchOpsRow
                key={row.id}
                row={row}
                locale={locale}
                labels={labels}
                onVerify={() => verifyMatch(row.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-amber-200">بدون خلاصه ویدیو ({missingHighlights.length})</h2>
        {missingHighlights.length === 0 ? (
          <p className="text-sm text-white/50">همه بازی‌های تمام‌شده خلاصه دارند یا لینک دارند.</p>
        ) : (
          <ul className="space-y-2">
            {missingHighlights.slice(0, 15).map((row) => (
              <MatchOpsRow key={row.id} row={row} locale={locale} labels={labels} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-violet-200">نیاز به به‌روزرسانی AI ({missingAiRefresh.length})</h2>
        {missingAiRefresh.length === 0 ? (
          <p className="text-sm text-white/50">تحلیل AI به‌روز است.</p>
        ) : (
          <ul className="space-y-2">
            {missingAiRefresh.map((row) => (
              <MatchOpsRow
                key={row.id}
                row={row}
                locale={locale}
                labels={labels}
                onRefresh={() => refreshMatch(row.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
