// Types for quarters.js (plain JavaScript so the Node build script can import it without a compile step).
export interface XbrlFact {
  start?: string;
  end: string;
  val: number;
  filed?: string;
  form?: string;
  accn?: string;
}

export interface QuarterValue {
  quarter: string;
  end: string;
  value: number;
  accn?: string;
}

export function calendarQuarter(end: string): string;
export function deriveQuarters(facts: XbrlFact[]): QuarterValue[];
