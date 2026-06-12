"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type JoinLeagueButtonProps = {
  code: string;
  isMember: boolean;
  isLoggedIn: boolean;
  loginHref: string;
  joinLabel: string;
  joinedLabel: string;
  loginLabel: string;
};

export function JoinLeagueButton({
  code,
  isMember,
  isLoggedIn,
  loginHref,
  joinLabel,
  joinedLabel,
  loginLabel,
}: JoinLeagueButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState(isMember);

  if (!isLoggedIn) {
    return (
      <a
        href={loginHref}
        className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white hover:bg-emerald-400"
      >
        {loginLabel}
      </a>
    );
  }

  if (member) {
    return (
      <span className="inline-block rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-6 py-3 text-sm font-bold text-emerald-200">
        {joinedLabel}
      </span>
    );
  }

  async function handleJoin() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leagues/${code}/join`, { method: "POST" });
      if (res.ok) {
        setMember(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleJoin}
      disabled={loading}
      className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white hover:bg-emerald-400 disabled:opacity-60"
    >
      {loading ? "…" : joinLabel}
    </button>
  );
}
