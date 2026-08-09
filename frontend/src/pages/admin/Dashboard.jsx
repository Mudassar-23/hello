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
  Video,
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
  { id: "Certifications", label: "Certifications", icon: Upload },
  { id: "Honors", label: "Honors & Awards", icon: Sparkles },
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
  const [certifications, setCertifications] = useState([]);
  const [honors, setHonors] = useState([]);
  const emptyCert = { name: "", issuer: "", issue_date: "", sort_order: 0 };
  const emptyHonor = { title: "", issuer: "", issue_date: "", description: "", url: "", associated_with: "", sort_order: 0 };
  const [certForm, setCertForm] = useState(emptyCert);
  const [honorForm, setHonorForm] = useState(emptyHonor);
  const [editingCertId, setEditingCertId] = useState(null);
  const [editingHonorId, setEditingHonorId] = useState(null);

  const flash = (text, isError = false) => {
    setMsg(isError ? "" : text);
    setErr(isError ? text : "");
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s, p, e, m, inbox, certs, honorsData] = await Promise.all([
        apiFetch("/api/content"),
        apiFetch("/api/skills"),
        apiFetch("/api/projects"),
        apiFetch("/api/experience"),
        apiFetch("/api/media"),
        apiFetch("/api/contact/messages").catch(() => []),
        apiFetch("/api/certifications").catch(() => []),
        apiFetch("/api/honors").catch(() => []),
      ]);
      setContent(c);
      setSkills(s);
      setProjects(p);
      setExperience(e);
      setMedia(m);
      setMessages(inbox || []);
      setCertifications(certs || []);
      setHonors(honorsData || []);
      flash("");
    } catch (e) {
      flash(e.message, true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDragStart = (e, index, type) => {
    e.dataTransfer.setData("type", type);
    e.dataTransfer.setData("index", index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetIndex, type) => {
    e.preventDefault();
    const draggedType = e.dataTransfer.getData("type");
    if (draggedType !== type) return;

    const sourceIndex = parseInt(e.dataTransfer.getData("index"), 10);
    if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;

    let items = type === "projects" ? [...projects] : [...media];
    const [moved] = items.splice(sourceIndex, 1);
    items.splice(targetIndex, 0, moved);

    const originalSortOrders = (type === "projects" ? projects : media)
      .map((i) => i.sort_order || 0)
      .sort((a, b) => a - b);

    items = items.map((item, idx) => ({
      ...item,
      sort_order: originalSortOrders[idx],
    }));

    if (type === "projects") setProjects(items);
    else setMedia(items);

    try {
      await Promise.all(
        items.map((item) =>
          apiFetch(`/api/projects/${item.id}`, {
            method: "PUT",
            body: JSON.stringify({ sort_order: item.sort_order }),
          })
        )
      );
      flash(`${type} order saved!`);
      loadAll();
    } catch (ex) {
      flash("Failed to save order: " + ex.message, true);
      loadAll();
    }
  };

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
                  {projects.map((p, idx) => (
                    <div
                      className="item-row"
                      key={p.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx, "projects")}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, idx, "projects")}
                      style={{ cursor: "grab" }}
                    >
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
                Project screenshots &amp; 50MB+ video demos uploaded here appear on the public Media section.
                Videos up to 50MB+ are stored safely in client IndexedDB, or place static MP4 files in <code>frontend/public/videos/</code>.
              </p>
              {media.length === 0 ? (
                <p className="empty-hint">
                  No media yet. Open Projects and upload a website screenshot.
                </p>
              ) : (
                <div className="media-grid">
                  {media.map((item, idx) => (
                    <div
                      className="media-card"
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx, "media")}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, idx, "media")}
                      style={{ position: "relative", cursor: "grab" }}
                    >
                      <div style={{ position: "relative" }}>
                        <img src={mediaUrl(item.image_url)} alt={item.name} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                        <button
                          type="button"
                          className="btn btn-ghost"
                          title={`Delete media for ${item.name}`}
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            background: "rgba(10, 15, 12, 0.82)",
                            border: "1px solid rgba(248, 113, 113, 0.4)",
                            color: "#f87171",
                            borderRadius: "6px",
                            padding: "5px 8px",
                            cursor: "pointer",
                            backdropFilter: "blur(4px)",
                          }}
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
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div>
                          <h3 style={{ margin: "0 0 2px", fontSize: "14.5px", fontWeight: 600, color: "var(--text)" }}>
                            {item.name}
                          </h3>
                          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-dim)" }}>
                            {item.caption || "Website interface"}
                          </p>
                        </div>

                        <div
                          style={{
                            paddingTop: "10px",
                            borderTop: "1px solid var(--line)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <label
                              className="btn btn-ghost"
                              style={{
                                margin: 0,
                                fontSize: "11.5px",
                                padding: "5px 10px",
                                color: "var(--signal)",
                                border: "1px solid rgba(110,231,183,0.3)",
                                background: "rgba(110,231,183,0.08)",
                                borderRadius: "6px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <Video size={13} /> {item.video_url ? "Change Video" : "Upload Video"}
                              <input
                                type="file"
                                accept="video/mp4,video/webm,video/ogg"
                                style={{ display: "none" }}
                                onChange={async (ev) => {
                                  const file = ev.target.files?.[0];
                                  if (!file) return;
                                  const fd = new FormData();
                                  fd.append("file", file);
                                  try {
                                    await apiFetch(`/api/media/${item.id}/video`, {
                                      method: "POST",
                                      body: fd,
                                    });
                                    await loadAll();
                                    flash("Project video uploaded successfully!");
                                  } catch (ex) {
                                    flash(ex.message, true);
                                  } finally {
                                    ev.target.value = "";
                                  }
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{
                                fontSize: "11.5px",
                                padding: "5px 10px",
                                borderRadius: "6px",
                                border: "1px solid var(--line)",
                                color: "var(--text-dim)",
                              }}
                              onClick={async () => {
                                const url = prompt(
                                  "Enter Video Link (YouTube URL or MP4 direct link):",
                                  item.video_url || ""
                                );
                                if (url === null) return;
                                try {
                                  await apiFetch(`/api/media/${item.id}`, {
                                    method: "PUT",
                                    body: JSON.stringify({ video_url: url.trim() }),
                                  });
                                  await loadAll();
                                  flash("Video URL updated.");
                                } catch (ex) {
                                  flash(ex.message, true);
                                }
                              }}
                            >
                              Paste Link
                            </button>
                          </div>

                          {item.video_url && (
                            <span
                              style={{
                                fontSize: "11px",
                                color: "var(--signal)",
                                fontFamily: "'JetBrains Mono', monospace",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              ✓ Video Attached
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CERTIFICATIONS TAB ─────────────────────────────────────── */}
          {!loading && tab === "Certifications" && (
            <div className="admin-card">
              <h3>Certifications</h3>
              <p className="admin-hint">Add certifications with name, issuer, date and upload the PDF file. Files are stored in backend and synced to frontend.</p>

              {/* Add / Edit Form */}
              <div className="form-block" style={{ marginBottom: 24 }}>
                <h4 style={{ color: "var(--signal)", fontSize: 13, marginBottom: 12 }}>{editingCertId ? "Edit Certification" : "Add New Certification"}</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div className="field-group">
                    <label>Name *</label>
                    <input value={certForm.name} onChange={(e) => setCertForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. AWS Cloud Practitioner" />
                  </div>
                  <div className="field-group">
                    <label>Issuer</label>
                    <input value={certForm.issuer} onChange={(e) => setCertForm((f) => ({ ...f, issuer: e.target.value }))} placeholder="e.g. Amazon Web Services" />
                  </div>
                  <div className="field-group">
                    <label>Issue Date</label>
                    <input value={certForm.issue_date} onChange={(e) => setCertForm((f) => ({ ...f, issue_date: e.target.value }))} placeholder="e.g. Jan 2026" />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!certForm.name.trim()}
                    onClick={async () => {
                      try {
                        if (editingCertId) {
                          await apiFetch(`/api/certifications/${editingCertId}`, { method: "PUT", body: JSON.stringify(certForm) });
                          flash("Certification updated!");
                        } else {
                          await apiFetch("/api/certifications", { method: "POST", body: JSON.stringify(certForm) });
                          flash("Certification added!");
                        }
                        setCertForm(emptyCert);
                        setEditingCertId(null);
                        await loadAll();
                      } catch (ex) { flash(ex.message, true); }
                    }}
                  >{editingCertId ? "Update" : "Add Certification"}</button>
                  {editingCertId && (
                    <button type="button" className="btn btn-ghost" onClick={() => { setCertForm(emptyCert); setEditingCertId(null); }}>Cancel</button>
                  )}
                </div>
              </div>

              {/* List */}
              {certifications.length === 0 ? (
                <p className="empty-hint">No certifications yet. Add one above.</p>
              ) : (
                <div className="item-list">
                  {certifications.map((cert) => (
                    <div className="item-row" key={cert.id} style={{ alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: "0 0 4px", fontSize: 14 }}>{cert.name}</h3>
                        <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--text-dim)" }}>
                          {cert.issuer}{cert.issue_date ? ` · ${cert.issue_date}` : ""}
                        </p>
                        {cert.pdf_url ? (
                          <a href={cert.pdf_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--signal)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            📄 View PDF
                          </a>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--text-faint)" }}>No PDF uploaded</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        {/* Upload PDF button */}
                        <label className="btn btn-ghost" style={{ fontSize: "11.5px", padding: "5px 10px", color: "var(--signal)", border: "1px solid rgba(110,231,183,0.3)", background: "rgba(110,231,183,0.08)", borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <Upload size={12} /> {cert.pdf_url ? "Replace PDF" : "Upload PDF"}
                          <input
                            type="file"
                            accept="application/pdf"
                            style={{ display: "none" }}
                            onChange={async (ev) => {
                              const file = ev.target.files?.[0];
                              if (!file) return;
                              const fd = new FormData();
                              fd.append("file", file);
                              try {
                                await apiFetch(`/api/certifications/${cert.id}/pdf`, { method: "POST", body: fd });
                                await loadAll();
                                flash("PDF uploaded and synced to frontend!");
                              } catch (ex) { flash(ex.message, true); }
                              finally { ev.target.value = ""; }
                            }}
                          />
                        </label>
                        <button type="button" className="btn btn-ghost admin-icon-btn" title="Edit" onClick={() => { setCertForm({ name: cert.name, issuer: cert.issuer, issue_date: cert.issue_date, sort_order: cert.sort_order }); setEditingCertId(cert.id); }}>
                          <Pencil size={13} />
                        </button>
                        <button type="button" className="btn btn-ghost admin-icon-btn" title="Delete" style={{ color: "#f87171" }}
                          onClick={async () => {
                            if (!confirm(`Delete certification "${cert.name}"?`)) return;
                            try {
                              await apiFetch(`/api/certifications/${cert.id}`, { method: "DELETE" });
                              await loadAll();
                              flash("Certification deleted.");
                            } catch (ex) { flash(ex.message, true); }
                          }}
                        ><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── HONORS & AWARDS TAB ─────────────────────────────────────── */}
          {!loading && tab === "Honors" && (
            <div className="admin-card">
              <h3>Honors &amp; Awards</h3>
              <p className="admin-hint">Add competition wins, dean's lists, and academic honors. Upload a shield/badge image for each.</p>

              {/* Add / Edit Form */}
              <div className="form-block" style={{ marginBottom: 24 }}>
                <h4 style={{ color: "var(--signal)", fontSize: 13, marginBottom: 12 }}>{editingHonorId ? "Edit Honor/Award" : "Add New Honor/Award"}</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div className="field-group">
                    <label>Title *</label>
                    <input value={honorForm.title} onChange={(e) => setHonorForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Idea Pitching Competition" />
                  </div>
                  <div className="field-group">
                    <label>Issued By</label>
                    <input value={honorForm.issuer} onChange={(e) => setHonorForm((f) => ({ ...f, issuer: e.target.value }))} placeholder="e.g. CareerCounselingSociety" />
                  </div>
                  <div className="field-group">
                    <label>Issue Date</label>
                    <input value={honorForm.issue_date} onChange={(e) => setHonorForm((f) => ({ ...f, issue_date: e.target.value }))} placeholder="e.g. Apr 2026" />
                  </div>
                  <div className="field-group">
                    <label>Associated With</label>
                    <input value={honorForm.associated_with} onChange={(e) => setHonorForm((f) => ({ ...f, associated_with: e.target.value }))} placeholder="e.g. FAST-NU" />
                  </div>
                  <div className="field-group" style={{ gridColumn: "1/-1" }}>
                    <label>External Link (optional)</label>
                    <input value={honorForm.url} onChange={(e) => setHonorForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div className="field-group" style={{ gridColumn: "1/-1" }}>
                    <label>Description</label>
                    <textarea value={honorForm.description} onChange={(e) => setHonorForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe the honor or achievement..." style={{ width: "100%", resize: "vertical", background: "var(--panel-alt)", border: "1px solid var(--line)", color: "var(--text)", borderRadius: 6, padding: "8px 10px", fontFamily: "inherit", fontSize: 13 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!honorForm.title.trim()}
                    onClick={async () => {
                      try {
                        if (editingHonorId) {
                          await apiFetch(`/api/honors/${editingHonorId}`, { method: "PUT", body: JSON.stringify(honorForm) });
                          flash("Honor updated!");
                        } else {
                          await apiFetch("/api/honors", { method: "POST", body: JSON.stringify(honorForm) });
                          flash("Honor added!");
                        }
                        setHonorForm(emptyHonor);
                        setEditingHonorId(null);
                        await loadAll();
                      } catch (ex) { flash(ex.message, true); }
                    }}
                  >{editingHonorId ? "Update" : "Add Honor/Award"}</button>
                  {editingHonorId && (
                    <button type="button" className="btn btn-ghost" onClick={() => { setHonorForm(emptyHonor); setEditingHonorId(null); }}>Cancel</button>
                  )}
                </div>
              </div>

              {/* List */}
              {honors.length === 0 ? (
                <p className="empty-hint">No honors yet. Add one above.</p>
              ) : (
                <div className="item-list">
                  {honors.map((honor) => (
                    <div className="item-row" key={honor.id} style={{ alignItems: "flex-start", gap: 12 }}>
                      {honor.image_url && (
                        <img src={mediaUrl(honor.image_url)} alt={honor.title} style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 8, border: "1px solid var(--line)", background: "var(--panel-alt)", flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: "0 0 2px", fontSize: 14 }}>{honor.title}</h3>
                        <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--text-dim)" }}>
                          {honor.issuer}{honor.issue_date ? ` · ${honor.issue_date}` : ""}
                          {honor.associated_with ? ` · ${honor.associated_with}` : ""}
                        </p>
                        {honor.description && <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>{honor.description.slice(0, 120)}{honor.description.length > 120 ? "..." : ""}</p>}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                        {/* Upload shield image */}
                        <label className="btn btn-ghost" style={{ fontSize: "11.5px", padding: "5px 10px", color: "var(--signal)", border: "1px solid rgba(110,231,183,0.3)", background: "rgba(110,231,183,0.08)", borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <Upload size={12} /> {honor.image_url ? "Change Shield" : "Upload Shield"}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            style={{ display: "none" }}
                            onChange={async (ev) => {
                              const file = ev.target.files?.[0];
                              if (!file) return;
                              const fd = new FormData();
                              fd.append("file", file);
                              try {
                                await apiFetch(`/api/honors/${honor.id}/image`, { method: "POST", body: fd });
                                await loadAll();
                                flash("Shield image uploaded!");
                              } catch (ex) { flash(ex.message, true); }
                              finally { ev.target.value = ""; }
                            }}
                          />
                        </label>
                        <button type="button" className="btn btn-ghost admin-icon-btn" title="Edit"
                          onClick={() => {
                            setHonorForm({ title: honor.title, issuer: honor.issuer, issue_date: honor.issue_date, description: honor.description, url: honor.url, associated_with: honor.associated_with, sort_order: honor.sort_order });
                            setEditingHonorId(honor.id);
                          }}><Pencil size={13} /></button>
                        <button type="button" className="btn btn-ghost admin-icon-btn" title="Delete" style={{ color: "#f87171" }}
                          onClick={async () => {
                            if (!confirm(`Delete honor "${honor.title}"?`)) return;
                            try {
                              await apiFetch(`/api/honors/${honor.id}`, { method: "DELETE" });
                              await loadAll();
                              flash("Honor deleted.");
                            } catch (ex) { flash(ex.message, true); }
                          }}
                        ><Trash2 size={13} /></button>
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
