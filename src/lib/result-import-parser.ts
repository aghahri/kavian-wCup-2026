export type ParsedResultPaste = {
  homeScore: number | null;
  awayScore: number | null;
  sourceUrl: string | null;
  highlightsUrl: string | null;
  rawScoreLine: string | null;
};

const SCORE_RE = /(\d{1,2})\s*[-:–]\s*(\d{1,2})/;
const URL_RE = /https?:\/\/[^\s]+/gi;

export function parseResultPaste(text: string): ParsedResultPaste {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let homeScore: number | null = null;
  let awayScore: number | null = null;
  let rawScoreLine: string | null = null;
  const urls: string[] = [];

  for (const line of lines) {
    const scoreMatch = line.match(SCORE_RE);
    if (scoreMatch && homeScore === null) {
      homeScore = Number(scoreMatch[1]);
      awayScore = Number(scoreMatch[2]);
      rawScoreLine = line;
    }
    const found = line.match(URL_RE);
    if (found) urls.push(...found.map((u) => u.replace(/[.,)]+$/, "")));
  }

  return {
    homeScore,
    awayScore,
    sourceUrl: urls[0] ?? null,
    highlightsUrl: urls[1] ?? urls[0] ?? null,
    rawScoreLine,
  };
}
