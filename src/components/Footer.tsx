import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-white/10 bg-[#071526] px-4 py-6 text-center text-sm text-white/60">
      <p>{t("tagline")}</p>
      <p className="mt-1 text-xs text-white/40">{t("scoring")}</p>
    </footer>
  );
}
