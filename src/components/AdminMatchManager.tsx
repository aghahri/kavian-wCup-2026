"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { AdminMatchEvents } from "@/components/AdminMatchEvents";
import { getAllTeams, getTeamLocalizedSlot } from "@/lib/teams";

type MatchEventRow = {
  id: string;
  minute: number | null;
  type: string;
  teamName: string | null;
  playerName: string | null;
  descriptionFa: string | null;
};

type AdminMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamFa: string;
  awayTeamFa: string;
  homeTeamAr?: string | null;
  awayTeamAr?: string | null;
  stage: string;
  kickoffAt: string | Date;
  homeScore: number | null;
  awayScore: number | null;
  isFinished: boolean;
  scoreSourceName?: string | null;
  scoreSourceUrl?: string | null;
  scoreVerifiedAt?: string | Date | null;
  externalMatchId?: string | null;
  highlightsUrl?: string | null;
  highlightsProvider?: string | null;
  highlightsEmbedUrl?: string | null;
  events?: MatchEventRow[];
  _count: { predictions: number };
};

type AdminMatchManagerProps = {
  initialMatches: AdminMatch[];
};

const TEAM_OPTIONS = getAllTeams()
  .slice()
  .sort((a, b) => a.countryName.localeCompare(b.countryName));

function toLocalInputValue(date: string | Date): string {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function TeamQuickReplace({
  label,
  value,
  onSelect,
}: {
  label: string;
  value: string;
  onSelect: (slot: { en: string; fa: string; ar: string }) => void;
}) {
  return (
    <label className="block text-xs text-white/60">
      <span className="mb-1 block">{label}</span>
      <select
        value=""
        onChange={(e) => {
          const team = TEAM_OPTIONS.find((t) => t.fifaCode === e.target.value);
          if (team) onSelect(getTeamLocalizedSlot(team));
        }}
        className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
      >
        <option value="">{value ? `جایگزین: ${value}` : "انتخاب تیم…"}</option>
        {TEAM_OPTIONS.map((team) => (
          <option key={team.fifaCode} value={team.fifaCode}>
            {team.countryName}
            {team.nameFa ? ` — ${team.nameFa}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdminMatchManager({ initialMatches }: AdminMatchManagerProps) {
  const router = useRouter();
  const [matches, setMatches] = useState(initialMatches);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [newMatch, setNewMatch] = useState({
    homeTeam: "",
    awayTeam: "",
    homeTeamFa: "",
    awayTeamFa: "",
    homeTeamAr: "",
    awayTeamAr: "",
    stage: "گروه A",
    kickoffAt: "",
  });

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    const response = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMatch),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "خطا در ایجاد بازی");
      return;
    }

    setMatches((prev) => [...prev, { ...data.match, _count: { predictions: 0 } }]);
    setNewMatch({
      homeTeam: "",
      awayTeam: "",
      homeTeamFa: "",
      awayTeamFa: "",
      homeTeamAr: "",
      awayTeamAr: "",
      stage: "گروه A",
      kickoffAt: "",
    });
    setMessage("بازی جدید اضافه شد");
    router.refresh();
  }

  async function updateMatch(
    id: string,
    patch: Partial<AdminMatch> & {
      homeScore?: number | null;
      awayScore?: number | null;
      markVerified?: boolean;
    }
  ) {
    setError("");
    const response = await fetch(`/api/admin/matches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "خطا در ویرایش");
      return;
    }

    setMatches((prev) =>
      prev.map((match) =>
        match.id === id ? { ...match, ...data.match, _count: match._count } : match
      )
    );
    setMessage("بازی به‌روزرسانی شد");
    router.refresh();
  }

  async function deleteMatch(id: string) {
    if (!confirm("این بازی حذف شود؟")) return;

    const response = await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "خطا در حذف");
      return;
    }

    setMatches((prev) => prev.filter((match) => match.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"
      >
        <h2 className="mb-4 text-lg font-bold text-white">افزودن بازی جدید</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <TeamQuickReplace
            label="تیم میزبان — انتخاب سریع"
            value={newMatch.homeTeam}
            onSelect={(slot) =>
              setNewMatch({
                ...newMatch,
                homeTeam: slot.en,
                homeTeamFa: slot.fa,
                homeTeamAr: slot.ar,
              })
            }
          />
          <TeamQuickReplace
            label="تیم مهمان — انتخاب سریع"
            value={newMatch.awayTeam}
            onSelect={(slot) =>
              setNewMatch({
                ...newMatch,
                awayTeam: slot.en,
                awayTeamFa: slot.fa,
                awayTeamAr: slot.ar,
              })
            }
          />
          <input
            placeholder="تیم میزبان (انگلیسی)"
            value={newMatch.homeTeam}
            onChange={(e) => setNewMatch({ ...newMatch, homeTeam: e.target.value })}
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <input
            placeholder="تیم مهمان (انگلیسی)"
            value={newMatch.awayTeam}
            onChange={(e) => setNewMatch({ ...newMatch, awayTeam: e.target.value })}
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <input
            placeholder="تیم میزبان (فارسی)"
            value={newMatch.homeTeamFa}
            onChange={(e) => setNewMatch({ ...newMatch, homeTeamFa: e.target.value })}
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <input
            placeholder="تیم مهمان (فارسی)"
            value={newMatch.awayTeamFa}
            onChange={(e) => setNewMatch({ ...newMatch, awayTeamFa: e.target.value })}
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <input
            placeholder="مرحله (مثلاً گروه A)"
            value={newMatch.stage}
            onChange={(e) => setNewMatch({ ...newMatch, stage: e.target.value })}
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <input
            type="datetime-local"
            value={newMatch.kickoffAt}
            onChange={(e) => setNewMatch({ ...newMatch, kickoffAt: e.target.value })}
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
        </div>
        <button
          type="submit"
          className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-400"
        >
          افزودن بازی
        </button>
      </form>

      {message && (
        <p className="rounded-xl bg-emerald-500/20 px-4 py-3 text-sm text-emerald-200">{message}</p>
      )}
      {error && (
        <p className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-200">{error}</p>
      )}

      <div className="space-y-4">
        {matches.map((match) => (
          <MatchEditor
            key={match.id}
            match={match}
            onUpdate={updateMatch}
            onDelete={deleteMatch}
          />
        ))}
      </div>
    </div>
  );
}

function MatchEditor({
  match,
  onUpdate,
  onDelete,
}: {
  match: AdminMatch;
  onUpdate: (
    id: string,
    patch: Partial<AdminMatch> & {
      homeScore?: number | null;
      awayScore?: number | null;
      markVerified?: boolean;
    }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [homeTeam, setHomeTeam] = useState(match.homeTeam);
  const [awayTeam, setAwayTeam] = useState(match.awayTeam);
  const [homeTeamFa, setHomeTeamFa] = useState(match.homeTeamFa);
  const [awayTeamFa, setAwayTeamFa] = useState(match.awayTeamFa);
  const [homeTeamAr, setHomeTeamAr] = useState(match.homeTeamAr ?? "");
  const [awayTeamAr, setAwayTeamAr] = useState(match.awayTeamAr ?? "");
  const [stage, setStage] = useState(match.stage);
  const [kickoffAt, setKickoffAt] = useState(toLocalInputValue(match.kickoffAt));
  const [homeScore, setHomeScore] = useState(match.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(match.awayScore ?? 0);
  const [isFinished, setIsFinished] = useState(match.isFinished);
  const [scoreSourceName, setScoreSourceName] = useState(match.scoreSourceName ?? "");
  const [scoreSourceUrl, setScoreSourceUrl] = useState(match.scoreSourceUrl ?? "");
  const [externalMatchId, setExternalMatchId] = useState(match.externalMatchId ?? "");
  const [highlightsUrl, setHighlightsUrl] = useState(match.highlightsUrl ?? "");
  const [highlightsProvider, setHighlightsProvider] = useState(match.highlightsProvider ?? "");
  const [highlightsEmbedUrl, setHighlightsEmbedUrl] = useState(match.highlightsEmbedUrl ?? "");
  const isVerified = Boolean(match.scoreVerifiedAt);

  const title = useMemo(
    () => `${homeTeamFa || match.homeTeamFa} - ${awayTeamFa || match.awayTeamFa}`,
    [homeTeamFa, awayTeamFa, match.homeTeamFa, match.awayTeamFa]
  );

  function applyHomeTeam(slot: { en: string; fa: string; ar: string }) {
    setHomeTeam(slot.en);
    setHomeTeamFa(slot.fa);
    setHomeTeamAr(slot.ar);
  }

  function applyAwayTeam(slot: { en: string; fa: string; ar: string }) {
    setAwayTeam(slot.en);
    setAwayTeamFa(slot.fa);
    setAwayTeamAr(slot.ar);
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-white">{title}</h3>
        <span className="text-xs text-white/50">
          {match._count.predictions} پیش‌بینی
        </span>
      </div>

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <TeamQuickReplace label="جایگزینی تیم میزبان" value={homeTeam} onSelect={applyHomeTeam} />
        <TeamQuickReplace label="جایگزینی تیم مهمان" value={awayTeam} onSelect={applyAwayTeam} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={homeTeam}
          onChange={(e) => setHomeTeam(e.target.value)}
          placeholder="میزبان (EN)"
          className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
        />
        <input
          value={awayTeam}
          onChange={(e) => setAwayTeam(e.target.value)}
          placeholder="مهمان (EN)"
          className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
        />
        <input
          value={homeTeamFa}
          onChange={(e) => setHomeTeamFa(e.target.value)}
          placeholder="میزبان (FA)"
          className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
        />
        <input
          value={awayTeamFa}
          onChange={(e) => setAwayTeamFa(e.target.value)}
          placeholder="مهمان (FA)"
          className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
        />
        <input
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
        />
        <input
          type="datetime-local"
          value={kickoffAt}
          onChange={(e) => setKickoffAt(e.target.value)}
          className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
        />
      </div>

      <div className="mt-4 rounded-xl bg-black/20 p-3">
        <p className="mb-2 text-sm font-medium text-white/80">نتیجه نهایی</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="number"
            min={0}
            max={20}
            value={homeScore}
            onChange={(e) => setHomeScore(Number(e.target.value))}
            className="w-16 rounded-lg border border-white/20 bg-black/30 px-2 py-2 text-center text-white"
          />
          <span className="text-white/50">-</span>
          <input
            type="number"
            min={0}
            max={20}
            value={awayScore}
            onChange={(e) => setAwayScore(Number(e.target.value))}
            className="w-16 rounded-lg border border-white/20 bg-black/30 px-2 py-2 text-center text-white"
          />
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={isFinished}
              onChange={(e) => setIsFinished(e.target.checked)}
            />
            بازی تمام شد
          </label>
          {isVerified && (
            <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-200">✓ تأیید شده</span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="mb-2 text-sm font-medium text-white/80">منبع نتیجه و خلاصه</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            placeholder="نام منبع (مثلاً FIFA)"
            value={scoreSourceName}
            onChange={(e) => setScoreSourceName(e.target.value)}
            className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white"
          />
          <input
            placeholder="لینک منبع نتیجه"
            value={scoreSourceUrl}
            onChange={(e) => setScoreSourceUrl(e.target.value)}
            className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white"
          />
          <input
            placeholder="External Match ID"
            value={externalMatchId}
            onChange={(e) => setExternalMatchId(e.target.value)}
            className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white"
          />
          <input
            placeholder="ارائه‌دهنده خلاصه"
            value={highlightsProvider}
            onChange={(e) => setHighlightsProvider(e.target.value)}
            className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white"
          />
          <input
            placeholder="لینک خلاصه (YouTube/FIFA)"
            value={highlightsUrl}
            onChange={(e) => setHighlightsUrl(e.target.value)}
            className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white sm:col-span-2"
          />
          <input
            placeholder="Embed URL (YouTube iframe)"
            value={highlightsEmbedUrl}
            onChange={(e) => setHighlightsEmbedUrl(e.target.value)}
            className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white sm:col-span-2"
          />
        </div>
      </div>

      <AdminMatchEvents matchId={match.id} initialEvents={match.events ?? []} />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onUpdate(match.id, {
              homeTeam,
              awayTeam,
              homeTeamFa,
              awayTeamFa,
              homeTeamAr: homeTeamAr || null,
              awayTeamAr: awayTeamAr || null,
              stage,
              kickoffAt,
              homeScore,
              awayScore,
              isFinished,
              scoreSourceName: scoreSourceName || null,
              scoreSourceUrl: scoreSourceUrl || null,
              externalMatchId: externalMatchId || null,
              highlightsUrl: highlightsUrl || null,
              highlightsProvider: highlightsProvider || null,
              highlightsEmbedUrl: highlightsEmbedUrl || null,
            })
          }
          className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-400"
        >
          ذخیره تغییرات
        </button>
        {isFinished && !isVerified && (
          <button
            type="button"
            onClick={() =>
              onUpdate(match.id, {
                homeScore,
                awayScore,
                isFinished: true,
                scoreSourceName: scoreSourceName || null,
                scoreSourceUrl: scoreSourceUrl || null,
                markVerified: true,
              })
            }
            className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-500"
          >
            تأیید نتیجه
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(match.id)}
          className="rounded-lg border border-red-400/40 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10"
        >
          حذف
        </button>
      </div>
    </article>
  );
}
