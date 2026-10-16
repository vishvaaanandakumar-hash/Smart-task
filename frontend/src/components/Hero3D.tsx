import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * A tasteful, subtle 3D visualization for the landing hero: a small stack of
 * floating "task cards" with soft depth and slow motion — not a decorative
 * gimmick, meant to visually echo the product (tasks stacking, staying organized).
 */
export default function Hero3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth, h = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    camera.position.set(0, 0.3, 6.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const colors = [0x14213d, 0x3b4c9b, 0xf8f6f1];
    const cards: THREE.Mesh[] = [];
    colors.forEach((color, i) => {
      const geo = new THREE.BoxGeometry(2.6, 1.6, 0.06);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(i * 0.18, -i * 0.32, -i * 0.5);
      mesh.rotation.set(-0.12 + i * 0.03, 0.18 - i * 0.05, -0.04 + i * 0.02);
      group.add(mesh);
      cards.push(mesh);
    });

    // small accent dot on the top card, echoing a location pin
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x3b4c9b, emissive: 0x3b4c9b, emissiveIntensity: 0.4 })
    );
    pin.position.set(0.95, 0.55, 0.05);
    cards[0].add(pin);

    // slow-orbiting geofence ring, echoing the location-radius concept
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.015, 12, 96),
      new THREE.MeshStandardMaterial({ color: 0x5c7aea, roughness: 0.3, metalness: 0.2, transparent: true, opacity: 0.55 })
    );
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);

    // faint particle field for depth
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 60;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1.5;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({ color: 0x3b4c9b, size: 0.025, transparent: true, opacity: 0.4 }));
    scene.add(particles);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x3b4c9b, 0.5);
    rim.position.set(-4, -2, -3);
    scene.add(rim);

    let mx = 0, my = 0, raf = 0;
    function onMove(e: MouseEvent) {
      const r = mount!.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
    }
    mount.addEventListener("mousemove", onMove);

    const clock = new THREE.Clock();
    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      group.rotation.y = 0.15 + mx * 0.35;
      group.rotation.x = -0.05 + my * 0.2;
      group.position.y = Math.sin(t * 0.6) * 0.06;
      ring.rotation.z = t * 0.15;
      particles.rotation.y = t * 0.03;
      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      if (!mount) return;
      const w2 = mount.clientWidth, h2 = mount.clientHeight;
      renderer.setSize(w2, h2);
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      mount.removeEventListener("mousemove", onMove);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}
