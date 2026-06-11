/** Map canonical English team names (Match.homeTeam / awayTeam) to ISO 3166-1 alpha-2 */
const TEAM_ISO: Record<string, string> = {
  Mexico: "mx",
  "South Africa": "za",
  "South Korea": "kr",
  Canada: "ca",
  USA: "us",
  Paraguay: "py",
  Iran: "ir",
  "New Zealand": "nz",
  Brazil: "br",
  Morocco: "ma",
  France: "fr",
  Senegal: "sn",
  Argentina: "ar",
  Germany: "de",
  Spain: "es",
  England: "gb-eng",
  Italy: "it",
  Portugal: "pt",
  Netherlands: "nl",
  Belgium: "be",
  Croatia: "hr",
  Japan: "jp",
  Australia: "au",
  Uruguay: "uy",
  Colombia: "co",
  Chile: "cl",
  Ecuador: "ec",
  Peru: "pe",
  Switzerland: "ch",
  Poland: "pl",
  Sweden: "se",
  Denmark: "dk",
  Wales: "gb-wls",
  Scotland: "gb-sct",
  Turkey: "tr",
  Ukraine: "ua",
  Serbia: "rs",
  Ghana: "gh",
  Nigeria: "ng",
  Cameroon: "cm",
  "Costa Rica": "cr",
  Panama: "pa",
  Jamaica: "jm",
  Qatar: "qa",
  "Saudi Arabia": "sa",
  Tunisia: "tn",
  Algeria: "dz",
  Egypt: "eg",
  "Ivory Coast": "ci",
  "Côte d'Ivoire": "ci",
  "United States": "us",
  "United States of America": "us",
};

export function getTeamIsoCode(teamName: string): string | null {
  const direct = TEAM_ISO[teamName.trim()];
  if (direct) return direct;

  const lower = teamName.trim().toLowerCase();
  for (const [name, iso] of Object.entries(TEAM_ISO)) {
    if (name.toLowerCase() === lower) return iso;
  }

  return null;
}

export function getTeamFlagUrl(teamName: string, width = 40): string | null {
  const iso = getTeamIsoCode(teamName);
  if (!iso) return null;
  return `https://flagcdn.com/w${width}/${iso}.png`;
}
