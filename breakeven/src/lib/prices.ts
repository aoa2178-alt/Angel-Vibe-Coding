// Tracked prices: API prices per million tokens and GPU rental per hour, over time, each point with its source.
// The data lives in src/data/prices.json; the weekly price watcher proposes new points there, and a person approves.
// The calculator's defaults (tco.ts) don't move on their own: "Use latest prices" applies the latest points to a plan.
import data from "@/data/prices.json";
import type { Assumptions } from "./tco";

export interface ApiPoint {
  date: string;
  model: string;
  input: number;
  output: number;
  source: string;
  checked: string;
  note?: string;
}

export interface GpuPoint {
  date: string;
  value: number;
  source: string;
  checked: string;
  note?: string;
}

export interface Series<P> {
  id: string;
  label: string;
  unit: string;
  points: P[];
}

export interface PriceData {
  about: string;
  api: Series<ApiPoint>[];
  gpu: Series<GpuPoint>[];
  defaults: { api: string; gpu: string };
}

export const PRICES = data as PriceData;

/** Blended price per million tokens, at a given share of output tokens (the calculator's default is 25%). */
export const blended = (p: ApiPoint, outputShare = 0.25) => p.input * (1 - outputShare) + p.output * outputShare;

const last = <P>(s: Series<P>) => s.points[s.points.length - 1]!;

/** The latest API point for the series behind the calculator's default API price, and the latest GPU rental point. */
export function latest(prices: PriceData = PRICES) {
  const api = prices.api.find((s) => s.id === prices.defaults.api)!;
  const gpu = prices.gpu.find((s) => s.id === prices.defaults.gpu)!;
  return { api: { series: api, point: last(api) }, gpu: { series: gpu, point: last(gpu) } };
}

/** How far a plan's prices are from the latest market points, as fractions (0.13 = the market is 13% higher). */
export function drift(a: Assumptions, prices: PriceData = PRICES) {
  const l = latest(prices);
  const rel = (market: number, mine: number) => (mine > 0 ? market / mine - 1 : 0);
  return {
    apiInput: rel(l.api.point.input, a.apiInputPerM),
    apiOutput: rel(l.api.point.output, a.apiOutputPerM),
    rent: rel(l.gpu.point.value, a.rentPerGpuHour),
  };
}

/** True when any tracked price is more than `threshold` away from the plan's. */
export const isStale = (a: Assumptions, threshold = 0.05, prices: PriceData = PRICES) =>
  Object.values(drift(a, prices)).some((d) => Math.abs(d) > threshold);

/** The plan's assumptions with the latest market prices applied. */
export function withLatest(a: Assumptions, prices: PriceData = PRICES): Assumptions {
  const l = latest(prices);
  return { ...a, apiInputPerM: l.api.point.input, apiOutputPerM: l.api.point.output, rentPerGpuHour: l.gpu.point.value };
}

/** Every point, newest first, for a change log. */
export function changeLog(prices: PriceData = PRICES) {
  const api = prices.api.flatMap((s) => s.points.map((p) => ({ date: p.date, series: s.label, what: `${p.model}: $${p.input} in / $${p.output} out per 1M tokens`, source: p.source, note: p.note })));
  const gpu = prices.gpu.flatMap((s) => s.points.map((p) => ({ date: p.date, series: s.label, what: `$${p.value.toFixed(2)} per GPU-hour`, source: p.source, note: p.note })));
  return [...api, ...gpu].sort((x, y) => y.date.localeCompare(x.date));
}
