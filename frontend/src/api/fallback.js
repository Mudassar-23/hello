import { INITIAL_PORTFOLIO_DATA } from "../data/portfolioData";

const STORAGE_KEY = "portfolio_local_data_v3";
const MESSAGES_KEY = "portfolio_contact_messages";

export function getLocalData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        home: parsed.home || INITIAL_PORTFOLIO_DATA.home,
        about: parsed.about || INITIAL_PORTFOLIO_DATA.about,
        contact: parsed.contact || INITIAL_PORTFOLIO_DATA.contact,
        skills: parsed.skills || INITIAL_PORTFOLIO_DATA.skills,
        projects: parsed.projects || INITIAL_PORTFOLIO_DATA.projects,
        media: parsed.media || INITIAL_PORTFOLIO_DATA.media,
        experience: parsed.experience || INITIAL_PORTFOLIO_DATA.experience,
        certifications: parsed.certifications || INITIAL_PORTFOLIO_DATA.certifications,
        honors: parsed.honors || INITIAL_PORTFOLIO_DATA.honors,
      };
    }
  } catch (err) {
    console.warn("Could not read local portfolio data:", err);
  }
  return INITIAL_PORTFOLIO_DATA;
}

export function saveLocalData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent("portfolio_data_updated", { detail: data })
    );
  } catch (err) {
    console.error("Failed to save local portfolio data:", err);
  }
}

export function resetLocalDataToDefaults() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent("portfolio_data_updated", {
      detail: INITIAL_PORTFOLIO_DATA,
    })
  );
}

export function getLocalMessages() {
  try {
    const saved = localStorage.getItem(MESSAGES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveLocalMessage(msg) {
  const current = getLocalMessages();
  const newMsg = {
    id: Date.now(),
    name: msg.name,
    email: msg.email,
    message: msg.message,
    created_at: new Date().toISOString(),
  };
  const updated = [newMsg, ...current];
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save contact message locally:", e);
  }
  return newMsg;
}

export function deleteLocalMessage(id) {
  const current = getLocalMessages();
  const updated = current.filter((m) => m.id !== id);
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete contact message locally:", e);
  }
  return updated;
}

export const FALLBACK_CONTENT = {
  home: INITIAL_PORTFOLIO_DATA.home,
  about: INITIAL_PORTFOLIO_DATA.about,
  contact: INITIAL_PORTFOLIO_DATA.contact,
};

export const FALLBACK_SKILLS = INITIAL_PORTFOLIO_DATA.skills;
export const FALLBACK_PROJECTS = INITIAL_PORTFOLIO_DATA.projects;
export const FALLBACK_EXPERIENCE = INITIAL_PORTFOLIO_DATA.experience;
export const FALLBACK_MEDIA = INITIAL_PORTFOLIO_DATA.media;
export const FALLBACK_CERTIFICATIONS = INITIAL_PORTFOLIO_DATA.certifications;
export const FALLBACK_HONORS = INITIAL_PORTFOLIO_DATA.honors;
