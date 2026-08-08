import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Mail,
  ArrowUpRight,
  Menu,
  X,
  TerminalSquare,
  Cpu,
} from "lucide-react";
import { apiFetch, mediaUrl } from "../api/client";
import {
  FALLBACK_CONTENT,
  FALLBACK_EXPERIENCE,
  FALLBACK_PROJECTS,
  FALLBACK_SKILLS,
} from "../api/fallback";
import CircuitScene from "../components/CircuitScene";
import NetworkBackground from "../components/NetworkBackground";
import ProjectModal from "../components/ProjectModal";
import { Reveal, useReveal } from "../components/Reveal";
import { GitHubIcon, LinkedInIcon } from "../components/SocialIcons";
import "../styles/portfolio.css";

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#media", label: "Media" },
  { href: "#experience", label: "Experience" },
  { href: "#contact", label: "Contact" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export default function Portfolio() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [glowKey, setGlowKey] = useState(0);
  const [heroRef] = useReveal(0.05);

  const [content, setContent] = useState(FALLBACK_CONTENT);
  const [skills, setSkills] = useState(FALLBACK_SKILLS);
  const [projects, setProjects] = useState(FALLBACK_PROJECTS);
  const [experience, setExperience] = useState(FALLBACK_EXPERIENCE);
  const [media, setMedia] = useState([]);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [contactStatus, setContactStatus] = useState({ type: "", text: "" });
  const [contactSending, setContactSending] = useState(false);
  const [glowField, setGlowField] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, s, p, e, m] = await Promise.all([
          apiFetch("/api/content"),
          apiFetch("/api/skills"),
          apiFetch("/api/projects"),
          apiFetch("/api/experience"),
          apiFetch("/api/media"),
        ]);
        if (cancelled) return;
        setContent(c);
        setSkills(s);
        setProjects(p);
        setExperience(e);
        setMedia(m);
      } catch {
        // keep fallbacks
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = selectedProject || menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedProject, menuOpen]);

  const home = content.home || FALLBACK_CONTENT.home;
  const about = content.about || FALLBACK_CONTENT.about;
  const contact = content.contact || FALLBACK_CONTENT.contact;
  const brandParts = (home.brand || "MUDASSAR.HUSSAIN").split(".");

  const openProject = (project) => {
    setSelectedProject(project);
    setGlowKey((k) => k + 1);
  };

  return (
    <div className="page">
      <NetworkBackground />

      <nav className="nav">
        <a className="brand" href="#home">
          <span className="brand-mark">
            <Cpu size={16} />
          </span>
          {brandParts[0]}
          <span style={{ color: "var(--signal)" }}>.</span>
          {brandParts.slice(1).join(".") || "HUSSAIN"}
        </a>
        <div className="nav-links">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="nav-cta">
          <a
            className="icon-link"
            href={contact.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <GitHubIcon size={16} />
          </a>
          <button
            className="menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          <button
            className="icon-btn"
            style={{ alignSelf: "flex-end", width: 40, height: 40 }}
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
        </div>
      )}

      <header className="hero" id="home" ref={heroRef}>
        <motion.div
          className="hero-copy"
          initial={reduceMotion ? false : "hidden"}
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="eyebrow">{home.eyebrow}</span>
          <h1>
            {home.headline_line1}
            {home.headline_line1 && <br />}
            {home.headline_line2}
            {home.headline_accent ? (
              <>
                <br />
                <span className="accent">{home.headline_accent}</span>
              </>
            ) : null}
          </h1>
          {home.subheadline ? <p>{home.subheadline}</p> : null}
          <div className="hero-actions">
            <a href="#projects" className="btn btn-primary">
              {home.cta_primary} <ArrowUpRight size={15} />
            </a>
            <a href={`mailto:${contact.email}`} className="btn btn-ghost">
              {home.cta_secondary}
            </a>
          </div>
          <div className="hero-meta">
            <div>
              <div className="k">Repositories</div>
              <div className="v">{home.meta_repos}</div>
            </div>
            <div>
              <div className="k">Focus</div>
              <div className="v">{home.meta_focus}</div>
            </div>
            <div>
              <div className="k">Based in</div>
              <div className="v">{home.meta_location}</div>
            </div>
          </div>
        </motion.div>
        <CircuitScene />
      </header>

      <section id="about">
        <Reveal className="section-head">
          <span className="eyebrow">{about.eyebrow || "About"}</span>
          <h2>{about.title}</h2>
        </Reveal>
        <Reveal className="about-body" delay={60}>
          {(about.paragraphs || []).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </Reveal>
      </section>

      <section id="skills" className="skills-standalone">
        <Reveal className="section-head">
          <span className="eyebrow">Skills</span>
          <h2>Languages &amp; tools.</h2>
          <p>The stack I reach for when wiring hardware to intelligence.</p>
        </Reveal>
        <Reveal className="chip-panel" delay={80}>
          <span className="label">Toolkit</span>
          <div className="chips">
            {skills.map((s) => (
              <motion.span
                className="chip"
                key={s.id || s.name}
                whileHover={reduceMotion ? undefined : { scale: 1.04 }}
              >
                {s.name}
              </motion.span>
            ))}
          </div>
        </Reveal>
      </section>

      <section id="projects">
        <Reveal className="section-head">
          <span className="eyebrow">Projects</span>
          <h2></h2>
          
        </Reveal>
        <div className="project-grid">
          {projects.map((p, i) => (
            <Reveal
              as="article"
              className="project-card"
              delay={i * 90}
              key={p.id || p.name}
              role="button"
              tabIndex={0}
              onClick={() => openProject(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openProject(p);
                }
              }}
            >
              <div className="card-top">
                <span className="ref-tag mono">{p.ref || `P${p.id}`}</span>
                <span className="tag">{p.tag}</span>
              </div>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <div className="card-foot">
                <span className="lang">
                  <span className="lang-dot" /> {p.lang}
                  {p.stars > 0 ? ` · ${p.stars}★` : ""}
                </span>
                {p.github_url && (
                  <a
                    className="card-link"
                    href={p.github_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View repo <ArrowUpRight size={13} />
                  </a>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="media">
        <Reveal className="section-head">
          <span className="eyebrow">Media</span>
          <h2>Website Interfaces.</h2>
        </Reveal>
        {media.length === 0 ? (
          <p className="empty-hint">No media uploaded yet. Add project screenshots from Admin.</p>
        ) : (
          <div className="media-grid">
            {media.map((item, i) => (
              <Reveal className="media-card" delay={i * 70} key={item.id}>
                <img src={mediaUrl(item.image_url)} alt={item.name} />
                <div className="media-meta">
                  <h3>{item.name}</h3>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section id="experience">
        <Reveal className="section-head">
          <span className="eyebrow">Experience</span>
          <h2></h2>
        </Reveal>
        <div className="timeline">
          {experience.map((item, i) => (
            <Reveal className="timeline-item" delay={i * 80} key={item.id}>
              <h3>{item.title}</h3>
              <div className="meta">
                {item.company}
                {item.start_date || item.end_date
                  ? ` · ${item.start_date}${item.end_date ? ` – ${item.end_date}` : ""}`
                  : ""}
              </div>
              <p>{item.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {selectedProject && (
        <div key={glowKey} className="glow-burst" aria-hidden="true" />
      )}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      <section id="contact">
        <Reveal className="contact-panel contact-panel-form glow-border">
          <div className="contact-copy">
            <h2>{contact.title}</h2>
            <div className="contact-links">
              <a href={`mailto:${contact.email}`}>
                <Mail size={16} /> {contact.email}
              </a>
              <a href={contact.linkedin} target="_blank" rel="noreferrer">
                <LinkedInIcon size={16} /> {contact.linkedin_label || "LinkedIn"}
              </a>
              <a href={contact.github} target="_blank" rel="noreferrer">
                <GitHubIcon size={16} /> github.com/{contact.handle}
              </a>
            </div>
          </div>

          <form
            className="contact-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setContactStatus({ type: "", text: "" });
              setContactSending(true);
              setGlowField("submit");
              try {
                const res = await apiFetch("/api/contact", {
                  method: "POST",
                  body: JSON.stringify(contactForm),
                });
                setContactForm({ name: "", email: "", message: "" });
                setContactStatus({
                  type: "ok",
                  text: res?.message || "Message sent.",
                });
              } catch (err) {
                setContactStatus({
                  type: "err",
                  text: err.message || "Could not send message.",
                });
              } finally {
                setContactSending(false);
                window.setTimeout(() => setGlowField(""), 700);
              }
            }}
          >
            <label className={glowField === "name" ? "glow-active" : ""}>
              Name
              <input
                name="name"
                autoComplete="name"
                required
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm((f) => ({ ...f, name: e.target.value }))
                }
                onMouseDown={() => setGlowField("name")}
                onFocus={() => setGlowField("name")}
                onBlur={() => setGlowField((g) => (g === "name" ? "" : g))}
                placeholder="Your name"
              />
            </label>
            <label className={glowField === "email" ? "glow-active" : ""}>
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm((f) => ({ ...f, email: e.target.value }))
                }
                onMouseDown={() => setGlowField("email")}
                onFocus={() => setGlowField("email")}
                onBlur={() => setGlowField((g) => (g === "email" ? "" : g))}
                placeholder="you@email.com"
              />
            </label>
            <label className={glowField === "message" ? "glow-active" : ""}>
              Message
              <textarea
                name="message"
                required
                rows={4}
                value={contactForm.message}
                onChange={(e) =>
                  setContactForm((f) => ({ ...f, message: e.target.value }))
                }
                onMouseDown={() => setGlowField("message")}
                onFocus={() => setGlowField("message")}
                onBlur={() => setGlowField((g) => (g === "message" ? "" : g))}
                placeholder="What should we build together?"
              />
            </label>
            <button
              type="submit"
              className={`btn btn-primary btn-block contact-submit ${
                glowField === "submit" ? "glow-pulse" : ""
              }`}
              disabled={contactSending}
            >
              {contactSending ? "Sending…" : "Send message"}
            </button>
            {contactStatus.text && (
              <p
                className={
                  contactStatus.type === "err" ? "contact-err" : "contact-ok"
                }
              >
                {contactStatus.text}
              </p>
            )}
          </form>
        </Reveal>
      </section>

      <footer>
        <span>&copy; 2026 {home.name || "Mudassar Hussain"}</span>
        <span>BUILT WITH REACT &amp; FASTAPI</span>
      </footer>

      <button
        className="admin-fab"
        onClick={() => navigate("/admin")}
        type="button"
        aria-label="Admin"
      >
        <span className="dot" /> <TerminalSquare size={14} />
      </button>
    </div>
  );
}
