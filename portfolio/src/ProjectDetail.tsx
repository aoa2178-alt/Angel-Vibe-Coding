import { useEffect, useRef, useState } from "react";
import type { Project } from "./projects";

const REPO = "https://github.com/aoa2178-alt/Angel-Vibe-Coding/tree/main";

/**
 * The panel a project card opens. A header with the tags and name runs across the top; below it, the story on the
 * left (why it exists, what it does, what to try, what it's built with) and, on the right, a screenshot of the app
 * that turns into the live app when "Try it here" is pressed. Esc, Close or a click outside closes it.
 */
export function ProjectDetail({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (project && !d.open) d.showModal();
    if (!project && d.open) d.close();
    setPlaying(false);
    setLoaded(false);
    document.body.style.overflow = project ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [project]);

  const appUrl = project ? project.url + project.start : "";
  const pad = (n: number) => String(n + 1).padStart(2, "0");

  return (
    <dialog
      ref={dialog}
      className="project-detail"
      aria-labelledby="project-detail-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      {project && (
        <div className="project-detail__panel">
          <header className="project-detail__header">
            <div>
              <p className="project-detail__tags">{project.tags.join(" · ")}</p>
              <h2 className="project-detail__title" id="project-detail-title">
                {project.name}
              </h2>
            </div>
            <button className="project-detail__close" type="button" onClick={onClose}>
              Close <span aria-hidden="true">×</span>
            </button>
          </header>

          <div className="project-detail__body">
            <div className="project-detail__story">
              <div className="project-detail__scroll" tabIndex={0} aria-label={`About ${project.name}`}>
                <p className="project-detail__pitch">{project.pitch}</p>

                <section className="project-detail__section">
                  <h3 className="project-detail__heading">Why it exists</h3>
                  <p>{project.why}</p>
                </section>

                <section className="project-detail__section">
                  <h3 className="project-detail__heading">What it does</h3>
                  <ul className="project-detail__list">
                    {project.what.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </section>

                <section className="project-detail__section">
                  <h3 className="project-detail__heading">Try this</h3>
                  <ol className="project-detail__steps">
                    {project.tryThis.map((t, i) => (
                      <li key={t}>
                        <span aria-hidden="true">{pad(i)}</span>
                        {t}
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="project-detail__section">
                  <h3 className="project-detail__heading">Built with</h3>
                  <p>{project.builtWith}</p>
                </section>
              </div>

              <div className="project-detail__actions">
                <a className="project-detail__cta" href={appUrl} target="_blank" rel="noreferrer">
                  Open {project.name} <span aria-hidden="true">↗</span>
                </a>
                <a
                  className="project-detail__github"
                  href={`${REPO}/${project.id}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${project.name} source on GitHub`}
                  title={`${project.name} source on GitHub`}
                >
                  <svg viewBox="0 0 16 16" width="22" height="22" fill="currentColor" aria-hidden="true">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="project-detail__stage">
              <div className="project-detail__toolbar">
                <span className="project-detail__address" translate="no">
                  {project.url.replace(/^https:\/\//, "")}
                </span>
                {playing && (
                  <button
                    className="project-detail__tool"
                    type="button"
                    onClick={() => {
                      setLoaded(false);
                      setRun((r) => r + 1);
                    }}
                  >
                    Restart
                  </button>
                )}
                <a className="project-detail__tool" href={appUrl} target="_blank" rel="noreferrer">
                  Open full site <span aria-hidden="true">↗</span>
                </a>
              </div>

              <div className="project-detail__viewport">
                {playing ? (
                  <>
                    {!loaded && <p className="project-detail__status">Loading {project.name}…</p>}
                    <iframe
                      key={`${project.id}-${run}`}
                      src={appUrl}
                      title={`${project.name}, running live`}
                      onLoad={() => setLoaded(true)}
                    />
                  </>
                ) : (
                  <div className="project-detail__preview">
                    <img src={`/shots/${project.id}.jpg`} alt={`${project.name}: the first step of the app`} width={1280} height={800} />
                    <button className="project-detail__try" type="button" onClick={() => setPlaying(true)}>
                      <span aria-hidden="true">▶</span> Try it here
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
