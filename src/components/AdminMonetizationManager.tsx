"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Ad = {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string | null;
  placement: string;
  locale: string | null;
  isActive: boolean;
  sortOrder: number;
};

type Prize = {
  id: string;
  tournamentId: string | null;
  titleFa: string;
  titleEn: string;
  titleAr: string;
  sponsorName: string | null;
  rankFrom: number;
  rankTo: number;
  isActive: boolean;
};

type PaymentSettings = {
  id: string;
  paymentsEnabled: boolean;
  vipPaymentsEnabled: boolean;
  providerName: string;
  currency: string;
  vipPriceLabel: string;
  notes: string | null;
};

type AdminMonetizationManagerProps = {
  initialAds: Ad[];
  initialPrizes: Prize[];
  initialSettings: PaymentSettings;
  tournaments: Array<{ id: string; nameEn: string; slug: string }>;
};

export function AdminMonetizationManager({
  initialAds,
  initialPrizes,
  initialSettings,
  tournaments,
}: AdminMonetizationManagerProps) {
  const router = useRouter();
  const [ads, setAds] = useState(initialAds);
  const [prizes, setPrizes] = useState(initialPrizes);
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");

  const [adForm, setAdForm] = useState({
    title: "",
    linkUrl: "",
    placement: "home_top",
    locale: "",
  });

  const [prizeForm, setPrizeForm] = useState({
    titleFa: "",
    titleEn: "",
    titleAr: "",
    sponsorName: "",
    tournamentId: "",
    rankFrom: 1,
    rankTo: 1,
  });

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/payment-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (response.ok) {
      setMessage("Payment settings saved (placeholder — no gateway connected)");
      router.refresh();
    }
  }

  async function createAd(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...adForm, locale: adForm.locale || null }),
    });
    const data = await response.json();
    if (response.ok) {
      setAds((prev) => [...prev, data.ad]);
      setAdForm({ title: "", linkUrl: "", placement: "home_top", locale: "" });
      router.refresh();
    }
  }

  async function createPrize(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/prizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...prizeForm,
        tournamentId: prizeForm.tournamentId || null,
        sponsorName: prizeForm.sponsorName || null,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setPrizes((prev) => [...prev, data.prize]);
      setPrizeForm({
        titleFa: "",
        titleEn: "",
        titleAr: "",
        sponsorName: "",
        tournamentId: "",
        rankFrom: 1,
        rankTo: 1,
      });
      router.refresh();
    }
  }

  async function toggleAd(id: string, isActive: boolean) {
    const response = await fetch(`/api/admin/ads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (response.ok) {
      setAds((prev) => prev.map((a) => (a.id === id ? { ...a, isActive } : a)));
    }
  }

  return (
    <div className="space-y-8">
      {message && <p className="rounded-xl bg-emerald-500/20 px-4 py-3 text-sm text-emerald-200">{message}</p>}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Payment settings (placeholder)</h2>
        <form onSubmit={saveSettings} className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={settings.paymentsEnabled}
              onChange={(e) => setSettings({ ...settings, paymentsEnabled: e.target.checked })}
            />
            Payments enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={settings.vipPaymentsEnabled}
              onChange={(e) =>
                setSettings({ ...settings, vipPaymentsEnabled: e.target.checked })
              }
            />
            VIP payments enabled
          </label>
          <input
            value={settings.providerName}
            onChange={(e) => setSettings({ ...settings, providerName: e.target.value })}
            placeholder="Provider name"
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <input
            value={settings.currency}
            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            placeholder="Currency"
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <input
            value={settings.vipPriceLabel}
            onChange={(e) => setSettings({ ...settings, vipPriceLabel: e.target.value })}
            placeholder="VIP price label"
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white sm:col-span-2"
          />
          <textarea
            value={settings.notes ?? ""}
            onChange={(e) => setSettings({ ...settings, notes: e.target.value })}
            placeholder="Admin notes"
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white sm:col-span-2"
          />
          <button
            type="submit"
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white sm:col-span-2"
          >
            Save payment settings
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Ad banners</h2>
        <form onSubmit={createAd} className="mb-4 grid gap-3 sm:grid-cols-2">
          <input
            value={adForm.title}
            onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
            placeholder="Ad title"
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <input
            value={adForm.linkUrl}
            onChange={(e) => setAdForm({ ...adForm, linkUrl: e.target.value })}
            placeholder="Link URL"
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <select
            value={adForm.placement}
            onChange={(e) => setAdForm({ ...adForm, placement: e.target.value })}
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          >
            <option value="home_top">home_top</option>
            <option value="fixtures_sidebar">fixtures_sidebar</option>
          </select>
          <select
            value={adForm.locale}
            onChange={(e) => setAdForm({ ...adForm, locale: e.target.value })}
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          >
            <option value="">All locales</option>
            <option value="fa">fa</option>
            <option value="en">en</option>
            <option value="ar">ar</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white sm:col-span-2"
          >
            Add ad banner
          </button>
        </form>
        <div className="space-y-2">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="flex items-center justify-between rounded-xl border border-white/10 p-3"
            >
              <div>
                <p className="font-medium text-white">{ad.title}</p>
                <p className="text-xs text-white/50">
                  {ad.placement} {ad.locale ? `(${ad.locale})` : "(all)"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleAd(ad.id, !ad.isActive)}
                className={`rounded-lg px-3 py-1 text-xs ${
                  ad.isActive ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-white/50"
                }`}
              >
                {ad.isActive ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Sponsored prizes</h2>
        <form onSubmit={createPrize} className="mb-4 grid gap-3 sm:grid-cols-2">
          <input
            value={prizeForm.titleFa}
            onChange={(e) => setPrizeForm({ ...prizeForm, titleFa: e.target.value })}
            placeholder="Title (FA)"
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <input
            value={prizeForm.titleEn}
            onChange={(e) => setPrizeForm({ ...prizeForm, titleEn: e.target.value })}
            placeholder="Title (EN)"
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <input
            value={prizeForm.titleAr}
            onChange={(e) => setPrizeForm({ ...prizeForm, titleAr: e.target.value })}
            placeholder="Title (AR)"
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <input
            value={prizeForm.sponsorName}
            onChange={(e) => setPrizeForm({ ...prizeForm, sponsorName: e.target.value })}
            placeholder="Sponsor name"
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <select
            value={prizeForm.tournamentId}
            onChange={(e) => setPrizeForm({ ...prizeForm, tournamentId: e.target.value })}
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white sm:col-span-2"
          >
            <option value="">No tournament (global)</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nameEn} ({t.slug})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white sm:col-span-2"
          >
            Add sponsored prize
          </button>
        </form>
        <div className="space-y-2">
          {prizes.map((prize) => (
            <div key={prize.id} className="rounded-xl border border-white/10 p-3">
              <p className="font-medium text-white">{prize.titleEn}</p>
              <p className="text-sm text-white/60">
                Rank {prize.rankFrom}-{prize.rankTo}
                {prize.sponsorName && ` · ${prize.sponsorName}`}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
