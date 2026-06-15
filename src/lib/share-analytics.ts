export type ShareAnalyticsSource =
  | "league_invite"
  | "referrals"
  | "match_summary"
  | "daily_recap"
  | "profile_referral"
  | "match_center"
  | "fixtures"
  | "leaderboard"
  | "league_page"
  | "predict"
  | "tournaments"
  | "share_toolbar";

export function trackShareShokoofaloo(source: ShareAnalyticsSource, page: string, locale: string): void {
  void fetch("/api/analytics/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "share_shokoofaloo",
      source,
      page,
      locale,
    }),
    keepalive: true,
  }).catch(() => {
    /* non-blocking */
  });
}
