"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Tournament = {
  id: string;
  slug: string;
  nameFa: string;
  nameEn: string;
  nameAr: string;
  isVip: boolean;
  isActive: boolean;
  _count: { memberships: number; prizes: number };
};

type AdminTournamentManagerProps = {
  initialTournaments: Tournament[];
};

export function AdminTournamentManager({ initialTournaments }: AdminTournamentManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialTournaments);
  const [form, setForm] = useState({
    slug: "",
    nameFa: "",
    nameEn: "",
    nameAr: "",
    isVip: false,
  });

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) return;

    setItems((prev) => [
      { ...data.tournament, _count: { memberships: 0, prizes: 0 } },
      ...prev,
    ]);
    setForm({ slug: "", nameFa: "", nameEn: "", nameAr: "", isVip: false });
    router.refresh();
  }

  async function toggleActive(id: string, isActive: boolean) {
    const response = await fetch(`/api/admin/tournaments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (response.ok) {
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, isActive } : t)));
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"
      >
        <h2 className="mb-4 text-lg font-bold text-white">Create tournament</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="slug (e.g. kavian-vip-league)"
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.isVip}
              onChange={(e) => setForm({ ...form, isVip: e.target.checked })}
            />
            VIP tournament (requires VIP membership)
          </label>
          <input
            value={form.nameFa}
            onChange={(e) => setForm({ ...form, nameFa: e.target.value })}
            placeholder="Name (FA)"
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <input
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            placeholder="Name (EN)"
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <input
            value={form.nameAr}
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
            placeholder="Name (AR)"
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white sm:col-span-2"
          />
        </div>
        <button
          type="submit"
          className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white"
        >
          Create tournament
        </button>
      </form>

      <div className="space-y-3">
        {items.map((tournament) => (
          <article
            key={tournament.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-white">{tournament.nameEn}</h3>
                <p className="text-xs text-white/50">{tournament.slug}</p>
                <p className="mt-1 text-sm text-white/70">
                  {tournament._count.memberships} members · {tournament._count.prizes} prizes
                </p>
              </div>
              <div className="flex gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    tournament.isVip
                      ? "bg-amber-500/20 text-amber-200"
                      : "bg-emerald-500/20 text-emerald-200"
                  }`}
                >
                  {tournament.isVip ? "VIP" : "Free"}
                </span>
                <button
                  type="button"
                  onClick={() => toggleActive(tournament.id, !tournament.isActive)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    tournament.isActive
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {tournament.isActive ? "Active" : "Inactive"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
