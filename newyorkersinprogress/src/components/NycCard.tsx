import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type CardInfo = {
  name: string;
  rank: string;
  xp: number;
  streak: number;
  bestStreak: number;
  lessonsDone: number;
  lessonsTotal: number;
  home: string | null;
};

const W = 1080;
const H = 1350;
const YELLOW = "#F5C518";
const INK = "#1D2130";
const RED = "#D7263D";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Shrink a font until the text fits the width. */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, family: string, maxWidth: number) {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && s > 20) {
    s -= 4;
    ctx.font = `${weight} ${s}px ${family}`;
  }
}

/** Draw the card: a taxi-yellow ID card with the player's stats and, once every lesson is done, the stamp. */
export function drawCard(ctx: CanvasRenderingContext2D, info: CardInfo) {
  const certified = info.lessonsDone >= info.lessonsTotal;
  const display = "Outfit, sans-serif";
  const body = "Figtree, sans-serif";

  ctx.fillStyle = YELLOW;
  ctx.fillRect(0, 0, W, H);

  // Taxi checker band.
  const sq = 45;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < W / sq; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? INK : YELLOW;
      ctx.fillRect(col * sq, 70 + row * sq, sq, sq);
    }
  }

  ctx.fillStyle = INK;
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 44px ${display}`;
  ctx.fillText("WALKIN' HERE!", 80, 270);
  ctx.font = `600 30px ${body}`;
  ctx.fillText("NYC CARD · NEW YORK CITY", 80, 318);

  fit(ctx, info.name, 800, 128, display, W - 160);
  ctx.fillText(info.name, 80, 480);
  ctx.font = `700 46px ${body}`;
  ctx.fillText(info.rank, 80, 548);
  if (info.home) {
    ctx.font = `500 34px ${body}`;
    ctx.fillText(`Home base: ${info.home}`, 80, 600);
  }

  // Stats.
  const stats = [
    { label: "TOTAL XP", value: String(info.xp) },
    { label: "DAY STREAK", value: `${info.streak} 🔥` },
    { label: "LESSONS", value: `${info.lessonsDone}/${info.lessonsTotal}` },
    { label: "BEST STREAK", value: String(info.bestStreak) },
  ];
  stats.forEach((stat, i) => {
    const x = 80 + (i % 2) * 470;
    const y = 660 + Math.floor(i / 2) * 230;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    roundRect(ctx, x, y, 450, 200, 28);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = `700 28px ${body}`;
    ctx.fillText(stat.label, x + 36, y + 62);
    ctx.font = `800 84px ${display}`;
    ctx.fillText(stat.value, x + 36, y + 160);
  });

  // Stamp.
  ctx.save();
  ctx.translate(800, 1200);
  ctx.rotate(-0.18);
  ctx.strokeStyle = certified ? RED : INK;
  ctx.fillStyle = certified ? RED : INK;
  ctx.globalAlpha = certified ? 0.92 : 0.55;
  ctx.lineWidth = 8;
  roundRect(ctx, -230, -70, 460, 140, 18);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = `800 ${certified ? 44 : 36}px ${display}`;
  ctx.fillText(certified ? "CERTIFIED" : "IN PROGRESS", 0, -6);
  ctx.font = `800 ${certified ? 34 : 28}px ${display}`;
  ctx.fillText(certified ? "NEW YORKER" : `${info.lessonsTotal - info.lessonsDone} lessons to go`, 0, 42);
  ctx.restore();

  ctx.fillStyle = INK;
  ctx.font = `600 30px ${body}`;
  ctx.fillText("walkinhere.vercel.app", 80, 1270);
}

/** "Your NYC card": a shareable image of your progress. Drawn in the browser; nothing is uploaded. */
export function NycCard({ info, onClose }: { info: CardInfo; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("");
  const [canShare, setCanShare] = useState(false);
  const certified = info.lessonsDone >= info.lessonsTotal;
  const text = certified
    ? `I'm a Certified New Yorker on Walkin' Here! ${info.xp} XP and a ${info.streak}-day streak. walkinhere.vercel.app`
    : `My Walkin' Here! rank: ${info.rank}. ${info.lessonsDone}/${info.lessonsTotal} lessons, ${info.xp} XP. walkinhere.vercel.app`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([document.fonts.load("800 80px Outfit"), document.fonts.load("700 40px Figtree")]);
      } catch {
        // Fall back to system fonts.
      }
      const ctx = canvasRef.current?.getContext("2d");
      if (!cancelled && ctx) drawCard(ctx, info);
    })();
    setCanShare(typeof navigator !== "undefined" && "share" in navigator && "canShare" in navigator);
    return () => {
      cancelled = true;
    };
  }, [info]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toBlob(): Promise<Blob | null> {
    return new Promise((resolve) => canvasRef.current?.toBlob(resolve, "image/png") ?? resolve(null));
  }

  async function download() {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "walkin-here-nyc-card.png";
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Saved to your downloads.");
  }

  async function share() {
    const blob = await toBlob();
    if (!blob) return;
    const file = new File([blob], "walkin-here-nyc-card.png", { type: "image/png" });
    const payload = { files: [file], text };
    try {
      if (navigator.canShare(payload)) await navigator.share(payload);
      else await navigator.share({ text });
    } catch {
      // Closing the share sheet isn't an error worth showing.
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied. Paste it anywhere.");
    } catch {
      setStatus("Couldn't copy. Select the text above instead.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Your NYC card">
      <div className="nc-rise max-h-full w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-surface p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">{certified ? "You're a Certified New Yorker 🗽" : "Your NYC card"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-xl text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          role="img"
          aria-label={`NYC card for ${info.name}: ${info.rank}, ${info.xp} XP, ${info.streak}-day streak, ${info.lessonsDone} of ${info.lessonsTotal} lessons${certified ? ", certified New Yorker" : ""}`}
          className="mt-4 aspect-[4/5] w-full rounded-2xl border border-border shadow-md"
        />
        <p className="mt-3 text-sm text-muted-foreground">{text}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" onClick={download} className="font-bold">Download</Button>
          {canShare ? (
            <Button type="button" variant="outline" onClick={share} className="font-bold">Share</Button>
          ) : (
            <Button type="button" variant="outline" onClick={copy} className="font-bold">Copy text</Button>
          )}
        </div>
        {canShare && (
          <button type="button" onClick={copy} className="mt-2 w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground">
            Copy text instead
          </button>
        )}
        <p role="status" className="mt-2 min-h-5 text-center text-xs text-mint">{status}</p>
      </div>
    </div>
  );
}
