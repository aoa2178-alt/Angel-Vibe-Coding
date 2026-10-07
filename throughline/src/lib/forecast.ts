// Step 1: forecast monthly demand. Three standard methods, each scored on the last 12 months it didn't see.
// Pure functions only.

export type MethodId = "seasonal-naive" | "moving-average" | "holt-winters";

export const METHODS: { id: MethodId; label: string; blurb: string }[] = [
  { id: "seasonal-naive", label: "Same month last year", blurb: "Seasonal naive: next March looks like last March." },
  { id: "moving-average", label: "3-month average", blurb: "The average of the last three months, carried forward. Ignores seasons." },
  { id: "holt-winters", label: "Holt-Winters", blurb: "Exponential smoothing of level, trend and a 12-month season." },
];

export const SEASON = 12;
export const HOLDOUT = 12;

/** Forecast `h` months after `y` with one method. */
export function forecastWith(method: MethodId, y: number[], h: number): number[] {
  if (method === "seasonal-naive") return Array.from({ length: h }, (_, i) => y[y.length - SEASON + (i % SEASON)]!);
  if (method === "moving-average") {
    const avg = y.slice(-3).reduce((a, b) => a + b, 0) / 3;
    return Array.from({ length: h }, () => avg);
  }
  return holtWinters(y, h).forecast;
}

/** Additive Holt-Winters with a 12-month season; smoothing constants picked by the smallest one-step error on `y`. */
export function holtWinters(y: number[], h: number, params?: { alpha: number; beta: number; gamma: number }) {
  const fit = (alpha: number, beta: number, gamma: number) => {
    const first = y.slice(0, SEASON);
    const second = y.slice(SEASON, 2 * SEASON);
    let level = mean(first);
    let trend = (mean(second) - mean(first)) / SEASON;
    const season = first.map((v) => v - level);
    let sse = 0;
    for (let t = SEASON; t < y.length; t++) {
      const s = season[t % SEASON]!;
      const oneStep = level + trend + s;
      sse += (y[t]! - oneStep) ** 2;
      const prevLevel = level;
      level = alpha * (y[t]! - s) + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
      season[t % SEASON] = gamma * (y[t]! - level) + (1 - gamma) * s;
    }
    const forecast = Array.from({ length: h }, (_, i) => level + (i + 1) * trend + season[(y.length + i) % SEASON]!);
    return { sse, forecast, params: { alpha, beta, gamma } };
  };
  if (params) return fit(params.alpha, params.beta, params.gamma);
  let best = fit(0.3, 0.05, 0.3);
  for (const alpha of [0.1, 0.2, 0.3, 0.5, 0.7])
    for (const beta of [0, 0.02, 0.05, 0.1])
      for (const gamma of [0.1, 0.2, 0.3, 0.5]) {
        const f = fit(alpha, beta, gamma);
        if (f.sse < best.sse) best = f;
      }
  return best;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export interface Score {
  method: MethodId;
  /** Forecast for the held-out months */
  holdout: number[];
  /** Σ|error| ÷ Σ actual */
  wape: number;
  /** Σ(forecast − actual) ÷ Σ actual: positive means over-forecasting */
  bias: number;
  /** Root mean squared error over the holdout, in units */
  rmse: number;
}

/** Fit on everything but the last 12 months, forecast those 12, and score. */
export function score(method: MethodId, y: number[]): Score {
  const train = y.slice(0, -HOLDOUT);
  const actual = y.slice(-HOLDOUT);
  const holdout = forecastWith(method, train, HOLDOUT);
  const err = holdout.map((f, i) => f - actual[i]!);
  const total = actual.reduce((a, b) => a + b, 0);
  return {
    method,
    holdout,
    wape: err.reduce((a, e) => a + Math.abs(e), 0) / total,
    bias: err.reduce((a, e) => a + e, 0) / total,
    rmse: Math.sqrt(err.reduce((a, e) => a + e * e, 0) / err.length),
  };
}

export interface ForecastResult {
  scores: Score[];
  /** The method in use: chosen, or the lowest WAPE */
  method: MethodId;
  best: MethodId;
  /** The next 12 months, refit on all the history */
  forecast: number[];
  /** Forecast error per month (the holdout RMSE), used for the band and for safety stock */
  sigma: number;
}

export function runForecast(y: number[], chosen?: MethodId): ForecastResult {
  const scores = METHODS.map((m) => score(m.id, y));
  const best = scores.reduce((a, b) => (b.wape < a.wape ? b : a)).method;
  const method = chosen ?? best;
  return { scores, method, best, forecast: forecastWith(method, y, 12).map((v) => Math.max(0, v)), sigma: scores.find((s) => s.method === method)!.rmse };
}
