import { getRequestConfig } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  const baseMessages = (await import(`../../messages/${locale}.json`)).default;

  const overrides = await prisma.uiTranslation.findMany({
    where: { locale },
  });

  const merged = { ...baseMessages };
  for (const row of overrides) {
    setNestedValue(merged, row.key, row.value);
  }

  return {
    locale,
    messages: merged,
  };
});

function setNestedValue(obj: Record<string, unknown>, key: string, value: string) {
  const parts = key.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof current[part] !== "object" || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}
