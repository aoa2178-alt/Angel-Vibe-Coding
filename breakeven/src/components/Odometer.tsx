const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Shows a formatted value (e.g. "$12,450") where each digit rolls to its new number like a mechanical counter.
 * Digit columns are keyed from the right, so ones stay ones when the number gets longer.
 * Screen readers get the plain text instead of the reels.
 */
export function Odometer({ text, className }: { text: string; className?: string }) {
  const chars = [...text];
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span className="odo" aria-hidden>
        {chars.map((ch, i) => {
          const fromRight = chars.length - i;
          if (!/\d/.test(ch)) {
            return (
              <span key={`s${fromRight}`} className="odo-digit">
                {ch}
              </span>
            );
          }
          return (
            <span key={`d${fromRight}`} className="odo-digit">
              <span className="odo-reel" style={{ transform: `translateY(-${Number(ch)}em)` }}>
                {DIGITS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
