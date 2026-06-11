"use client";

import { useState } from "react";

type ReferralBannerProps = {
  referralUrl: string;
  title: string;
  description: string;
  copyLabel: string;
  copiedLabel: string;
};

export function ReferralBanner({
  referralUrl,
  title,
  description,
  copyLabel,
  copiedLabel,
}: ReferralBannerProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-600/15 to-transparent p-5">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/70">{description}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={referralUrl}
          dir="ltr"
          className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm text-white/90"
        />
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(referralUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="shrink-0 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-400"
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </div>
  );
}
