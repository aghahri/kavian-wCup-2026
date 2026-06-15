"use client";

import { useEffect } from "react";

type RecordActivityProps = {
  type: "league_visit" | "recap_view" | "ai_visit";
};

export function RecordActivity({ type }: RecordActivityProps) {
  useEffect(() => {
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    }).catch(() => {});
  }, [type]);

  return null;
}
