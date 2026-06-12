import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CreateLeagueForm } from "@/components/CreateLeagueForm";
import { getCurrentUser } from "@/lib/auth";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ type?: string }>;
};

export default async function CreateLeaguePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { type } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("leagues");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href={`/${locale}/leagues`} className="text-sm text-emerald-300 hover:underline">
        ← {t("back")}
      </Link>
      <h1 className="text-2xl font-black text-white">{t("createTitle")}</h1>
      <CreateLeagueForm
        locale={locale}
        defaultType={type === "school" ? "school" : "family"}
        labels={{
          title: t("fieldTitle"),
          titlePlaceholder: t("fieldTitlePlaceholder"),
          description: t("fieldDescription"),
          type: t("fieldType"),
          privacy: t("fieldPrivacy"),
          schoolName: t("schoolName"),
          schoolGrade: t("schoolGrade"),
          submit: t("submitCreate"),
          submitting: t("submitting"),
          types: {
            family: t("type_family"),
            friends: t("type_friends"),
            school: t("type_school"),
            company: t("type_company"),
            public: t("type_public"),
          },
          privacyOptions: {
            private: t("privacy_private"),
            public: t("privacy_public"),
          },
        }}
      />
    </div>
  );
}
