"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { Locale } from "@/i18n/routing";

type CreateLeagueFormProps = {
  locale: Locale;
  labels: {
    title: string;
    titlePlaceholder: string;
    description: string;
    type: string;
    privacy: string;
    schoolName: string;
    schoolGrade: string;
    submit: string;
    submitting: string;
    types: Record<string, string>;
    privacyOptions: Record<string, string>;
  };
  defaultType?: string;
};

export function CreateLeagueForm({ locale, labels, defaultType = "friends" }: CreateLeagueFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState(defaultType);
  const [privacy, setPrivacy] = useState("private");
  const [schoolName, setSchoolName] = useState("");
  const [schoolGrade, setSchoolGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          privacy,
          schoolName: type === "school" ? schoolName : undefined,
          schoolGrade: type === "school" ? schoolGrade : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/${locale}/leagues/${data.league.code}`);
    } catch {
      setError("Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
      <label className="block">
        <span className="mb-2 block text-sm text-white/80">{labels.title}</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={labels.titlePlaceholder}
          required
          minLength={2}
          className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm text-white/80">{labels.description}</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm text-white/80">{labels.type}</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white"
          >
            {Object.entries(labels.types).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-white/80">{labels.privacy}</span>
          <select
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white"
          >
            {Object.entries(labels.privacyOptions).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      {type === "school" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder={labels.schoolName}
            className="rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white"
          />
          <input
            value={schoolGrade}
            onChange={(e) => setSchoolGrade(e.target.value)}
            placeholder={labels.schoolGrade}
            className="rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white"
          />
        </div>
      )}
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-white hover:bg-emerald-400 disabled:opacity-60"
      >
        {loading ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
