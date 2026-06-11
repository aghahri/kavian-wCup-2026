"use client";

import { useEffect, useState } from "react";

type InstallPwaBannerProps = {
  title: string;
  description: string;
  installLabel: string;
  dismissLabel: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPwaBanner({
  title,
  description,
  installLabel,
  dismissLabel,
}: InstallPwaBannerProps) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("pwa-dismissed") === "1") {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed || !deferred) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-[#0b1f3a] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold text-white">{title}</p>
        <p className="mt-1 text-sm text-white/70">{description}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={async () => {
            await deferred.prompt();
            setDeferred(null);
          }}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-400"
        >
          {installLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("pwa-dismissed", "1");
            setDismissed(true);
            setDeferred(null);
          }}
          className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
        >
          {dismissLabel}
        </button>
      </div>
    </div>
  );
}
