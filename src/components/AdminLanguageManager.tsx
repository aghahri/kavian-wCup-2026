"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Translation = {
  id: string;
  key: string;
  locale: string;
  value: string;
};

type AdminLanguageManagerProps = {
  initialTranslations: Translation[];
};

export function AdminLanguageManager({ initialTranslations }: AdminLanguageManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialTranslations);
  const [key, setKey] = useState("home.welcome");
  const [locale, setLocale] = useState("fa");
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/translations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, locale, value }),
    });
    const data = await response.json();
    if (!response.ok) return;

    setItems((prev) => {
      const existing = prev.find((p) => p.key === key && p.locale === locale);
      if (existing) {
        return prev.map((p) => (p.id === existing.id ? data.translation : p));
      }
      return [...prev, data.translation];
    });
    setMessage("Translation saved");
    setValue("");
    router.refresh();
  }

  async function removeTranslation(id: string) {
    await fetch(`/api/admin/translations?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"
      >
        <h2 className="mb-4 text-lg font-bold text-white">Add / override UI label</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="home.welcome"
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          >
            <option value="fa">fa</option>
            <option value="en">en</option>
            <option value="ar">ar</option>
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Translated text"
            required
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
        </div>
        <button
          type="submit"
          className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white"
        >
          Save translation
        </button>
        {message && <p className="mt-2 text-sm text-emerald-200">{message}</p>}
      </form>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <div>
              <p className="text-sm font-medium text-white">
                [{item.locale}] {item.key}
              </p>
              <p className="text-sm text-white/70">{item.value}</p>
            </div>
            <button
              type="button"
              onClick={() => removeTranslation(item.id)}
              className="text-xs text-red-200 hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
