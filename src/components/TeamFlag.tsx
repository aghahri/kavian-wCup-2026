"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  FLAG_PLACEHOLDER_PATH,
  buildFlagcdnUrl,
  getFlagFallbackCode,
  getTeamFlagCode,
  getTeamMetadata,
  resolveFlagcdnWidth,
} from "@/lib/teams";

type TeamFlagProps = {
  teamName: string;
  size?: number;
  className?: string;
};

function FlagPlaceholder({ size, className }: { size: number; className: string }) {
  const height = Math.round(size * 0.75);
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden rounded-sm bg-slate-800 ring-1 ring-white/20 ${className}`}
      style={{ width: size, height }}
      aria-hidden
    >
      <Image
        src={FLAG_PLACEHOLDER_PATH}
        alt=""
        width={size}
        height={height}
        className="h-full w-full object-cover opacity-80"
      />
    </span>
  );
}

export function TeamFlag({ teamName, size = 32, className = "" }: TeamFlagProps) {
  const meta = getTeamMetadata(teamName);
  const primaryCode = meta?.flagCode ?? getTeamFlagCode(teamName);
  const width = resolveFlagcdnWidth(size * 2);
  const height = Math.round(size * 0.75);

  const [flagCode, setFlagCode] = useState<string | null>(primaryCode);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFlagCode(primaryCode);
    setFailed(false);
  }, [teamName, primaryCode]);

  if (!flagCode || failed) {
    return <FlagPlaceholder size={size} className={className} />;
  }

  const src = buildFlagcdnUrl(flagCode, width);

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={height}
      className={`inline-block rounded-sm object-cover shadow-md ring-1 ring-white/20 ${className}`}
      onError={() => {
        const fallback = getFlagFallbackCode(flagCode);
        if (fallback) {
          setFlagCode(fallback);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
