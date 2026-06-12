"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminLeagueToggleProps = {
  leagueId: string;
  isActive: boolean;
  isFeatured: boolean;
};

export function AdminLeagueToggle({ leagueId, isActive, isFeatured }: AdminLeagueToggleProps) {
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [featured, setFeatured] = useState(isFeatured);
  const [loading, setLoading] = useState(false);

  async function patch(data: { isActive?: boolean; isFeatured?: boolean }) {
    setLoading(true);
    try {
      await fetch(`/api/admin/leagues/${leagueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 text-xs">
      <label className="flex items-center gap-2 text-white/80">
        <input
          type="checkbox"
          checked={active}
          disabled={loading}
          onChange={(e) => {
            setActive(e.target.checked);
            patch({ isActive: e.target.checked });
          }}
        />
        Active
      </label>
      <label className="flex items-center gap-2 text-white/80">
        <input
          type="checkbox"
          checked={featured}
          disabled={loading}
          onChange={(e) => {
            setFeatured(e.target.checked);
            patch({ isFeatured: e.target.checked });
          }}
        />
        Featured
      </label>
    </div>
  );
}
