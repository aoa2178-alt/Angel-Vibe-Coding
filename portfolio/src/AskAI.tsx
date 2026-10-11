import { useEffect, useRef, useState } from "react";

const SITE = "https://angel-ade-oduntan.vercel.app";

const PROMPT = [
  "Tell me about Angel Toki Ade-Oduntan, a strategy and operations professional focused on AI and infrastructure-intensive companies.",
  `Start by reading the portfolio summary at ${SITE}/llms.txt and the portfolio itself at ${SITE}/.`,
  "Then give a balanced overview: Angel's experience, the ten builds and what they show about how Angel thinks, and the strategy and operations roles Angel would fit.",
].join(" ");

const providers = [
  { name: "ChatGPT", href: `https://chatgpt.com/?q=${encodeURIComponent(PROMPT)}` },
  { name: "Claude", href: `https://claude.ai/new?q=${encodeURIComponent(PROMPT)}` },
];

/** A floating "Ask AI about Angel" button: opens ChatGPT or Claude with a question about Angel ready to send. */
export function AskAI() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="ask-ai" ref={box}>
      {open && (
        <div className="ask-ai__panel" id="ask-ai-panel" role="dialog" aria-label="Ask AI about Angel">
          <p className="ask-ai__title">Ask AI about Angel</p>
          <p className="ask-ai__copy">
            Opens your AI assistant with this question ready to send. It reads a plain-text summary of this
            portfolio, so the answer starts from the facts here.
          </p>
          <p className="ask-ai__prompt">{PROMPT}</p>
          <div className="ask-ai__actions">
            {providers.map((p) => (
              <a key={p.name} className="ask-ai__provider" href={p.href} target="_blank" rel="noreferrer">
                Ask {p.name} <span aria-hidden="true">↗</span>
              </a>
            ))}
            <button className="ask-ai__copybtn" type="button" onClick={copy}>
              {copied ? "Copied" : "Copy question"}
            </button>
          </div>
          <a className="ask-ai__source" href="/llms.txt" target="_blank" rel="noreferrer">
            Read the summary (llms.txt)
          </a>
        </div>
      )}
      <button
        className="ask-ai__trigger"
        type="button"
        aria-expanded={open}
        aria-controls="ask-ai-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">✦</span> Ask AI about me
      </button>
    </div>
  );
}
