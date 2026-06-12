"use client";

import { useState } from "react";

type CopyInviteLinkProps = {
  url: string;
  copyLabel: string;
  copiedLabel: string;
};

export function CopyInviteLink({ url, copyLabel, copiedLabel }: CopyInviteLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="break-all text-sm text-emerald-200" dir="ltr">
        {url}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-4 w-full rounded-xl bg-emerald-500 py-3 font-bold text-white hover:bg-emerald-400"
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
