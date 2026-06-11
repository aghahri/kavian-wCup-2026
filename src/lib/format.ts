export function formatPersianDate(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatPersianNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}

export function isPredictionOpen(kickoffAt: Date, isFinished: boolean): boolean {
  if (isFinished) return false;
  return new Date() < kickoffAt;
}
