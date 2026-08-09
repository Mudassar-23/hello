import { useEffect, useState } from "react";
import { X, Video, ExternalLink, Loader2 } from "lucide-react";
import { mediaUrl } from "../api/client";
import { getVideoBlobUrl } from "../api/videoStore";

export default function VideoModal({ item, onClose }) {
  const [resolvedSrc, setResolvedSrc] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const loadVideo = async () => {
      setLoading(true);
      setError(false);
      const rawSrc = item?.video_url || item?.url || "";
      if (!rawSrc) {
        if (active) {
          setResolvedSrc("");
          setLoading(false);
        }
        return;
      }

      if (rawSrc.startsWith("indexeddb:")) {
        try {
          const objectUrl = await getVideoBlobUrl(rawSrc);
          if (active) {
            setResolvedSrc(objectUrl);
            setLoading(false);
          }
        } catch {
          if (active) {
            setError(true);
            setLoading(false);
          }
        }
      } else {
        if (active) {
          setResolvedSrc(mediaUrl(rawSrc));
          setLoading(false);
        }
      }
    };

    loadVideo();
    return () => {
      active = false;
    };
  }, [item]);

  if (!item) return null;

  const rawSrc = item.video_url || item.url || "";
  const isYouTube =
    rawSrc.includes("youtube.com") || rawSrc.includes("youtu.be");

  const getYouTubeEmbedUrl = (url) => {
    try {
      if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1].split("?")[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1`;
      }
      if (url.includes("watch?v=")) {
        const id = url.split("watch?v=")[1].split("&")[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1`;
      }
    } catch {
      // fallback
    }
    return url;
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(5, 10, 8, 0.88)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="video-modal-content glow-border"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "840px",
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: "16px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0 25px 60px rgba(0,0,0,0.6), 0 0 30px rgba(110,231,183,0.15)",
        }}
      >
        <div
          className="modal-header"
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--panel-alt)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: "rgba(110,231,183,0.12)",
                border: "1px solid rgba(110,231,183,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--signal)",
              }}
            >
              <Video size={16} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
                {item.name || "Project Video Demo"}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "var(--text-dim)",
                }}
              >
                {item.caption || "Project Video Demonstration"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid var(--line)",
              background: "var(--bg)",
              color: "var(--text-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="video-player-wrap"
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16/9",
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                color: "var(--signal)",
              }}
            >
              <Loader2 size={32} className="spin" />
              <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>
                Loading video player…
              </span>
            </div>
          ) : isYouTube ? (
            <iframe
              src={getYouTubeEmbedUrl(rawSrc)}
              title={item.name}
              style={{ width: "100%", height: "100%", border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : resolvedSrc && !error ? (
            <video
              controls
              autoPlay
              playsInline
              src={resolvedSrc}
              onError={() => setError(true)}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "30px 20px",
                color: "var(--text-dim)",
              }}
            >
              <Video
                size={48}
                style={{ color: "var(--signal)", marginBottom: 12 }}
              />
              <h4
                style={{
                  margin: "0 0 6px",
                  color: "var(--text)",
                  fontSize: "16px",
                }}
              >
                {item.name} — Demo Preview
              </h4>
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: "13px",
                  maxWidth: "420px",
                }}
              >
                No video file uploaded for this project yet. Upload an MP4 video or paste a video link in Admin to replace this player!
              </p>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "13px",
                  }}
                >
                  <ExternalLink size={14} /> Open Project Link
                </a>
              )}
            </div>
          )}
        </div>

        {item.description && (
          <div
            style={{
              padding: "16px 20px",
              background: "var(--panel-alt)",
              borderTop: "1px solid var(--line)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "13.5px",
                color: "var(--text-dim)",
                lineHeight: 1.55,
              }}
            >
              {item.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
