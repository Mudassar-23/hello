import {
  deleteLocalMessage,
  getLocalData,
  getLocalMessages,
  saveLocalData,
  saveLocalMessage,
} from "./fallback";
import { saveVideoBlob } from "./videoStore";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");
const ACCESS_KEY = "portfolio_access_token";

export function getApiUrl() {
  return API_URL;
}

export function mediaUrl(path) {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  if (path.startsWith("/videos/") || path.startsWith("videos/")) {
    return path.startsWith("/") ? path : `/${path}`;
  }
  if (path.startsWith("/certs/") || path.startsWith("certs/")) {
    return path.startsWith("/") ? path : `/${path}`;
  }
  if (path.startsWith("/uploads/") || path.startsWith("uploads/")) {
    return path.startsWith("/") ? path : `/${path}`;
  }
  if (/\.(png|jpg|jpeg|webp|gif|svg)$/i.test(path)) {
    return `/uploads/${path}`;
  }
  if (/\.(mp4|webm|ogg|mov|mkv)$/i.test(path)) {
    return `/videos/${path}`;
  }
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_KEY) || localStorage.getItem(ACCESS_KEY);
}

export function setAccessToken(token) {
  if (token) {
    sessionStorage.setItem(ACCESS_KEY, token);
    localStorage.setItem(ACCESS_KEY, token);
  } else {
    sessionStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(ACCESS_KEY);
  }
}

async function parseError(res) {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
    }
    return res.statusText || "Request failed";
  } catch {
    return res.statusText || "Request failed";
  }
}

// Local mock handler when backend API is unavailable or unconfigured
async function handleLocalApi(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const data = getLocalData();
  let bodyData = null;

  if (options.body && typeof options.body === "string") {
    try {
      bodyData = JSON.parse(options.body);
    } catch {
      // non-JSON
    }
  }

  // --- Auth endpoints ---
  if (path === "/api/auth/login") {
    setAccessToken("local_admin_token");
    return { access_token: "local_admin_token" };
  }
  if (path === "/api/auth/refresh") {
    return { access_token: "local_admin_token" };
  }
  if (path === "/api/auth/logout") {
    setAccessToken(null);
    return { message: "Logged out" };
  }

  // --- Content endpoints ---
  if (path === "/api/content") {
    if (method === "GET") {
      return {
        home: data.home,
        about: data.about,
        contact: data.contact,
      };
    }
    if (method === "PUT" && bodyData) {
      if (bodyData.home) data.home = { ...data.home, ...bodyData.home };
      if (bodyData.about) data.about = { ...data.about, ...bodyData.about };
      if (bodyData.contact) data.contact = { ...data.contact, ...bodyData.contact };
      saveLocalData(data);
      return { home: data.home, about: data.about, contact: data.contact };
    }
  }

  // --- Skills endpoints ---
  if (path === "/api/skills") {
    if (method === "GET") return data.skills;
    if (method === "POST" && bodyData) {
      const newSkill = {
        id: Date.now(),
        name: bodyData.name,
        sort_order: bodyData.sort_order ?? data.skills.length,
      };
      data.skills.push(newSkill);
      saveLocalData(data);
      return newSkill;
    }
  }
  if (path.startsWith("/api/skills/")) {
    const id = parseInt(path.split("/").pop(), 10);
    if (method === "DELETE") {
      data.skills = data.skills.filter((s) => s.id !== id);
      saveLocalData(data);
      return { success: true };
    }
  }

  // --- Projects endpoints ---
  if (path === "/api/projects") {
    if (method === "GET") return data.projects;
    if (method === "POST" && bodyData) {
      const newProj = {
        id: Date.now(),
        ref: bodyData.ref || "",
        name: bodyData.name || "Untitled Project",
        github_url: bodyData.github_url || "",
        live_url: bodyData.live_url || "",
        description: bodyData.description || "",
        tag: bodyData.tag || "",
        lang: bodyData.lang || "",
        stars: bodyData.stars || 0,
        image_url: bodyData.image_url || "",
        caption: bodyData.caption || "",
        sort_order: bodyData.sort_order ?? data.projects.length,
      };
      data.projects.push(newProj);
      saveLocalData(data);
      return newProj;
    }
  }

  if (path.includes("/image") && path.startsWith("/api/projects/")) {
    const idStr = path.split("/")[3];
    const id = parseInt(idStr, 10);
    const projIndex = data.projects.findIndex((p) => p.id === id);

    let dataUrl = "";
    if (options.body instanceof FormData) {
      const file = options.body.get("file");
      if (file && file instanceof File) {
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      }
    }

    if (projIndex !== -1 && dataUrl) {
      data.projects[projIndex].image_url = dataUrl;
      const mediaIdx = data.media.findIndex((m) => m.project_id === id);
      if (mediaIdx !== -1) {
        data.media[mediaIdx].image_url = dataUrl;
      } else {
        data.media.push({
          id: Date.now(),
          name: data.projects[projIndex].name,
          caption: data.projects[projIndex].name,
          image_url: dataUrl,
          project_id: id,
          url: data.projects[projIndex].github_url || "",
          sort_order: data.media.length + 1,
        });
      }
      saveLocalData(data);
      return data.projects[projIndex];
    }
  }

  if (path.startsWith("/api/projects/")) {
    const id = parseInt(path.split("/").pop(), 10);
    const projIndex = data.projects.findIndex((p) => p.id === id);
    if (method === "PUT" && bodyData && projIndex !== -1) {
      data.projects[projIndex] = {
        ...data.projects[projIndex],
        ...bodyData,
      };
      saveLocalData(data);
      return data.projects[projIndex];
    }
    if (method === "DELETE" && projIndex !== -1) {
      data.projects.splice(projIndex, 1);
      data.media = data.media.filter((m) => m.project_id !== id);
      saveLocalData(data);
      return { success: true };
    }
  }

  // --- Experience endpoints ---
  if (path === "/api/experience") {
    if (method === "GET") return data.experience;
    if (method === "POST" && bodyData) {
      const newExp = {
        id: Date.now(),
        title: bodyData.title || "",
        company: bodyData.company || "",
        start_date: bodyData.start_date || "",
        end_date: bodyData.end_date || "",
        description: bodyData.description || "",
        sort_order: bodyData.sort_order ?? data.experience.length,
      };
      data.experience.push(newExp);
      saveLocalData(data);
      return newExp;
    }
  }

  if (path.startsWith("/api/experience/")) {
    const id = parseInt(path.split("/").pop(), 10);
    const expIdx = data.experience.findIndex((e) => e.id === id);
    if (method === "PUT" && bodyData && expIdx !== -1) {
      data.experience[expIdx] = {
        ...data.experience[expIdx],
        ...bodyData,
      };
      saveLocalData(data);
      return data.experience[expIdx];
    }
    if (method === "DELETE" && expIdx !== -1) {
      data.experience.splice(expIdx, 1);
      saveLocalData(data);
      return { success: true };
    }
  }

  // --- Media endpoints ---
  if (path === "/api/media") {
    if (method === "GET") return data.media;
  }

  if (path.includes("/video") && path.startsWith("/api/media/")) {
    const id = parseInt(path.split("/")[3], 10);
    const mediaIdx = data.media.findIndex((m) => m.id === id);
    if (mediaIdx !== -1) {
      let videoUrl = "";
      if (options.body instanceof FormData) {
        const file = options.body.get("file");
        if (file && file instanceof File) {
          videoUrl = await saveVideoBlob(id, file);
        }
      } else if (bodyData && bodyData.video_url) {
        videoUrl = bodyData.video_url;
      }

      if (videoUrl) {
        data.media[mediaIdx].video_url = videoUrl;
        saveLocalData(data);
        return data.media[mediaIdx];
      }
    }
  }

  if (path.startsWith("/api/media/")) {
    const id = parseInt(path.split("/").pop(), 10);
    const mediaIdx = data.media.findIndex((m) => m.id === id);
    if (method === "PUT" && bodyData && mediaIdx !== -1) {
      data.media[mediaIdx] = {
        ...data.media[mediaIdx],
        ...bodyData,
      };
      saveLocalData(data);
      return data.media[mediaIdx];
    }
    if (method === "DELETE") {
      data.media = data.media.filter((m) => m.id !== id);
      saveLocalData(data);
      return { success: true };
    }
  }

  // --- Contact endpoints ---
  if (path === "/api/contact") {
    if (method === "POST" && bodyData) {
      saveLocalMessage(bodyData);
      return { message: "Message sent successfully!" };
    }
  }
  if (path === "/api/contact/messages") {
    if (method === "GET") return getLocalMessages();
  }
  if (path.startsWith("/api/contact/messages/")) {
    const id = parseInt(path.split("/").pop(), 10);
    if (method === "DELETE") {
      return deleteLocalMessage(id);
    }
  }

  // Fallback return for unhandled GETs
  if (method === "GET") {
    if (path.includes("content")) return { home: data.home, about: data.about, contact: data.contact };
    if (path.includes("skills")) return data.skills;
    if (path.includes("projects")) return data.projects;
    if (path.includes("experience")) return data.experience;
    if (path.includes("media")) return data.media;
    if (path.includes("certifications")) return data.certifications || [];
    if (path.includes("honors")) return data.honors || [];
  }

  // --- Certifications endpoints ---
  if (path === "/api/certifications") {
    if (method === "GET") return data.certifications || [];
    if (method === "POST" && bodyData) {
      const newCert = {
        id: Date.now(),
        name: bodyData.name || "",
        issuer: bodyData.issuer || "",
        issue_date: bodyData.issue_date || "",
        pdf_url: "",
        sort_order: bodyData.sort_order ?? (data.certifications || []).length,
      };
      if (!data.certifications) data.certifications = [];
      data.certifications.push(newCert);
      saveLocalData(data);
      return newCert;
    }
  }

  if (path.includes("/pdf") && path.startsWith("/api/certifications/")) {
    const id = parseInt(path.split("/")[3], 10);
    if (!data.certifications) data.certifications = [];
    const certIdx = data.certifications.findIndex((c) => c.id === id);
    if (certIdx !== -1 && options.body instanceof FormData) {
      const file = options.body.get("file");
      if (file && file instanceof File) {
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
        data.certifications[certIdx].pdf_url = dataUrl;
        saveLocalData(data);
        return data.certifications[certIdx];
      }
    }
  }

  if (path.startsWith("/api/certifications/")) {
    const id = parseInt(path.split("/").pop(), 10);
    if (!data.certifications) data.certifications = [];
    const certIdx = data.certifications.findIndex((c) => c.id === id);
    if (method === "PUT" && bodyData && certIdx !== -1) {
      data.certifications[certIdx] = { ...data.certifications[certIdx], ...bodyData };
      saveLocalData(data);
      return data.certifications[certIdx];
    }
    if (method === "DELETE" && certIdx !== -1) {
      data.certifications.splice(certIdx, 1);
      saveLocalData(data);
      return { success: true };
    }
  }

  // --- Honors & Awards endpoints ---
  if (path === "/api/honors") {
    if (method === "GET") return data.honors || [];
    if (method === "POST" && bodyData) {
      const newHonor = {
        id: Date.now(),
        title: bodyData.title || "",
        issuer: bodyData.issuer || "",
        issue_date: bodyData.issue_date || "",
        description: bodyData.description || "",
        url: bodyData.url || "",
        associated_with: bodyData.associated_with || "",
        image_url: "",
        sort_order: bodyData.sort_order ?? (data.honors || []).length,
      };
      if (!data.honors) data.honors = [];
      data.honors.push(newHonor);
      saveLocalData(data);
      return newHonor;
    }
  }

  if (path.includes("/image") && path.startsWith("/api/honors/")) {
    const id = parseInt(path.split("/")[3], 10);
    if (!data.honors) data.honors = [];
    const honorIdx = data.honors.findIndex((h) => h.id === id);
    if (honorIdx !== -1 && options.body instanceof FormData) {
      const file = options.body.get("file");
      if (file && file instanceof File) {
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
        data.honors[honorIdx].image_url = dataUrl;
        saveLocalData(data);
        return data.honors[honorIdx];
      }
    }
  }

  if (path.startsWith("/api/honors/")) {
    const id = parseInt(path.split("/").pop(), 10);
    if (!data.honors) data.honors = [];
    const honorIdx = data.honors.findIndex((h) => h.id === id);
    if (method === "PUT" && bodyData && honorIdx !== -1) {
      data.honors[honorIdx] = { ...data.honors[honorIdx], ...bodyData };
      saveLocalData(data);
      return data.honors[honorIdx];
    }
    if (method === "DELETE" && honorIdx !== -1) {
      data.honors.splice(honorIdx, 1);
      saveLocalData(data);
      return { success: true };
    }
  }

  return { success: true };
}

export async function apiFetch(path, options = {}, _retried = false) {
  // If no backend API URL is configured or if host is Vercel without backend, try API first but fallback to local
  if (API_URL) {
    try {
      const headers = new Headers(options.headers || {});
      if (
        !(options.body instanceof FormData) &&
        !headers.has("Content-Type") &&
        options.body
      ) {
        headers.set("Content-Type", "application/json");
      }
      const token = getAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
      });

      if (res.status === 204) return null;

      if (res.status === 401 && !_retried && path !== "/api/auth/login" && path !== "/api/auth/refresh") {
        try {
          const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setAccessToken(refreshData.access_token);
            return apiFetch(path, options, true);
          }
        } catch {
          // refresh failed
        }
        setAccessToken(null);
      }

      if (res.ok) {
        const type = res.headers.get("content-type") || "";
        if (type.includes("application/json")) return res.json();
        return res.text();
      } else {
        const errText = await res.text();
        throw new Error(`API Error ${res.status}: ${errText}`);
      }
    } catch (err) {
      if (err.message && err.message.startsWith("API Error")) {
        throw err;
      }
      // Backend fetch failed (e.g. offline / CORS / no backend deployed) -> fall through to local fallback below
    }
  }

  // Handle locally
  return handleLocalApi(path, options);
}

export async function login(username, password) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setAccessToken(data.access_token);
  return data;
}

export async function refreshAccessToken() {
  const data = await apiFetch("/api/auth/refresh", { method: "POST" });
  setAccessToken(data.access_token);
  return data;
}

export async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
  setAccessToken(null);
}
