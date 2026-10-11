import { useEffect, useRef, useState } from "react";
import type { Project } from "./projects";

/**
 * The panel a project card opens: the story on the left (why it exists, what it does, what to try, what it's
 * built with), the live app running on the right. Esc, the close button or a click outside closes it.
 */
export function ProjectDetail({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [run, setRun] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (project && !d.open) d.showModal();
    if (!project && d.open) d.close();
    setLoaded(false);
    document.body.style.overflow = project ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [project]);

  const appUrl = project ? project.url + project.start : "";

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
          <button className="project-detail__close" type="button" onClick={onClose}>
            Close <span aria-hidden="true">×</span>
          </button>

          <div className="project-detail__story">
            <p className="project-detail__tags">
              {project.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </p>
            <h2 className="project-detail__title" id="project-detail-title">
              {project.name}
            </h2>
            <p className="project-detail__pitch">{project.pitch}</p>

            <h3 className="project-detail__heading">Why it exists</h3>
            <p>{project.why}</p>

            <h3 className="project-detail__heading">What it does</h3>
            <ul className="project-detail__list">
              {project.what.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>

            <h3 className="project-detail__heading">Try this</h3>
            <ol className="project-detail__steps">
              {project.tryThis.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>

            <h3 className="project-detail__heading">Built with</h3>
            <p className="project-detail__stack">{project.builtWith}</p>

            <a className="project-detail__cta" href={appUrl} target="_blank" rel="noreferrer">
              Open {project.name} <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="project-detail__stage">
            <div className="project-detail__toolbar">
              <span className="project-detail__address" translate="no">
                {appUrl.replace(/^https:\/\//, "")}
              </span>
              <button className="project-detail__tool" type="button" onClick={() => {
                  setLoaded(false);
                  setRun((r) => r + 1);
                }}>
                Restart
              </button>
              <a className="project-detail__tool" href={appUrl} target="_blank" rel="noreferrer">
                Open <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="project-detail__viewport">
              {!loaded && <p className="project-detail__status">Loading {project.name}…</p>}
              <iframe
                key={`${project.id}-${run}`}
                src={appUrl}
                title={`${project.name}, running live`}
                onLoad={() => setLoaded(true)}
              />
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
