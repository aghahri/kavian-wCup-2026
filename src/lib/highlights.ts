export type HighlightProvider = "youtube" | "fifa" | "broadcaster" | "unknown";

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const FIFA_HOSTS = new Set(["fifa.com", "www.fifa.com"]);

const EMBED_HOSTS = new Set([...YOUTUBE_HOSTS, ...FIFA_HOSTS]);

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isAllowedEmbed(url: string): boolean {
  const host = hostOf(url);
  if (!host) return false;
  return [...EMBED_HOSTS].some((h) => host === h || host.endsWith(`.${h}`));
}

export function detectProvider(url: string): HighlightProvider {
  const host = hostOf(url);
  if (!host) return "unknown";
  if ([...YOUTUBE_HOSTS].some((h) => host === h || host.endsWith(`.${h}`))) return "youtube";
  if ([...FIFA_HOSTS].some((h) => host === h || host.endsWith(`.${h}`))) return "fifa";
  if (url.startsWith("http")) return "broadcaster";
  return "unknown";
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
    if (parsed.hostname.includes("youtube")) {
      const fromQuery = parsed.searchParams.get("v");
      if (fromQuery) return fromQuery;
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** Normalize watch/short/embed links to privacy-enhanced YouTube embed URL. */
export function normalizeYouTubeUrlToEmbed(url: string): string | null {
  if (!isAllowedEmbed(url)) return null;
  const provider = detectProvider(url);
  if (provider === "youtube") {
    const videoId = extractYouTubeVideoId(url);
    if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`;
    return null;
  }
  if (provider === "fifa") return url;
  return null;
}

export function resolveHighlightsEmbed(
  highlightsEmbedUrl: string | null | undefined,
  highlightsUrl: string | null | undefined
): string | null {
  if (highlightsEmbedUrl) {
    const embed = normalizeYouTubeUrlToEmbed(highlightsEmbedUrl);
    if (embed) return embed;
  }
  if (highlightsUrl) {
    return normalizeYouTubeUrlToEmbed(highlightsUrl);
  }
  return null;
}

export function hasHighlights(
  highlightsUrl: string | null | undefined,
  highlightsEmbedUrl: string | null | undefined
): boolean {
  return Boolean(highlightsUrl || highlightsEmbedUrl);
}

export function highlightsWatchUrl(
  highlightsUrl: string | null | undefined,
  highlightsEmbedUrl: string | null | undefined
): string | null {
  return highlightsUrl ?? highlightsEmbedUrl ?? null;
}
