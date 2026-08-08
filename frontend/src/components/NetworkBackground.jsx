import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function NetworkBackground() {
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

      // Gentle pulsing breathing line glow
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
