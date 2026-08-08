import { ArrowUpRight, X } from "lucide-react";

export default function ProjectModal({ project, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card project-modal glow-border"
        role="dialog"
        aria-modal="true"
        aria-label={project.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span className="modal-eyebrow">
            <span className="ref-tag mono">{project.ref || `P${project.id}`}</span>{" "}
            {project.tag}
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="Close project details">
            <X size={16} />
          </button>
        </div>

        <h3>{project.name}</h3>
        <p className="modal-sub">{project.description}</p>

        <div className="modal-foot">
          <span className="lang">
            <span className="lang-dot" /> {project.lang}
            {project.stars > 0 ? ` · ${project.stars}★` : ""}
          </span>
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Open repository <ArrowUpRight size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
