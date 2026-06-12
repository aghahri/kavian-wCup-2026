"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  DEFAULT_DIAL_CODE,
  LOGIN_COUNTRIES,
  getCountryName,
  isIranDialCode,
} from "@/lib/countries";
import { formatPhoneForApi } from "@/lib/phone";
import { buildFlagcdnUrl } from "@/lib/teams";
import type { Locale } from "@/i18n/routing";

type Step = "phone" | "otp" | "name-required";

const DEFAULT_COOLDOWN_SECONDS = 60;

export function LoginForm() {
  const t = useTranslations("login");
  const te = useTranslations("errors");
  const params = useParams();
  const locale = (params.locale as Locale) ?? "fa";

  const [step, setStep] = useState<Step>("phone");
  const [countryDial, setCountryDial] = useState(DEFAULT_DIAL_CODE);
  const [phone, setPhone] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phoneMask, setPhoneMask] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const iranSelected = isIranDialCode(countryDial);
  const cooldownActive = cooldownSeconds > 0;

  const startCooldown = useCallback((seconds: number) => {
    setCooldownSeconds(Math.max(1, Math.ceil(seconds)));
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  async function requestOtp() {
    setError("");
    setInfo("");

    const apiPhone = formatPhoneForApi(countryDial, phone);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ phone: apiPhone, countryDial }),
      });

      const data = await response.json();

      if (response.status === 429) {
        startCooldown(data.retryAfterSeconds ?? DEFAULT_COOLDOWN_SECONDS);
        setError(t("resendCooldown", { seconds: data.retryAfterSeconds ?? DEFAULT_COOLDOWN_SECONDS }));
        return;
      }

      if (!response.ok) {
        setError(t("sendOtpFailed"));
        return;
      }

      setSubmittedPhone(apiPhone);
      setPhoneMask(data.phoneMask ?? apiPhone);
      startCooldown(data.cooldownSeconds ?? DEFAULT_COOLDOWN_SECONDS);
      setStep("otp");
    } catch {
      setError(te("network"));
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOtp(event: FormEvent) {
    event.preventDefault();
    if (cooldownActive) return;
    await requestOtp();
  }

  async function handleResendOtp() {
    if (cooldownActive || loading) return;
    await requestOtp();
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (step !== "name-required") {
      setInfo("");
    }
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({
          phone: submittedPhone,
          countryDial,
          code,
          name: step === "name-required" ? name : undefined,
        }),
      });

      const data = await response.json();

      if (data.needsName) {
        setStep("name-required");
        setInfo(t("nameRequiredHint"));
        setError("");
        return;
      }

      if (!response.ok) {
        setError(data.error ?? te("network"));
        return;
      }

      if (data.user?.isAdmin) {
        window.location.href = `/${locale}/admin`;
      } else if (data.isNewUser) {
        window.location.href = `/${locale}/profile`;
      } else {
        window.location.href = `/${locale}/predict`;
      }
    } catch {
      setError(te("network"));
    } finally {
      setLoading(false);
    }
  }

  const subtitle =
    step === "phone"
      ? t("subtitlePhone")
      : step === "name-required"
        ? t("nameRequiredHint")
        : t("otpSentTo", { phone: phoneMask });

  const submitLabel =
    step === "name-required"
      ? t("completeRegistration")
      : loading
        ? t("verifying")
        : t("verifyOtp");

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-black text-white">{t("title")}</h1>
        <p className="mt-2 text-sm leading-7 text-white/70">{subtitle}</p>

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

            {error && (
              <p className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-200">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || cooldownActive}
              className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-white transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading
                ? t("sendingOtp")
                : cooldownActive
                  ? t("resendCooldown", { seconds: cooldownSeconds })
                  : t("sendOtp")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            {step === "name-required" && (
              <label className="block">
                <span className="mb-2 block text-sm text-white/80">{t("name")}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  required
                  minLength={2}
                  autoFocus
                  className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400"
                />
              </label>
            )}

            {step === "otp" && (
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
            )}

            {info && (
              <p className="rounded-xl bg-sky-500/15 px-4 py-3 text-sm text-sky-100">{info}</p>
            )}

            {error && (
              <p className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-200">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || (step === "otp" && code.length !== 6)}
              className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-white transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {submitLabel}
            </button>

            {step === "otp" && (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || cooldownActive}
                className="w-full rounded-xl border border-white/20 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                {cooldownActive
                  ? t("resendCooldown", { seconds: cooldownSeconds })
                  : t("resendOtp")}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setName("");
                setInfo("");
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
