import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  completionRate?: number;
}

export default function Dashboard3D({ completionRate = 65 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth, h = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Core central crystal / sphere
    const coreGeo = new THREE.IcosahedronGeometry(0.7, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Inner wireframe
    const wireGeo = new THREE.IcosahedronGeometry(0.75, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    group.add(wire);

    // Orbital completion rings
    const ring1Geo = new THREE.TorusGeometry(1.2, 0.02, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.3,
      metalness: 0.7,
      transparent: true,
      opacity: 0.8,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    group.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(1.4, 0.015, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.3,
      metalness: 0.7,
      transparent: true,
      opacity: 0.7,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    group.add(ring2);

    // Surrounding ambient particles
    const particleGeo = new THREE.BufferGeometry();
    const count = 40;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const rad = 1.6 + Math.random() * 0.6;
      positions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = rad * Math.cos(phi);
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x6366f1,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const light1 = new THREE.DirectionalLight(0x6366f1, 2.5);
    light1.position.set(3, 4, 3);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0x10b981, 1.5);
    light2.position.set(-3, -2, -2);
    scene.add(light2);

    let mouseX = 0, mouseY = 0, raf = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    };
    mount.addEventListener("mousemove", onMouseMove);

    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      core.rotation.y = elapsed * 0.4;
      core.rotation.x = elapsed * 0.25;
      wire.rotation.y = -elapsed * 0.2;

      ring1.rotation.x = elapsed * 0.35 + mouseY * 0.3;
      ring1.rotation.y = elapsed * 0.2 + mouseX * 0.3;

      ring2.rotation.y = -elapsed * 0.4 + mouseX * 0.4;
      ring2.rotation.z = elapsed * 0.15;

      particles.rotation.y = elapsed * 0.08;

      group.position.y = Math.sin(elapsed * 0.8) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth, nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      mount.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [completionRate]);

  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}
