import { cookies } from "next/headers";

export const LEAGUE_INVITE_COOKIE = "kavian_league_invite";
export const LEAGUE_INVITE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export async function getLeagueInviteCookieCode(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(LEAGUE_INVITE_COOKIE)?.value?.trim();
  return value || null;
}
