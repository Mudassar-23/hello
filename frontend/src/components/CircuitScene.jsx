import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function CircuitScene() {
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

    const rig = new THREE.Group();
    scene.add(rig);

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
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
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
