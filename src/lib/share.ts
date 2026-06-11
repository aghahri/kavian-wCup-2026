export type SharePlatform = "telegram" | "whatsapp" | "x" | "facebook";

export function buildShareUrls(text: string, url: string) {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  const combined = encodeURIComponent(`${text}\n${url}`);

  return {
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    whatsapp: `https://wa.me/?text=${combined}`,
    x: `https://twitter.com/intent/tweet?text=${combined}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
  };
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://kavianfootball.com";
}
