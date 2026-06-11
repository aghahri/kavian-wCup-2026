import type { BadgeId } from "@/lib/badges";

type BadgeListProps = {
  badges: BadgeId[];
  labels: Record<BadgeId, string>;
  size?: "sm" | "md";
};

const icons: Record<BadgeId, string> = {
  early_supporter: "🌟",
  top_predictor: "🏆",
  referral_champion: "🤝",
  world_cup_expert: "⚽",
};

export function BadgeList({ badges, labels, size = "md" }: BadgeListProps) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge}
          title={labels[badge]}
          className={`inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-100 ${
            size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
          }`}
        >
          <span aria-hidden>{icons[badge]}</span>
          <span>{labels[badge]}</span>
        </span>
      ))}
    </div>
  );
}
