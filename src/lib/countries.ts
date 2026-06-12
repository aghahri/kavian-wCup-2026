export type LoginCountry = {
  iso: string;
  dialCode: string;
  flagCode: string;
  nameFa: string;
  nameEn: string;
  nameAr: string;
};

export const LOGIN_COUNTRIES: LoginCountry[] = [
  { iso: "IR", dialCode: "98", flagCode: "ir", nameFa: "ایران", nameEn: "Iran", nameAr: "إيران" },
  { iso: "US", dialCode: "1", flagCode: "us", nameFa: "آمریکا", nameEn: "United States", nameAr: "الولايات المتحدة" },
  { iso: "GB", dialCode: "44", flagCode: "gb", nameFa: "بریتانیا", nameEn: "United Kingdom", nameAr: "المملكة المتحدة" },
  { iso: "DE", dialCode: "49", flagCode: "de", nameFa: "آلمان", nameEn: "Germany", nameAr: "ألمانيا" },
  { iso: "FR", dialCode: "33", flagCode: "fr", nameFa: "فرانسه", nameEn: "France", nameAr: "فرنسا" },
  { iso: "TR", dialCode: "90", flagCode: "tr", nameFa: "ترکیه", nameEn: "Turkey", nameAr: "تركيا" },
  { iso: "IQ", dialCode: "964", flagCode: "iq", nameFa: "عراق", nameEn: "Iraq", nameAr: "العراق" },
  { iso: "AE", dialCode: "971", flagCode: "ae", nameFa: "امارات", nameEn: "UAE", nameAr: "الإمارات" },
  { iso: "CA", dialCode: "1", flagCode: "ca", nameFa: "کانادا", nameEn: "Canada", nameAr: "كندا" },
  { iso: "AU", dialCode: "61", flagCode: "au", nameFa: "استرالیا", nameEn: "Australia", nameAr: "أستراليا" },
];

export const DEFAULT_DIAL_CODE = "98";

export function getLoginCountry(dialCode: string): LoginCountry | undefined {
  return LOGIN_COUNTRIES.find((c) => c.dialCode === dialCode);
}

export function getCountryName(country: LoginCountry, locale: string): string {
  if (locale === "fa") return country.nameFa;
  if (locale === "ar") return country.nameAr;
  return country.nameEn;
}

export function isIranDialCode(dialCode: string): boolean {
  return dialCode.replace(/\D/g, "") === "98";
}
