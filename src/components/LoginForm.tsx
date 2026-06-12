"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import {
  DEFAULT_DIAL_CODE,
  LOGIN_COUNTRIES,
  getCountryName,
  isIranDialCode,
} from "@/lib/countries";
import { formatPhoneForApi } from "@/lib/phone";
import { buildFlagcdnUrl } from "@/lib/teams";
import type { Locale } from "@/i18n/routing";

type Step = "phone" | "otp";

export function LoginForm() {
  const t = useTranslations("login");
  const te = useTranslations("errors");
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as Locale) ?? "fa";

  const [step, setStep] = useState<Step>("phone");
  const [countryDial, setCountryDial] = useState(DEFAULT_DIAL_CODE);
  const [phone, setPhone] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [phoneMask, setPhoneMask] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const iranSelected = isIranDialCode(countryDial);

  function mapRequestOtpError(status: number, data: { errorCode?: string }) {
    if (data.errorCode === "IRAN_OTP_ONLY") return t("iranOtpOnly");
    if (status === 429) return t("rateLimitError");
    return t("sendOtpFailed");
  }

  async function handleRequestOtp(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!iranSelected) {
      setError(t("iranOtpOnly"));
      return;
    }

    const apiPhone = formatPhoneForApi(countryDial, phone);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: apiPhone, countryDial }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(mapRequestOtpError(response.status, data));
        return;
      }

      setSubmittedPhone(apiPhone);
      setPhoneMask(data.phoneMask ?? "");
      setStep("otp");
    } catch {
      setError(te("network"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: submittedPhone,
          countryDial,
          code,
          name: needsName ? name : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.needsName) {
          setNeedsName(true);
        }
        setError(data.error ?? te("network"));
        return;
      }

      router.push(data.user?.isAdmin ? `/${locale}/admin` : `/${locale}/predict`);
      router.refresh();
    } catch {
      setError(te("network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-black text-white">{t("title")}</h1>
        <p className="mt-2 text-sm leading-7 text-white/70">
          {step === "phone" ? t("subtitlePhone") : t("subtitleOtp", { phone: phoneMask })}
        </p>

        {step === "phone" ? (
          <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-white/80">{t("country")}</span>
              <div className="flex items-center gap-2" dir="ltr">
                <Image
                  src={buildFlagcdnUrl(
                    LOGIN_COUNTRIES.find((c) => c.dialCode === countryDial)?.flagCode ?? "ir",
                    40
                  )}
                  alt=""
                  width={28}
                  height={21}
                  className="shrink-0 rounded-sm ring-1 ring-white/20"
                />
                <select
                  value={countryDial}
                  onChange={(e) => {
                    setCountryDial(e.target.value);
                    setError("");
                  }}
                  className="min-w-0 flex-1 appearance-none rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  {LOGIN_COUNTRIES.map((country) => (
                    <option key={`${country.iso}-${country.dialCode}`} value={country.dialCode}>
                      +{country.dialCode} {getCountryName(country, locale)}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-white/80">{t("phone")}</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={iranSelected ? t("phonePlaceholder") : t("phonePlaceholderIntl")}
                required
                dir="ltr"
                className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
              {iranSelected && (
                <p className="mt-2 text-xs leading-6 text-white/50">{t("phoneHelper")}</p>
              )}
            </label>

            {!iranSelected && (
              <p className="rounded-xl bg-amber-500/15 px-4 py-3 text-sm text-amber-100">
                {t("iranOtpOnly")}
              </p>
            )}

            {error && (
              <p className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-200">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !iranSelected}
              className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-white transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? t("sendingOtp") : t("sendOtp")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            {needsName && (
              <label className="block">
                <span className="mb-2 block text-sm text-white/80">{t("name")}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  required
                  minLength={2}
                  className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm text-white/80">{t("otpCode")}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                required
                dir="ltr"
                className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-center text-2xl tracking-[0.4em] text-white outline-none focus:border-emerald-400"
              />
            </label>

            {error && (
              <p className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-200">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-white transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? t("verifying") : t("verifyOtp")}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError("");
              }}
              className="w-full text-sm text-white/60 hover:text-white"
            >
              {t("changePhone")}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-white/50">{t("adminHint")}</p>
      </div>
    </div>
  );
}
