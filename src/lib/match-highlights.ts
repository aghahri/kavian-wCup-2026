const ALLOWED_EMBED_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "fifa.com",
  "www.fifa.com",
];

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isAllowedEmbedUrl(url: string): boolean {
  const host = hostOf(url);
  if (!host) return false;
  return ALLOWED_EMBED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

export function toEmbedUrl(url: string): string | null {
  if (!isAllowedEmbedUrl(url)) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube") || parsed.hostname.includes("youtu.be")) {
      let videoId: string | null = null;
      if (parsed.hostname.includes("youtu.be")) {
        videoId = parsed.pathname.slice(1).split("/")[0] || null;
      } else {
        videoId = parsed.searchParams.get("v");
        if (!videoId && parsed.pathname.startsWith("/embed/")) {
          videoId = parsed.pathname.split("/")[2] ?? null;
        }
      }
      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}`;
      }
    }
    if (parsed.hostname.includes("fifa.com")) {
      return url;
    }
  } catch {
    return null;
  }

  return isAllowedEmbedUrl(url) ? url : null;
}

export function resolveHighlightsEmbed(
  highlightsEmbedUrl: string | null | undefined,
  highlightsUrl: string | null | undefined
): string | null {
  if (highlightsEmbedUrl) {
    const embed = toEmbedUrl(highlightsEmbedUrl);
    if (embed) return embed;
  }
  if (highlightsUrl) {
    return toEmbedUrl(highlightsUrl);
  }
  return null;
}
