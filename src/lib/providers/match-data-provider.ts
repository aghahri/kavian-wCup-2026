export type MatchScoreData = {
  homeScore: number;
  awayScore: number;
  isFinished: boolean;
  sourceName?: string;
  sourceUrl?: string;
};

export type MatchEventData = {
  minute: number | null;
  type: string;
  teamName?: string;
  playerName?: string;
  descriptionFa?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  sourceUrl?: string;
};

export type MatchHighlightsData = {
  highlightsUrl?: string;
  highlightsProvider?: string;
  highlightsEmbedUrl?: string;
};

export interface MatchDataProvider {
  name: string;
  fetchMatchScore(externalMatchId: string): Promise<MatchScoreData | null>;
  fetchMatchEvents(externalMatchId: string): Promise<MatchEventData[]>;
  fetchHighlights(externalMatchId: string): Promise<MatchHighlightsData | null>;
}

/** Manual admin entry — no remote fetch. */
export const manualProvider: MatchDataProvider = {
  name: "manual",
  async fetchMatchScore() {
    return null;
  },
  async fetchMatchEvents() {
    return [];
  },
  async fetchHighlights() {
    return null;
  },
};

/** FIFA official API placeholder — integrate when credentials available. */
export const fifaProvider: MatchDataProvider = {
  name: "fifa",
  async fetchMatchScore(_externalMatchId) {
    return null;
  },
  async fetchMatchEvents(_externalMatchId) {
    return [];
  },
  async fetchHighlights(_externalMatchId) {
    return null;
  },
};

/** YouTube official highlights placeholder — admin pastes embed URL for now. */
export const youtubeProvider: MatchDataProvider = {
  name: "youtube",
  async fetchMatchScore(_externalMatchId) {
    return null;
  },
  async fetchMatchEvents(_externalMatchId) {
    return [];
  },
  async fetchHighlights(_externalMatchId) {
    return null;
  },
};

const PROVIDERS: Record<string, MatchDataProvider> = {
  manual: manualProvider,
  fifa: fifaProvider,
  youtube: youtubeProvider,
};

export function getMatchDataProvider(name: string): MatchDataProvider {
  return PROVIDERS[name] ?? manualProvider;
}
