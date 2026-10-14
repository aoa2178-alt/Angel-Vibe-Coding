/**
 * Optional interface sounds for the calculators, generated in the browser with Web Audio (no audio files).
 * Off unless the visitor turns them on; the choice is remembered on this browser.
 */

const KEY = "breakeven-sound";
let on = read();
let ctx: AudioContext | null = null;
let lastTick = 0;
const listeners = new Set<(on: boolean) => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export const soundOn = () => on;

export function setSound(next: boolean) {
  on = next;
  try {
    localStorage.setItem(KEY, next ? "on" : "off");
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
  listeners.forEach((f) => f(on));
  if (next) click();
}

export function onSoundChange(f: (on: boolean) => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** One short tone: frequency glide, volume and length in seconds, starting `delay` seconds from now. */
function tone(type: OscillatorType, from: number, to: number, gain: number, length: number, delay = 0) {
  if (!on) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + length);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.005);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + length + 0.02);
  } catch {
    // No Web Audio: stay silent.
  }
}

/** A soft detent tick as the dial or wheel steps. */
export function tick() {
  const now = performance.now();
  if (now - lastTick < 35) return;
  lastTick = now;
  tone("sine", 2200, 1600, 0.035, 0.03);
}

/** A light key press. */
export function click() {
  tone("triangle", 700, 420, 0.06, 0.05);
}

/** A short two-note chime when the cheapest option changes. */
export function chime() {
  tone("sine", 660, 660, 0.05, 0.35, 0.06);
  tone("sine", 990, 990, 0.045, 0.45, 0.16);
}
