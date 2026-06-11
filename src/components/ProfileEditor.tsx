"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { UserAvatar } from "@/components/UserAvatar";

type ProfileEditorProps = {
  user: { id: string; name: string; avatarUrl: string | null };
  labels: {
    name: string;
    avatar: string;
    save: string;
    saving: string;
    success: string;
    error: string;
  };
};

export function ProfileEditor({ user, labels }: ProfileEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("fail");
      setMessage(labels.success);
      router.refresh();
    } catch {
      setMessage(labels.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarChange(file: File | null) {
    if (!file) return;
    const form = new FormData();
    form.append("avatar", file);
    setLoading(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      if (!res.ok) throw new Error("fail");
      router.refresh();
    } catch {
      setMessage(labels.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        <UserAvatar user={user} size={72} />
        <label className="block">
          <span className="mb-2 block text-sm text-white/70">{labels.avatar}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
            className="text-sm text-white/70 file:me-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm text-white/70">{labels.name}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          required
          className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400"
        />
      </label>

      {message && (
        <p className={`text-sm ${message === labels.success ? "text-emerald-300" : "text-red-300"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-400 disabled:opacity-60"
      >
        {loading ? labels.saving : labels.save}
      </button>
    </form>
  );
}
