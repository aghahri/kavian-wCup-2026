/** Whether users can still submit predictions for a match. */
export function isPredictionOpen(
  kickoffAt: Date,
  isFinished: boolean,
  lockOverride?: string | null
): boolean {
  if (isFinished) return false;
  if (lockOverride === "closed") return false;
  if (lockOverride === "open") return true;
  return new Date() < kickoffAt;
}

export function msUntilPredictionClose(kickoffAt: Date, lockOverride?: string | null): number {
  if (lockOverride === "open") return Infinity;
  if (lockOverride === "closed") return 0;
  return Math.max(0, kickoffAt.getTime() - Date.now());
}
