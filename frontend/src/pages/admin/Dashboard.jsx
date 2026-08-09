import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Home,
  Sparkles,
  FolderKanban,
  Images,
  Briefcase,
  Mail,
  LogOut,
  ExternalLink,
  Plus,
  Trash2,
  Pencil,
  Upload,
  RefreshCw,
  Download,
  RotateCcw,
} from "lucide-react";
import { apiFetch, mediaUrl } from "../../api/client";
import { getLocalData, resetLocalDataToDefaults } from "../../api/fallback";
import { useAuth } from "../../context/AuthContext";
import "../../styles/portfolio.css";

const TABS = [
  { id: "Home", label: "Home", icon: Home },
  { id: "Skills", label: "Skills", icon: Sparkles },
  { id: "Projects", label: "Projects", icon: FolderKanban },
  { id: "Experience", label: "Experience", icon: Briefcase },
  { id: "Media", label: "Media", icon: Images },
  { id: "Messages", label: "Messages", icon: Mail },
];

const emptyProject = {
  ref: "",
  name: "",
  github_url: "",
  live_url: "",
  description: "",
  tag: "",
  lang: "",
  stars: 0,
  caption: "",
  sort_order: 0,
};

const emptyExperience = {
  title: "",
  company: "",
  start_date: "",
  end_date: "",
  description: "",
  sort_order: 0,
};

export default function AdminDashboard() {
  const { isAuthenticated, ready, logout } = useAuth();
  const [tab, setTab] = useState("Home");
  const [content, setContent] = useState({ home: {}, about: {}, contact: {} });
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [experience, setExperience] = useState([]);
  const [media, setMedia] = useState([]);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [skillName, setSkillName] = useState("");
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [expForm, setExpForm] = useState(emptyExperience);
  const [editingExpId, setEditingExpId] = useState(null);

  const flash = (text, isError = false) => {
    setMsg(isError ? "" : text);
    setErr(isError ? text : "");
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s, p, e, m, inbox] = await Promise.all([
        apiFetch("/api/content"),
        apiFetch("/api/skills"),
        apiFetch("/api/projects"),
        apiFetch("/api/experience"),
        apiFetch("/api/media"),
        apiFetch("/api/contact/messages").catch(() => []),
      ]);
      setContent(c);
      setSkills(s);
      setProjects(p);
      setExperience(e);
      setMedia(m);
      setMessages(inbox || []);
      flash("");
    } catch (e) {
      flash(e.message, true);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportPortfolioData = () => {
    const currentData = getLocalData();
    const codeStr = `export const INITIAL_PORTFOLIO_DATA = ${JSON.stringify(
      currentData,
      null,
      2
    )};\n`;
    const blob = new Blob([codeStr], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolioData.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    flash(
      "Exported portfolioData.js — replace frontend/src/data/portfolioData.js with this file to save changes permanently to repository code!"
    );
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAll();
  }, [isAuthenticated, loadAll]);

  if (ready && !isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const saveContentSection = async (key, value) => {
    try {
      const updated = await apiFetch("/api/content", {
        method: "PUT",
        body: JSON.stringify({ [key]: value }),
      });
      setContent(updated);
      flash("Saved — portfolio updated live!");
    } catch (e) {
      flash(e.message, true);
    }
  };

  const activeTab = TABS.find((t) => t.id === tab) || TABS[0];

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <div className="admin-brand">
          <span className="admin-brand-mark">
            <LayoutDashboard size={16} />
          </span>
          <div>
            <h1>Portfolio CMS</h1>
            <p>
              Stored directly in frontend data · changes appear instantly on live site
            </p>
          </div>
        </div>
        <div className="admin-row" style={{ flexWrap: "wrap", gap: "8px" }}>
          <button
            type="button"
            className="btn btn-ghost admin-icon-btn"
            onClick={() => loadAll()}
            title="Reload data"
          >
            <RefreshCw size={14} /> Refresh
          </button>

          <button
            type="button"
            className="btn btn-primary admin-icon-btn"
            onClick={exportPortfolioData}
            title="Export data file to save into code"
          >
            <Download size={14} /> Export portfolioData.js
          </button>

          <button
            type="button"
            className="btn btn-ghost admin-icon-btn"
            onClick={() => {
              if (
                confirm(
                  "Reset local changes and restore original defaults from code?"
                )
              ) {
                resetLocalDataToDefaults();
                loadAll();
                flash("Reset to code defaults.");
              }
            }}
            title="Reset local changes"
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>

          <Link to="/" className="btn btn-ghost admin-icon-btn" target="_blank">
            <ExternalLink size={14} /> View site
          </Link>
          <button
            type="button"
            className="btn btn-ghost admin-icon-btn"
            onClick={() => logout()}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-nav">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                className={tab === t.id ? "active" : ""}
                onClick={() => {
                  setTab(t.id);
                  setMsg("");
                  setErr("");
                }}
              >
                <Icon size={15} />
                <span>{t.label}</span>
                {t.id === "Messages" && messages.length > 0 && (
                  <span className="admin-badge">{messages.length}</span>
                )}
              </button>
            );
          })}
        </aside>

        <main className="admin-main">
          <div className="admin-section-title">
            <h2>{activeTab.label}</h2>
            <p>
              Changes are stored in the API database and appear on the public
              portfolio when visitors load or reload the site.
            </p>
          </div>

          {msg && <p className="admin-msg">{msg}</p>}
          {err && <p className="admin-err">{err}</p>}
          {loading && <p className="empty-hint">Loading…</p>}

          {!loading && tab === "Home" && (
            <div className="admin-card">
              <h3>Hero / Home</h3>
              <form
                className="admin-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveContentSection("home", {
                    ...content.home,
                    // keep about/contact linked fields if needed
                  });
                }}
              >
                {[
                  ["name", "Display name"],
                  ["brand", "Brand text"],
                  ["eyebrow", "Eyebrow"],
                  ["headline_line1", "Headline line 1"],
                  ["headline_line2", "Headline line 2"],
                  ["headline_accent", "Accent word"],
                  ["cta_primary", "Primary CTA"],
                  ["cta_secondary", "Secondary CTA"],
                  ["meta_repos", "Meta · Repositories"],
                  ["meta_focus", "Meta · Focus"],
                  ["meta_location", "Meta · Location"],
                ].map(([field, label]) => (
                  <label key={field}>
                    {label}
                    <input
                      value={content.home?.[field] || ""}
                      onChange={(e) =>
                        setContent((c) => ({
                          ...c,
                          home: { ...c.home, [field]: e.target.value },
                        }))
                      }
                    />
                  </label>
                ))}
                <label>
                  Subheadline
                  <textarea
                    value={content.home?.subheadline || ""}
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        home: { ...c.home, subheadline: e.target.value },
                      }))
                    }
                  />
                </label>

                <div className="admin-divider" />
                <h3>About text (shown on site)</h3>
                <label>
                  About title
                  <input
                    value={content.about?.title || ""}
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        about: { ...c.about, title: e.target.value },
                      }))
                    }
                  />
                </label>
                <label>
                  About paragraphs (blank line between each)
                  <textarea
                    style={{ minHeight: 160 }}
                    value={(content.about?.paragraphs || []).join("\n\n")}
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        about: {
                          ...c.about,
                          paragraphs: e.target.value
                            .split(/\n\s*\n/)
                            .map((p) => p.trim())
                            .filter(Boolean),
                        },
                      }))
                    }
                  />
                </label>

                <div className="admin-divider" />
                <h3>Contact links</h3>
                {[
                  ["title", "Contact title"],
                  ["email", "Email"],
                  ["github", "GitHub URL"],
                  ["linkedin", "LinkedIn URL"],
                  ["handle", "GitHub handle"],
                  ["linkedin_label", "LinkedIn label"],
                ].map(([field, label]) => (
                  <label key={field}>
                    {label}
                    <input
                      value={content.contact?.[field] || ""}
                      onChange={(e) =>
                        setContent((c) => ({
                          ...c,
                          contact: { ...c.contact, [field]: e.target.value },
                        }))
                      }
                    />
                  </label>
                ))}

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      const updated = await apiFetch("/api/content", {
                        method: "PUT",
                        body: JSON.stringify({
                          home: content.home,
                          about: content.about,
                          contact: content.contact,
                        }),
                      });
                      setContent(updated);
                      flash("Home / About / Contact saved.");
                    } catch (ex) {
                      flash(ex.message, true);
                    }
                  }}
                >
                  Save Home content
                </button>
              </form>
            </div>
          )}

          {!loading && tab === "Skills" && (
            <div className="admin-card">
              <h3>Skills</h3>
              <form
                className="admin-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!skillName.trim()) return;
                  try {
                    await apiFetch("/api/skills", {
                      method: "POST",
                      body: JSON.stringify({
                        name: skillName.trim(),
                        sort_order: skills.length,
                      }),
                    });
                    setSkillName("");
                    await loadAll();
                    flash("Skill added.");
                  } catch (ex) {
                    flash(ex.message, true);
                  }
                }}
              >
                <div className="admin-row">
                  <input
                    style={{ flex: 1, minWidth: 180 }}
                    placeholder="e.g. OpenCV"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary">
                    <Plus size={14} /> Add skill
                  </button>
                </div>
              </form>
              <div className="admin-chip-list">
                {skills.map((s) => (
                  <div className="admin-chip-item" key={s.id}>
                    <span>{s.name}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Delete ${s.name}`}
                      onClick={async () => {
                        try {
                          await apiFetch(`/api/skills/${s.id}`, {
                            method: "DELETE",
                          });
                          await loadAll();
                          flash("Skill removed.");
                        } catch (ex) {
                          flash(ex.message, true);
                        }
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && tab === "Projects" && (
            <>
              <div className="admin-card">
                <h3>{editingProjectId ? "Edit project" : "Add project"}</h3>
                <form
                  className="admin-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      if (editingProjectId) {
                        await apiFetch(`/api/projects/${editingProjectId}`, {
                          method: "PUT",
                          body: JSON.stringify(projectForm),
                        });
                        flash("Project updated.");
                      } else {
                        await apiFetch("/api/projects", {
                          method: "POST",
                          body: JSON.stringify({
                            ...projectForm,
                            sort_order: projects.length,
                          }),
                        });
                        flash("Project created.");
                      }
                      setProjectForm(emptyProject);
                      setEditingProjectId(null);
                      await loadAll();
                    } catch (ex) {
                      flash(ex.message, true);
                    }
                  }}
                >
                  {[
                    ["name", "Project name", true],
                    ["github_url", "GitHub link", false],
                    ["live_url", "Live website URL", false],
                    ["tag", "Tag (e.g. ML · WEB)", false],
                    ["lang", "Language", false],
                    ["ref", "Ref code", false],
                    ["caption", "Media caption", false],
                  ].map(([key, label, required]) => (
                    <label key={key}>
                      {label}
                      <input
                        value={projectForm[key]}
                        required={required}
                        onChange={(e) =>
                          setProjectForm((f) => ({
                            ...f,
                            [key]: e.target.value,
                          }))
                        }
                      />
                    </label>
                  ))}
                  <label>
                    Description
                    <textarea
                      value={projectForm.description}
                      onChange={(e) =>
                        setProjectForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="admin-row">
                    <button type="submit" className="btn btn-primary">
                      {editingProjectId ? "Update project" : "Create project"}
                    </button>
                    {editingProjectId && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setEditingProjectId(null);
                          setProjectForm(emptyProject);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="admin-card">
                <h3>All projects</h3>
                <div className="item-list">
                  {projects.map((p) => (
                    <div className="item-row" key={p.id}>
                      <div className="item-row-main">
                        {p.image_url ? (
                          <img
                            className="thumb-sm"
                            src={mediaUrl(p.image_url)}
                            alt=""
                          />
                        ) : (
                          <div className="thumb-sm thumb-empty">No image</div>
                        )}
                        <div>
                          <h3>{p.name}</h3>
                          <p>{p.github_url || "No GitHub link"}</p>
                          <label className="admin-upload">
                            <Upload size={13} /> Website screenshot
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={async (ev) => {
                                const file = ev.target.files?.[0];
                                if (!file) return;
                                const fd = new FormData();
                                fd.append("file", file);
                                try {
                                  await apiFetch(
                                    `/api/projects/${p.id}/image`,
                                    { method: "POST", body: fd }
                                  );
                                  await loadAll();
                                  flash("Screenshot uploaded → Media gallery.");
                                } catch (ex) {
                                  flash(ex.message, true);
                                } finally {
                                  ev.target.value = "";
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="admin-row">
                        <button
                          type="button"
                          className="btn btn-ghost admin-icon-btn"
                          onClick={() => {
                            setEditingProjectId(p.id);
                            setProjectForm({
                              ref: p.ref || "",
                              name: p.name || "",
                              github_url: p.github_url || "",
                              live_url: p.live_url || "",
                              description: p.description || "",
                              tag: p.tag || "",
                              lang: p.lang || "",
                              stars: p.stars || 0,
                              caption: p.caption || "",
                              sort_order: p.sort_order || 0,
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost admin-icon-btn"
                          onClick={async () => {
                            if (!confirm(`Delete ${p.name}?`)) return;
                            try {
                              await apiFetch(`/api/projects/${p.id}`, {
                                method: "DELETE",
                              });
                              await loadAll();
                              flash("Project deleted.");
                            } catch (ex) {
                              flash(ex.message, true);
                            }
                          }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!loading && tab === "Experience" && (
            <>
              <div className="admin-card">
                <h3>{editingExpId ? "Edit experience" : "Add experience"}</h3>
                <form
                  className="admin-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      if (editingExpId) {
                        await apiFetch(`/api/experience/${editingExpId}`, {
                          method: "PUT",
                          body: JSON.stringify(expForm),
                        });
                        flash("Experience updated.");
                      } else {
                        await apiFetch("/api/experience", {
                          method: "POST",
                          body: JSON.stringify({
                            ...expForm,
                            sort_order: experience.length,
                          }),
                        });
                        flash("Experience created.");
                      }
                      setExpForm(emptyExperience);
                      setEditingExpId(null);
                      await loadAll();
                    } catch (ex) {
                      flash(ex.message, true);
                    }
                  }}
                >
                  {[
                    ["title", "Title / Role"],
                    ["company", "Company / Org"],
                    ["start_date", "Start"],
                    ["end_date", "End"],
                  ].map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        value={expForm[key]}
                        required={key === "title"}
                        onChange={(e) =>
                          setExpForm((f) => ({ ...f, [key]: e.target.value }))
                        }
                      />
                    </label>
                  ))}
                  <label>
                    Description
                    <textarea
                      value={expForm.description}
                      onChange={(e) =>
                        setExpForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="admin-row">
                    <button type="submit" className="btn btn-primary">
                      {editingExpId ? "Update" : "Add entry"}
                    </button>
                    {editingExpId && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setEditingExpId(null);
                          setExpForm(emptyExperience);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
              <div className="admin-card">
                <h3>Timeline</h3>
                <div className="item-list">
                  {experience.map((item) => (
                    <div className="item-row" key={item.id}>
                      <div>
                        <h3>{item.title}</h3>
                        <p>
                          {item.company} · {item.start_date} – {item.end_date}
                        </p>
                      </div>
                      <div className="admin-row">
                        <button
                          type="button"
                          className="btn btn-ghost admin-icon-btn"
                          onClick={() => {
                            setEditingExpId(item.id);
                            setExpForm({
                              title: item.title,
                              company: item.company,
                              start_date: item.start_date,
                              end_date: item.end_date,
                              description: item.description,
                              sort_order: item.sort_order,
                            });
                          }}
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost admin-icon-btn"
                          onClick={async () => {
                            try {
                              await apiFetch(`/api/experience/${item.id}`, {
                                method: "DELETE",
                              });
                              await loadAll();
                              flash("Deleted.");
                            } catch (ex) {
                              flash(ex.message, true);
                            }
                          }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!loading && tab === "Media" && (
            <div className="admin-card">
              <h3>Media gallery</h3>
              <p className="admin-hint">
                Website screenshots uploaded on Projects appear here with the
                project name — and on the public Media section.
              </p>
              {media.length === 0 ? (
                <p className="empty-hint">
                  No media yet. Open Projects and upload a website screenshot.
                </p>
              ) : (
                <div className="media-grid">
                  {media.map((item) => (
                    <div className="media-card" key={item.id}>
                      <img src={mediaUrl(item.image_url)} alt={item.name} />
                      <div className="media-meta">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                          <div>
                            <h3>{item.name}</h3>
                            <p>{item.caption || "Website interface"}</p>
                          </div>
                          <button
                            type="button"
                            className="btn btn-ghost admin-icon-btn"
                            title={`Delete media for ${item.name}`}
                            style={{ color: "#f87171", flexShrink: 0 }}
                            onClick={async () => {
                              if (!confirm(`Delete media screenshot for "${item.name}"?`)) return;
                              try {
                                await apiFetch(`/api/media/${item.id}`, {
                                  method: "DELETE",
                                });
                                await loadAll();
                                flash("Media item deleted.");
                              } catch (ex) {
                                flash(ex.message, true);
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && tab === "Messages" && (
            <div className="admin-card">
              <h3>Messages from visitors</h3>
              <p className="admin-hint">
                Submissions from the public contact form (name, email, message).
              </p>
              {messages.length === 0 ? (
                <p className="empty-hint">No messages yet.</p>
              ) : (
                <div className="item-list">
                  {messages.map((m) => (
                    <div className="item-row message-row" key={m.id}>
                      <div style={{ flex: 1 }}>
                        <h3>{m.name}</h3>
                        <p>
                          <a href={`mailto:${m.email}`}>{m.email}</a>
                          {m.created_at
                            ? ` · ${new Date(m.created_at).toLocaleString()}`
                            : ""}
                        </p>
                        <p className="message-body">{m.message}</p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost admin-icon-btn"
                        title="Delete message"
                        style={{ color: "#f87171" }}
                        onClick={async () => {
                          if (!confirm(`Delete message from "${m.name}"?`)) return;
                          try {
                            await apiFetch(`/api/contact/messages/${m.id}`, {
                              method: "DELETE",
                            });
                            await loadAll();
                            flash("Message deleted.");
                          } catch (ex) {
                            flash(ex.message, true);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
