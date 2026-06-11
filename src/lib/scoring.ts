export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return 5;
  }

  const predictedResult = getResult(predictedHome, predictedAway);
  const actualResult = getResult(actualHome, actualAway);

  if (predictedResult === actualResult) {
    return 2;
  }

  return 0;
}

function getResult(home: number, away: number): "home" | "away" | "draw" {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

export async function recalculateLeaderboard(
  updatePrediction: (id: string, points: number) => Promise<void>,
  getFinishedPredictions: () => Promise<
    Array<{
      id: string;
      homeScore: number;
      awayScore: number;
      match: { homeScore: number | null; awayScore: number | null; isFinished: boolean };
    }>
  >
): Promise<number> {
  const predictions = await getFinishedPredictions();
  let updated = 0;

  for (const prediction of predictions) {
    const { match } = prediction;
    if (
      !match.isFinished ||
      match.homeScore === null ||
      match.awayScore === null
    ) {
      continue;
    }

    const points = calculatePoints(
      prediction.homeScore,
      prediction.awayScore,
      match.homeScore,
      match.awayScore
    );

    await updatePrediction(prediction.id, points);
    updated += 1;
  }

  return updated;
}
