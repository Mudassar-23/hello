import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  Github,
  Linkedin,
  Mail,
  Instagram,
  ArrowUpRight,
  Menu,
  X,
  TerminalSquare,
  Cpu,
} from "lucide-react";

/* ---------------------------------------------------------------------
   DATA — pulled from github.com/Mudassar-23 (pinned repos + profile)
--------------------------------------------------------------------- */

const PROFILE = {
  name: "Mudassar Hussain",
  handle: "Mudassar-23",
  location: "Pakistan",
  email: "infonxhussain@gmail.com",
  github: "https://github.com/Mudassar-23",
  linkedin: "https://www.linkedin.com/in/mudassar-hussain-8952102a0/",
  instagram:
    "https://www.instagram.com/mudassar.chaudhary620?igsh=MXJtcjVpc2xxcjFubA==",
};

const SKILLS = [
  "C++",
  "Python",
  "Arduino",
  "OpenCV",
  "MATLAB",
  "Linux",
  "Proteus",
  "MySQL",
  "Visual Studio",
];

const PROJECTS = [
  {
    ref: "IC1",
    tag: "ML \u00b7 WEB",
    name: "House Price Prediction App",
    lang: "JavaScript",
    stars: 1,
    desc: "A web app that estimates property prices from listing features, pairing a trained regression model with a clean, interactive front end.",
    url: "https://github.com/Mudassar-23/House-Price-Prediction-App",
    hasImage: true,
  },
];

/* ---------------------------------------------------------------------
   SCROLL REVEAL — small IntersectionObserver hook, no external motion lib
--------------------------------------------------------------------- */

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const [ref, visible] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "in-view" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------------
   THREE.JS HERO — wireframe core with orbiting sensor nodes
--------------------------------------------------------------------- */

function CircuitScene() {
  const mountRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = mount.clientWidth;
    let height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.z = 7.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Everything below rotates together as one assembly — the "showcase" turn
    const rig = new THREE.Group();
    scene.add(rig);

    // Soft radial-gradient texture used for additive glow sprites
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const gctx = glowCanvas.getContext("2d");
    const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.45)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 128, 128);
    const glowTex = new THREE.CanvasTexture(glowCanvas);

    const coreGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0x6ee7b7,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.85,
      })
    );
    coreGlow.scale.set(2.1, 2.1, 1);
    rig.add(coreGlow);

    // Central "chip" — layered wireframe icosahedra
    const coreGeo = new THREE.IcosahedronGeometry(1.35, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x6ee7b7,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    rig.add(core);

    const innerGeo = new THREE.IcosahedronGeometry(0.92, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xc98554,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    rig.add(inner);

    const coreDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xe9ede9 })
    );
    rig.add(coreDot);

    // Orbiting sensor nodes + traces back to the core
    const NODE_COUNT = 7;
    const nodes = [];
    const lines = [];
    const nodeGeo = new THREE.SphereGeometry(0.055, 12, 12);

    for (let i = 0; i < NODE_COUNT; i++) {
      const color = i % 2 === 0 ? 0x6ee7b7 : 0xc98554;
      const mesh = new THREE.Mesh(
        nodeGeo,
        new THREE.MeshBasicMaterial({ color })
      );
      rig.add(mesh);

      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          opacity: 0.8,
        })
      );
      glow.scale.set(0.4, 0.4, 1);
      rig.add(glow);

      const radius = 1.75 + Math.random() * 0.55;
      const speed = 0.12 + Math.random() * 0.18;
      const offset = Math.random() * Math.PI * 2;
      const tilt = Math.random() * Math.PI;
      nodes.push({ mesh, glow, radius, speed, offset, tilt });

      const lineGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(6);
      lineGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({
          color: 0x2c3a33,
          transparent: true,
          opacity: 0.6,
        })
      );
      rig.add(line);
      lines.push(line);
    }

    // Radar-style pulse rings expanding out from the core, staggered in time
    const RING_COUNT = 3;
    const RING_CYCLE = 3.4;
    const ringGeo = new THREE.RingGeometry(0.98, 1, 64);
    const rings = [];
    for (let i = 0; i < RING_COUNT; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x6ee7b7,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.visible = false;
      scene.add(mesh);
      rings.push({ mesh, mat, delay: (i * RING_CYCLE) / RING_COUNT });
    }

    // Custom orbit control — drag with mouse or a single finger to spin the
    // camera around the sphere. THREE.OrbitControls isn't available in this
    // three.js build, so this is a small hand-rolled spherical-coordinate
    // version with inertia and an idle auto-orbit when left alone.
    const ORBIT_RADIUS = 7.2;
    let theta = Math.PI / 2;
    let phi = Math.PI / 2;
    let velTheta = 0;
    let velPhi = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    const ROT_SPEED = 0.0055;
    const DAMPING = 0.92;
    const AUTO_SPEED = 0.055;
    const PHI_MIN = 0.25;
    const PHI_MAX = Math.PI - 0.25;

    const applyOrbit = () => {
      camera.position.x = ORBIT_RADIUS * Math.sin(phi) * Math.cos(theta);
      camera.position.z = ORBIT_RADIUS * Math.sin(phi) * Math.sin(theta);
      camera.position.y = ORBIT_RADIUS * Math.cos(phi);
      camera.lookAt(0, 0, 0);
    };
    applyOrbit();

    mount.style.cursor = "grab";
    mount.style.touchAction = "none";

    const stopDragging = (e) => {
      isDragging = false;
      mount.style.cursor = "grab";
      if (e && e.pointerId && mount.hasPointerCapture?.(e.pointerId)) {
        try {
          mount.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    };

    const onPointerDown = (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velTheta = 0;
      velPhi = 0;
      mount.style.cursor = "grabbing";
      if (e.pointerId !== undefined && mount.setPointerCapture) {
        try {
          mount.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      theta -= dx * ROT_SPEED;
      phi = Math.min(Math.max(phi - dy * ROT_SPEED, PHI_MIN), PHI_MAX);
      velTheta = -dx * ROT_SPEED;
      velPhi = -dy * ROT_SPEED;
    };

    mount.addEventListener("pointerdown", onPointerDown);
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerup", stopDragging);
    mount.addEventListener("pointercancel", stopDragging);
    mount.addEventListener("lostpointercapture", stopDragging);

    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchend", stopDragging);
    window.addEventListener("touchcancel", stopDragging);

    const clock = new THREE.Clock();
    let raf = null;
    let prevT = 0;

    const renderFrame = () => {
      const t = clock.getElapsedTime();
      const dt = Math.min(Math.max(t - prevT, 0.001), 0.1);
      prevT = t;

      rig.rotation.y = t * 0.09;
      rig.rotation.x = Math.sin(t * 0.05) * 0.12;
      core.rotation.y = t * 0.15;
      core.rotation.x = t * 0.08;
      inner.rotation.y = -t * 0.12;
      inner.rotation.z = t * 0.05;

      nodes.forEach((n, i) => {
        const a = t * n.speed + n.offset;
        n.mesh.position.set(
          Math.cos(a) * n.radius,
          Math.sin(a * 0.7) * n.radius * 0.55,
          Math.sin(a) * n.radius * Math.cos(n.tilt)
        );
        n.glow.position.copy(n.mesh.position);
        const pos = lines[i].geometry.attributes.position;
        pos.array[0] = 0;
        pos.array[1] = 0;
        pos.array[2] = 0;
        pos.array[3] = n.mesh.position.x;
        pos.array[4] = n.mesh.position.y;
        pos.array[5] = n.mesh.position.z;
        pos.needsUpdate = true;
      });

      rings.forEach((r) => {
        const localT = (t - r.delay) % RING_CYCLE;
        const progress = localT / RING_CYCLE;
        const scale = 1.3 + progress * 2.6;
        r.mesh.scale.set(scale, scale, scale);
        r.mat.opacity = (1 - progress) * 0.4;
        r.mesh.quaternion.copy(camera.quaternion);
        r.mesh.visible = true;
      });

      if (!isDragging) {
        if (Math.abs(velTheta) > 0.00006 || Math.abs(velPhi) > 0.00006) {
          theta += velTheta;
          phi = Math.min(Math.max(phi + velPhi, PHI_MIN), PHI_MAX);
          velTheta *= DAMPING;
          velPhi *= DAMPING;
        } else {
          theta += AUTO_SPEED * dt;
        }
      }
      applyOrbit();

      renderer.render(scene, camera);
      raf = requestAnimationFrame(renderFrame);
    };

    renderFrame();
    const readyTimer = setTimeout(() => setReady(true), 60);

    const ro = new ResizeObserver(() => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    ro.observe(mount);

    return () => {
      clearTimeout(readyTimer);
      if (raf) cancelAnimationFrame(raf);
      mount.removeEventListener("pointerdown", onPointerDown);
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerup", stopDragging);
      mount.removeEventListener("pointercancel", stopDragging);
      mount.removeEventListener("lostpointercapture", stopDragging);

      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchend", stopDragging);
      window.removeEventListener("touchcancel", stopDragging);
      ro.disconnect();
      mount.removeChild(renderer.domElement);
      [coreGeo, innerGeo, nodeGeo, ringGeo].forEach((g) => g.dispose());
      [coreMat, innerMat].forEach((m) => m.dispose());
      lines.forEach((l) => {
        l.geometry.dispose();
        l.material.dispose();
      });
      nodes.forEach((n) => {
        n.mesh.material.dispose();
        n.glow.material.dispose();
      });
      rings.forEach((r) => r.mat.dispose());
      coreGlow.material.dispose();
      glowTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`hero-canvas-wrap ${ready ? "sprung" : ""}`}>
      <div ref={mountRef} className="hero-canvas" aria-hidden="true" />
    </div>
  );
}

/* ---------------------------------------------------------------------
   THREE.JS BACKGROUND — full-page constellation of drifting particles
--------------------------------------------------------------------- */

function NetworkBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      1,
      1000
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    mount.appendChild(renderer.domElement);

    const COUNT = 75;
    const particles = Array.from({ length: COUNT }, () => ({
      x: (Math.random() - 0.5) * width,
      y: (Math.random() - 0.5) * height,
      vx: (Math.random() - 0.5) * 8 + 2,
      vy: (Math.random() - 0.5) * 8 + 2,
    }));

    const dotGeo = new THREE.BufferGeometry();
    const dotPositions = new Float32Array(COUNT * 3);
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPositions, 3));
    const dotMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 3.2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(dotGeo, dotMat);
    scene.add(points);

    const linePositions = new Float32Array(COUNT * COUNT * 3 * 2);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setDrawRange(0, 0);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
    });
    const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineMesh);

    let threshold = Math.min(width, height) * 0.18;
    let raf = null;

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let dragVelX = 0;
    let dragVelY = 0;
    const DAMPING = 0.94;

    let autoGridX = 0;
    let autoGridY = 0;

    const stopDragging = () => {
      isDragging = false;
    };

    const onPointerDown = (e) => {
      if (
        e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.closest("input") ||
        e.target.closest("textarea") ||
        e.target.closest(".admin-shell") ||
        e.target.closest(".hero-canvas")
      ) {
        return;
      }
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      dragVelX = 0;
      dragVelY = 0;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      dragVelX = dx * 0.6;
      dragVelY = -dy * 0.6;
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchend", stopDragging);
    window.addEventListener("touchcancel", stopDragging);

    const tick = () => {
      dragVelX *= DAMPING;
      dragVelY *= DAMPING;

      if (Math.abs(dragVelX) < 0.001) dragVelX = 0;
      if (Math.abs(dragVelY) < 0.001) dragVelY = 0;

      const halfW = width / 2;
      const halfH = height / 2;

      particles.forEach((p) => {
        p.x += p.vx * 0.045 + dragVelX * 0.35;
        p.y += p.vy * 0.045 + dragVelY * 0.35;

        if (p.x > halfW) p.x = -halfW;
        else if (p.x < -halfW) p.x = halfW;

        if (p.y > halfH) p.y = -halfH;
        else if (p.y < -halfH) p.y = halfH;
      });

      particles.forEach((p, i) => {
        dotPositions[i * 3] = p.x;
        dotPositions[i * 3 + 1] = p.y;
        dotPositions[i * 3 + 2] = 0;
      });
      dotGeo.attributes.position.needsUpdate = true;

      let li = 0;
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          if (dx * dx + dy * dy < threshold * threshold) {
            linePositions[li * 6] = particles[i].x;
            linePositions[li * 6 + 1] = particles[i].y;
            linePositions[li * 6 + 2] = 0;
            linePositions[li * 6 + 3] = particles[j].x;
            linePositions[li * 6 + 4] = particles[j].y;
            linePositions[li * 6 + 5] = 0;
            li++;
          }
        }
      }
      lineGeo.setDrawRange(0, li * 2);
      lineGeo.attributes.position.needsUpdate = true;

      lineMat.opacity = 0.24 + Math.sin(Date.now() * 0.0018) * 0.08;

      autoGridX += 0.25 + dragVelX * 0.5;
      autoGridY += 0.4 + (-dragVelY) * 0.5;

      document.documentElement.style.setProperty("--grid-x", `${autoGridX % 56}px`);
      document.documentElement.style.setProperty("--grid-y", `${autoGridY % 56}px`);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    tick();

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      threshold = Math.min(width, height) * 0.18;
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchend", stopDragging);
      window.removeEventListener("touchcancel", stopDragging);
      window.removeEventListener("resize", onResize);
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      dotGeo.dispose();
      dotMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="network-bg" aria-hidden="true" />;
}

/* ---------------------------------------------------------------------
   ADMIN ACCESS MODAL
--------------------------------------------------------------------- */

function AdminModal({ onClose }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setMsg(
      "Preview only \u2014 wire this form to your auth service to enable real sign-in."
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Admin access"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span className="modal-eyebrow">
            <TerminalSquare size={14} /> DEBUG HEADER
          </span>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label="Close admin panel"
          >
            <X size={16} />
          </button>
        </div>
        <h3>Admin access</h3>
        <p className="modal-sub">
          Restricted maintenance port. Credentials are checked against the
          site owner's backend.
        </p>
        <form onSubmit={submit}>
          <label>
            Username
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="admin"
              autoComplete="off"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block">
            Authenticate
          </button>
        </form>
        {msg && <p className="modal-msg">{msg}</p>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   PROJECT DETAIL MODAL — optional "website interface" screenshot
--------------------------------------------------------------------- */

function ProjectModal({ project, image, onUpload, onClose }) {
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(project.ref, reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card project-modal"
        role="dialog"
        aria-modal="true"
        aria-label={project.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span className="modal-eyebrow">
            <span className="ref-tag mono">{project.ref}</span> {project.tag}
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="Close project details">
            <X size={16} />
          </button>
        </div>

        <h3>{project.name}</h3>
        <p className="modal-sub">{project.desc}</p>

        {project.hasImage && (
          <div className="shot-panel">
            <span className="label">Website interface</span>
            {image ? (
              <div className="shot-frame">
                <img src={image} alt={`${project.name} interface preview`} />
                <button
                  type="button"
                  className="shot-replace"
                  onClick={() => fileRef.current?.click()}
                >
                  Replace screenshot
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="shot-dropzone"
                onClick={() => fileRef.current?.click()}
              >
                <ArrowUpRight size={16} style={{ transform: "rotate(-45deg)" }} />
                Add a screenshot of the live interface
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        )}

        <div className="modal-foot">
          <span className="lang">
            <span className="lang-dot" /> {project.lang}
            {project.stars > 0 ? ` \u00b7 ${project.stars}\u2605` : ""}
          </span>
          <a href={project.url} target="_blank" rel="noreferrer" className="btn btn-primary">
            Open repository <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   MAIN
--------------------------------------------------------------------- */

export default function Portfolio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [glowKey, setGlowKey] = useState(0);
  const [images, setImages] = useState({});
  const [heroRef, heroVisible] = useReveal(0.05);

  useEffect(() => {
    document.body.style.overflow = adminOpen || selectedProject ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [adminOpen, selectedProject]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = {};
      for (const p of PROJECTS.filter((p) => p.hasImage)) {
        try {
          const res = await window.storage.get(`project-image:${p.ref}`, false);
          if (res?.value) loaded[p.ref] = res.value;
        } catch (err) {
          // no saved screenshot yet — fine
        }
      }
      if (!cancelled) setImages(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openProject = (project) => {
    setSelectedProject(project);
    setGlowKey((k) => k + 1);
  };

  const handleUpload = async (ref, dataUrl) => {
    setImages((prev) => ({ ...prev, [ref]: dataUrl }));
    try {
      await window.storage.set(`project-image:${ref}`, dataUrl, false);
    } catch (err) {
      console.error("Could not save screenshot", err);
    }
  };

  const navLinks = [
    { href: "#about", label: "About" },
    { href: "#projects", label: "Projects" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <div className="page">
      <NetworkBackground />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        :root{
          --bg:#0a0a0f;
          --panel:#111713;
          --panel-alt:#161d18;
          --line:#22302a;
          --line-soft:#1a2420;
          --copper:#c98554;
          --signal:#6ee7b7;
          --text:#e9ede9;
          --text-dim:#8b9a90;
          --text-faint:#5c6b62;
          --radius:10px;
        }

        *{ box-sizing:border-box; }
        html,body{ background:var(--bg); }

        .page{
          background:var(--bg);
          color:var(--text);
          font-family:'Inter', system-ui, sans-serif;
          min-height:100vh;
          position:relative;
          overflow-x:hidden;
        }

        .page::before{
          content:"";
          position:fixed;
          inset:-56px;
          background-image:
            linear-gradient(var(--line-soft) 1px, transparent 1px),
            linear-gradient(90deg, var(--line-soft) 1px, transparent 1px);
          background-size: 56px 56px;
          opacity:0.35;
          pointer-events:none;
          z-index:0;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 90%);
          animation: gridDrift 60s linear infinite;
        }
        @keyframes gridDrift{
          from{ background-position: 0 0; }
          to{ background-position: 56px 112px; }
        }
        @media (prefers-reduced-motion: reduce){
          .page::before{ animation:none; }
        }

        .network-bg{
          position:fixed; inset:0; z-index:0;
          pointer-events:none; opacity:0.55;
        }
        .network-bg canvas{ display:block; }

        a{ color:inherit; text-decoration:none; }
        button{ font-family:inherit; cursor:pointer; }
        input{ font-family:inherit; }

        .mono{ font-family:'JetBrains Mono', monospace; }

        .eyebrow{
          font-family:'JetBrains Mono', monospace;
          font-size:11px;
          letter-spacing:0.14em;
          text-transform:uppercase;
          color:var(--signal);
          display:inline-flex;
          align-items:center;
          gap:8px;
        }
        .eyebrow::before{
          content:"";
          width:6px;height:6px;border-radius:50%;
          background:var(--signal);
          box-shadow:0 0 8px var(--signal);
        }

        /* ---------- NAV ---------- */
        .nav{
          position:fixed; top:0; left:0; right:0;
          z-index:50;
          display:flex; align-items:center; justify-content:space-between;
          padding:20px clamp(20px,5vw,64px);
          background:linear-gradient(to bottom, rgba(10,15,12,0.92), rgba(10,15,12,0));
          backdrop-filter:blur(6px);
        }
        .brand{
          display:flex; align-items:center; gap:10px;
          font-family:'JetBrains Mono', monospace;
          font-weight:700; font-size:15px; letter-spacing:0.03em;
        }
        .brand-mark{
          width:30px;height:30px;
          border:1px solid var(--line);
          border-radius:6px;
          display:flex;align-items:center;justify-content:center;
          color:var(--signal);
          background:var(--panel);
        }
        .nav-links{ display:flex; align-items:center; gap:32px; }
        .nav-links a{
          font-size:13px; color:var(--text-dim);
          transition:color .2s ease;
          position:relative;
        }
        .nav-links a:hover{ color:var(--text); }
        .nav-cta{
          display:flex; align-items:center; gap:16px;
        }
        .icon-link{
          width:34px;height:34px;border:1px solid var(--line);
          border-radius:8px; display:flex; align-items:center; justify-content:center;
          color:var(--text-dim); transition:all .2s ease;
        }
        .icon-link:hover{ color:var(--signal); border-color:var(--signal); }
        .menu-btn{
          display:none; background:none; border:1px solid var(--line);
          border-radius:8px; width:38px;height:38px; align-items:center;justify-content:center;
          color:var(--text);
        }
        .mobile-menu{
          position:fixed; inset:0; z-index:49;
          background:var(--bg);
          display:flex; flex-direction:column; align-items:flex-start;
          justify-content:center; gap:28px; padding:0 32px;
        }
        .mobile-menu a{ font-size:28px; font-family:'JetBrains Mono',monospace; }

        /* ---------- HERO ---------- */
        .hero{
          position:relative; z-index:1;
          min-height:100vh;
          display:grid;
          grid-template-columns: 1.1fr 1fr;
          align-items:center;
          gap:40px;
          padding:120px clamp(20px,5vw,64px) 60px;
        }
        .hero-copy{ max-width:620px; }
        .hero-copy h1{
          font-family:'JetBrains Mono', monospace;
          font-weight:700;
          font-size:clamp(38px, 6vw, 68px);
          line-height:1.02;
          letter-spacing:-0.01em;
          margin:18px 0 20px;
        }
        .hero-copy h1 .accent{ color:var(--signal); }
        .hero-copy p{
          font-size:17px; line-height:1.65; color:var(--text-dim);
          max-width:520px; margin-bottom:32px;
        }
        .hero-actions{ display:flex; gap:14px; flex-wrap:wrap; margin-bottom:36px;}
        .btn{
          display:inline-flex; align-items:center; gap:8px;
          padding:13px 22px; border-radius:8px;
          font-size:14px; font-weight:600;
          border:1px solid var(--line);
          transition:all .2s ease;
        }
        .btn-primary{ background:var(--signal); color:#0a0f0c; border-color:var(--signal); }
        .btn-primary:hover{ background:#8ff2c6; transform:translateY(-1px); }
        .btn-ghost{ background:transparent; color:var(--text); }
        .btn-ghost:hover{ border-color:var(--copper); color:var(--copper); }
        .btn-block{ width:100%; justify-content:center; }

        .hero-meta{
          display:flex; gap:28px; flex-wrap:wrap;
          padding-top:24px; border-top:1px solid var(--line);
        }
        .hero-meta div{ font-size:12px; }
        .hero-meta .k{ color:var(--text-faint); font-family:'JetBrains Mono',monospace; letter-spacing:0.08em; text-transform:uppercase; font-size:10px; margin-bottom:6px;}
        .hero-meta .v{ color:var(--text); font-weight:500; }

        .hero-canvas-wrap{
          width:100%; height:min(560px, 60vh);
          position:relative;
          opacity:0; transform:scale(0.82) translateY(24px);
          transition: opacity .9s cubic-bezier(0.34, 1.56, 0.64, 1),
                      transform .9s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .hero-canvas-wrap.sprung{ opacity:1; transform:scale(1) translateY(0); }
        .hero-canvas-wrap::before{
          content:"";
          position:absolute; inset:8%;
          background: radial-gradient(circle, rgba(110,231,183,0.28), rgba(201,133,84,0.10) 45%, transparent 72%);
          filter: blur(28px);
          z-index:0;
          animation: premiumGlow 5.5s ease-in-out infinite;
        }
        @keyframes premiumGlow{
          0%, 100%{ opacity:0.55; transform:scale(0.94); }
          50%{ opacity:0.9; transform:scale(1.06); }
        }
        .hero-canvas{
          width:100%; height:100%;
          position:relative; z-index:1;
          animation: heroFloat 7s ease-in-out infinite;
        }
        .hero-canvas canvas{ display:block; }
        @keyframes heroFloat{
          0%, 100%{ transform:translateY(0); }
          50%{ transform:translateY(-14px); }
        }
        @media (prefers-reduced-motion: reduce){
          .hero-canvas-wrap{ opacity:1; transform:none; transition:none; }
          .hero-canvas-wrap::before{ animation:none; }
          .hero-canvas{ animation:none; }
        }

        /* ---------- SECTIONS ---------- */
        section{ position:relative; z-index:1; padding:100px clamp(20px,5vw,64px); }
        .section-head{ margin-bottom:52px; max-width:640px; }
        .section-head h2{
          font-family:'JetBrains Mono', monospace;
          font-size:clamp(26px,3.4vw,38px);
          margin:14px 0 16px;
          letter-spacing:-0.01em;
        }
        .section-head p{ color:var(--text-dim); font-size:16px; line-height:1.6; }

        /* ---------- ABOUT ---------- */
        .about-grid{
          display:grid; grid-template-columns: 1fr 1fr; gap:60px;
          align-items:start;
        }
        .about-body p{ color:var(--text-dim); font-size:16px; line-height:1.75; margin-bottom:18px; }
        .about-body strong{ color:var(--text); font-weight:600; }

        .chip-panel{
          border:1px solid var(--line); border-radius:var(--radius);
          background:var(--panel); padding:26px;
        }
        .chip-panel .label{
          font-family:'JetBrains Mono',monospace; font-size:11px;
          letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint);
          margin-bottom:16px; display:block;
        }
        .chips{ display:flex; flex-wrap:wrap; gap:10px; }
        .chip{
          font-family:'JetBrains Mono',monospace;
          font-size:12.5px; padding:8px 12px;
          border:1px solid var(--line); border-radius:6px;
          color:var(--text-dim); background:var(--panel-alt);
          transition:all .2s ease;
        }
        .chip:hover{ border-color:var(--signal); color:var(--signal); }

        /* ---------- PROJECTS ---------- */
        .project-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:22px; }
        .project-card{
          border:1px solid var(--line); border-radius:var(--radius);
          background:var(--panel);
          padding:26px;
          display:flex; flex-direction:column; gap:14px;
          position:relative;
          text-align:left; width:100%;
          cursor:pointer;
          overflow:hidden;
          transition:border-color .3s ease, transform .3s ease, box-shadow .3s ease;
        }
        .project-card::after{
          content:"";
          position:absolute; top:-1px; left:12%; right:12%; height:1px;
          background:linear-gradient(90deg, transparent, var(--signal), transparent);
          opacity:0; transition:opacity .3s ease;
        }
        .project-card:hover{
          border-color:var(--copper);
          transform:translateY(-4px);
          box-shadow:
            0 20px 48px rgba(0,0,0,0.4),
            0 0 0 1px rgba(110,231,183,0.08),
            0 0 32px rgba(110,231,183,0.16);
        }
        .project-card:hover::after{ opacity:0.8; }
        .card-thumb{
          border:1px solid var(--line); border-radius:7px; overflow:hidden;
          height:120px; background:var(--bg);
        }
        .card-thumb img{ width:100%; height:100%; object-fit:cover; display:block; }
        .project-card::before, .project-card::after{
          content:""; position:absolute; width:8px;height:8px;
          border:1px solid var(--line); border-radius:50%;
          background:var(--bg);
        }
        .project-card::before{ top:-5px; left:20px; }
        .project-card::after{ top:-5px; right:20px; }
        .card-top{ display:flex; align-items:center; justify-content:space-between; }
        .ref-tag{
          font-family:'JetBrains Mono',monospace; font-size:11px;
          color:var(--copper); border:1px solid var(--line);
          padding:3px 8px; border-radius:5px;
          transition:box-shadow .3s ease, border-color .3s ease;
        }
        .project-card:hover .ref-tag{
          border-color:var(--copper);
          box-shadow:0 0 12px rgba(201,133,84,0.45);
        }
        .tag{
          font-family:'JetBrains Mono',monospace; font-size:10.5px;
          letter-spacing:0.08em; color:var(--signal);
        }
        .project-card h3{ font-size:19px; font-weight:600; }
        .project-card p{ color:var(--text-dim); font-size:14.5px; line-height:1.6; flex:1; }
        .card-foot{
          display:flex; align-items:center; justify-content:space-between;
          padding-top:14px; border-top:1px solid var(--line);
          font-size:12px; color:var(--text-faint);
        }
        .card-foot .lang{ display:flex; align-items:center; gap:6px; }
        .lang-dot{ width:8px;height:8px;border-radius:50%; background:var(--copper); }
        .card-link{
          display:inline-flex; align-items:center; gap:4px;
          color:var(--text); font-size:13px; font-weight:600;
          transition:color .2s ease, text-shadow .2s ease;
        }
        .card-link:hover{ color:var(--signal); text-shadow:0 0 10px rgba(110,231,183,0.6); }

        /* ---------- CONTACT ---------- */
        .contact-panel{
          border:1px solid var(--line); border-radius:var(--radius);
          background:var(--panel);
          padding:56px clamp(24px,5vw,64px);
          display:flex; align-items:center; justify-content:space-between;
          gap:32px; flex-wrap:wrap;
        }
        .contact-panel h2{
          font-family:'JetBrains Mono', monospace;
          font-size:clamp(26px,3.6vw,40px);
          max-width:480px; line-height:1.15;
        }
        .contact-links{ display:flex; flex-direction:column; gap:14px; }
        .contact-links a{
          display:flex; align-items:center; gap:10px;
          font-size:14.5px; color:var(--text-dim);
          border-bottom:1px solid transparent;
          transition:color .2s ease;
        }
        .contact-links a:hover{ color:var(--signal); }

        footer{
          position:relative; z-index:1;
          padding:32px clamp(20px,5vw,64px) 100px;
          display:flex; justify-content:space-between; align-items:center;
          color:var(--text-faint); font-size:12px;
          font-family:'JetBrains Mono',monospace;
          flex-wrap:wrap; gap:12px;
        }

        /* ---------- ADMIN FAB + MODAL ---------- */
        .admin-fab{
          position:fixed; bottom:24px; right:24px; z-index:60;
          display:flex; align-items:center; gap:8px;
          padding:11px 16px;
          background:var(--panel); border:1px solid var(--line);
          border-radius:999px; color:var(--text-dim);
          font-family:'JetBrains Mono',monospace; font-size:12px;
          box-shadow:0 8px 24px rgba(0,0,0,0.35);
          transition:all .2s ease;
        }
        .admin-fab:hover{ border-color:var(--signal); color:var(--signal); }
        .admin-fab .dot{
          width:7px;height:7px;border-radius:50%;
          background:var(--signal); box-shadow:0 0 6px var(--signal);
        }

        .modal-overlay{
          position:fixed; inset:0; z-index:70;
          background:rgba(6,9,7,0.75);
          backdrop-filter:blur(4px);
          display:flex; align-items:center; justify-content:center;
          padding:20px;
        }
        .modal-card{
          width:100%; max-width:380px;
          background:var(--panel-alt); border:1px solid var(--line);
          border-radius:var(--radius);
          padding:28px;
        }
        .modal-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .modal-eyebrow{
          display:flex; align-items:center; gap:6px;
          font-family:'JetBrains Mono',monospace; font-size:10.5px;
          letter-spacing:0.1em; color:var(--copper);
        }
        .icon-btn{
          background:none; border:1px solid var(--line); border-radius:6px;
          width:28px;height:28px; display:flex; align-items:center; justify-content:center;
          color:var(--text-dim);
        }
        .icon-btn:hover{ color:var(--text); }
        .modal-card h3{ font-family:'JetBrains Mono',monospace; font-size:20px; margin-bottom:8px; }
        .modal-sub{ color:var(--text-dim); font-size:13px; line-height:1.5; margin-bottom:22px; }
        .modal-card form{ display:flex; flex-direction:column; gap:14px; }
        .modal-card label{ display:flex; flex-direction:column; gap:6px; font-size:12px; color:var(--text-dim); }
        .modal-card input{
          background:var(--bg); border:1px solid var(--line); border-radius:7px;
          padding:11px 12px; color:var(--text); font-size:14px;
        }
        .modal-card input:focus{ outline:2px solid var(--signal); outline-offset:1px; }
        .modal-msg{
          margin-top:14px; font-size:12.5px; color:var(--signal);
          border-top:1px solid var(--line); padding-top:14px; line-height:1.5;
        }

        .glow-burst{
          position:fixed; inset:0; z-index:65;
          pointer-events:none;
          background: radial-gradient(circle at 50% 45%, rgba(110,231,183,0.32), rgba(201,133,84,0.12) 35%, transparent 65%);
          animation: glowPulse .9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes glowPulse{
          0%{ opacity:0; transform:scale(0.4); }
          35%{ opacity:1; }
          100%{ opacity:0; transform:scale(1.6); }
        }
        @media (prefers-reduced-motion: reduce){
          .glow-burst{ display:none; }
        }

        .project-modal{ max-width:480px; }
        .project-modal .modal-eyebrow{
          display:flex; align-items:center; gap:8px;
          color:var(--text-dim); font-size:11px;
        }
        .project-modal h3{ font-size:22px; margin-bottom:10px; }
        .project-modal .modal-sub{ margin-bottom:20px; }
        .modal-foot{
          display:flex; align-items:center; justify-content:space-between;
          padding-top:18px; margin-top:4px; border-top:1px solid var(--line);
          font-size:12.5px; color:var(--text-faint);
        }

        .shot-panel{ margin-bottom:20px; }
        .shot-panel .label{
          font-family:'JetBrains Mono',monospace; font-size:10.5px;
          letter-spacing:0.1em; text-transform:uppercase; color:var(--text-faint);
          display:block; margin-bottom:10px;
        }
        .shot-dropzone{
          width:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:8px; padding:28px 16px;
          border:1px dashed var(--line); border-radius:8px;
          background:var(--bg); color:var(--text-dim);
          font-size:12.5px; text-align:center;
          transition:border-color .2s ease, color .2s ease;
        }
        .shot-dropzone:hover{ border-color:var(--signal); color:var(--signal); }
        .shot-frame{ position:relative; border:1px solid var(--line); border-radius:8px; overflow:hidden; }
        .shot-frame img{ width:100%; display:block; max-height:220px; object-fit:cover; }
        .shot-replace{
          position:absolute; bottom:10px; right:10px;
          background:rgba(10,10,15,0.75); border:1px solid var(--line);
          color:var(--text); font-size:11px; padding:6px 10px; border-radius:6px;
          backdrop-filter:blur(4px);
        }
        .shot-replace:hover{ border-color:var(--signal); color:var(--signal); }

        /* ---------- REVEAL ---------- */
        .reveal{ opacity:0; transform:translateY(22px); transition:opacity .7s ease, transform .7s ease; }
        .reveal.in-view{ opacity:1; transform:none; }
        @media (prefers-reduced-motion: reduce){
          .reveal{ transition:none; opacity:1; transform:none; }
        }

        :focus-visible{ outline:2px solid var(--signal); outline-offset:2px; }

        /* ---------- RESPONSIVE ---------- */
        @media (max-width: 900px){
          .hero{ grid-template-columns:1fr; padding-top:110px; }
          .hero-canvas-wrap{ order:-1; height:320px; }
          .about-grid{ grid-template-columns:1fr; gap:36px; }
          .project-grid{ grid-template-columns:1fr; }
          .nav-links{ display:none; }
          .menu-btn{ display:flex; }
          .contact-panel{ flex-direction:column; align-items:flex-start; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="brand">
          <span className="brand-mark"><Cpu size={16} /></span>
          MUDASSAR<span style={{ color: "var(--signal)" }}>.</span>HUSSAIN
        </div>
        <div className="nav-links">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </div>
        <div className="nav-cta">
          <a
            className="icon-link"
            href={PROFILE.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <Github size={16} />
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

      {/* HERO */}
      <header className="hero" ref={heroRef}>
        <div className="hero-copy">
          <span className="eyebrow">LAHORE, PK</span>
          <h1>
            Computer
            <br />
            engineer
            <br />
            for <span className="accent"></span>
          </h1>
          <p>
            I build the layer where hardware meets decision-making &mdash;
            embedded C++ on real sensors, and
            machine learning that ships inside an actual product, not just a
            notebook.
          </p>
          <div className="hero-actions">
            <a href="#projects" className="btn btn-primary">
              View projects <ArrowUpRight size={15} />
            </a>
            <a
              href={`mailto:${PROFILE.email}`}
              className="btn btn-ghost"
            >
              Get in touch
            </a>
          </div>
          <div className="hero-meta">
            <div>
              <div className="k">Repositories</div>
              <div className="v">GitHub</div>
            </div>
            <div>
              <div className="k">Focus</div>
              <div className="v">Software Development &middot; Edge AI &middot; IoT</div>
            </div>
            <div>
              <div className="k"></div>
              <div className="v"></div>
            </div>
          </div>
        </div>
        <CircuitScene />
      </header>

      {/* ABOUT */}
      <section id="about">
        <Reveal className="section-head">
          <span className="eyebrow">About</span>
          <h2></h2>
        </Reveal>
        <div className="about-grid">
          <Reveal className="about-body" delay={60}>
            <p>
              I'm a <strong>Computer Engineering</strong> enthusiast with
              hands-on experience across software development, machine
              learning, and IoT systems. Most of my work lives at the
              intersection of the two worlds I like best: code that runs on
              real hardware, and models that make that hardware smarter.
            </p>
            <p>
              My projects range from IoT-based environmental monitoring to
              machine-learning-powered web apps, usually combining AI with
              embedded systems to solve a concrete, physical problem rather
              than a purely digital one.
            </p>
            <p>
              Right now I'm going deeper into <strong>Edge AI</strong>,
              automation, and intelligent systems &mdash; and looking for
              opportunities to put that knowledge into something people
              actually use.
            </p>
          </Reveal>
          <Reveal className="chip-panel" delay={140}>
            <span className="label">Languages &amp; tools</span>
            <div className="chips">
              {SKILLS.map((s) => (
                <span className="chip" key={s}>{s}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects">
        <Reveal className="section-head">
          <span className="eyebrow"></span>
          <h2></h2>
          
        </Reveal>
        <div className="project-grid">
          {PROJECTS.map((p, i) => (
            <Reveal
              as="article"
              className="project-card"
              delay={i * 90}
              key={p.name}
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
                <span className="ref-tag mono">{p.ref}</span>
                <span className="tag">{p.tag}</span>
              </div>
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
              {p.hasImage && images[p.ref] && (
                <div className="card-thumb">
                  <img src={images[p.ref]} alt="" />
                </div>
              )}
              <div className="card-foot">
                <span className="lang">
                  <span className="lang-dot" /> {p.lang}
                  {p.stars > 0 ? ` \u00b7 ${p.stars}\u2605` : ""}
                </span>
                <a
                  className="card-link"
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  View repo <ArrowUpRight size={13} />
                </a>
              </div>
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
          image={images[selectedProject.ref]}
          onUpload={handleUpload}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* CONTACT */}
      <section id="contact">
        <Reveal className="contact-panel">
          <h2>Let's connect two boards.</h2>
          <div className="contact-links">
            <a href={`mailto:${PROFILE.email}`}>
              <Mail size={16} /> {PROFILE.email}
            </a>
            <a href={PROFILE.linkedin} target="_blank" rel="noreferrer">
              <Linkedin size={16} /> in/mudassar-hussain-8952102a0
            </a>
            <a href={PROFILE.github} target="_blank" rel="noreferrer">
              <Github size={16} /> github.com/{PROFILE.handle}
            </a>
            <a href={PROFILE.instagram} target="_blank" rel="noreferrer">
              <Instagram size={16} /> @mudassar.chaudhary620
            </a>
          </div>
        </Reveal>
      </section>

      <footer>
        <span>&copy; 2026 {PROFILE.name}</span>
        <span>BUILT WITH REACT &amp; THREE.JS</span>
      </footer>

      {/* ADMIN */}
      <button className="fab" onClick={() => setAdminOpen(true)}>
        <span className="dot" /> <TerminalSquare size={14} /> Admin
      </button>
      {adminOpen && <AdminModal onClose={() => setAdminOpen(false)} />}
    </div>
  );
}
