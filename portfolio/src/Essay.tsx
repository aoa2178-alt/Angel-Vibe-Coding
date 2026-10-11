import { useEffect } from "react";
import { Link } from "react-router";
import mathematics from "./essays/mathematics.md?raw";
import tennis from "./essays/tennis.md?raw";
import paris from "./essays/paris.md?raw";

/** The essays, keyed by the slug used in /blog/:slug. Text comes straight from the Markdown files. */
export const essays: Record<string, string> = { mathematics, tennis, paris };
export const essayOrder = ["mathematics", "tennis", "paris"];

type Block =
  | { kind: "title"; text: string }
  | { kind: "meta"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "para"; text: string };

/** The essays only use a title, a byline, pull quotes and paragraphs, so that's all this reads. */
function parse(md: string): Block[] {
  return md
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): Block => {
      if (chunk.startsWith("# ")) return { kind: "title", text: chunk.slice(2) };
      if (/^_.*_$/.test(chunk)) return { kind: "meta", text: chunk.slice(1, -1) };
      if (chunk.startsWith(">")) return { kind: "quote", text: chunk.replace(/^>\s?/gm, "") };
      return { kind: "para", text: chunk.replace(/\n/g, " ") };
    });
}

export function EssayArticle({ slug }: { slug: string }) {
  const md = essays[slug];
  const blocks = md ? parse(md) : [];
  const title = blocks.find((b) => b.kind === "title")?.text;
  const at = essayOrder.indexOf(slug);
  const next = essayOrder[(at + 1) % essayOrder.length];
  const nextTitle = parse(essays[next]).find((b) => b.kind === "title")?.text;

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = title ? `${title} | Toki's Blog` : "Toki's Blog";
  }, [slug, title]);

  if (!md) {
    return (
      <section className="essay-page">
        <p className="essay-page__back">
          <Link to="/blog#thinking">← All writing</Link>
        </p>
        <h1 className="essay-page__title">That essay isn’t here.</h1>
      </section>
    );
  }

  // The first pull quote sits under the byline as the standfirst; the rest break up the text.
  let lede = true;
  return (
    <article className="essay-page">
      <p className="essay-page__back">
        <Link to="/blog#thinking">← All writing</Link>
      </p>
      {blocks.map((b, i) => {
        if (b.kind === "title") return <h1 key={i} className="essay-page__title">{b.text}</h1>;
        if (b.kind === "meta") return <p key={i} className="essay-page__meta">{b.text}</p>;
        if (b.kind === "quote") {
          const cls = lede ? "essay-page__lede" : "essay-page__quote";
          lede = false;
          return <blockquote key={i} className={cls}>{b.text}</blockquote>;
        }
        lede = false;
        return <p key={i} className="essay-page__para">{b.text}</p>;
      })}
      <nav className="essay-page__next" aria-label="Next essay">
        <span>Next</span>
        <Link to={`/blog/${next}`}>{nextTitle} →</Link>
      </nav>
    </article>
  );
}
