import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  running: boolean;
  progress: number; // 0 to 1
}

export default function FocusTimer3D({ running, progress }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef(running);
  runningRef.current = running;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth, h = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 0, 4.0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Dual conical hourglass structure
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      roughness: 0.15,
      metalness: 0.85,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });

    const topCone = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.0, 16, 2, true), coneMat);
    topCone.position.y = 0.5;
    topCone.rotation.x = Math.PI;
    group.add(topCone);

    const bottomCone = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.0, 16, 2, true), coneMat);
    bottomCone.position.y = -0.5;
    group.add(bottomCone);

    // Glowing energy core inside
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.5,
    });
    const coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), coreMat);
    group.add(coreMesh);

    // Outer rotating meridian rings
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.02, 12, 64), ringMat);
    group.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.015, 12, 64), ringMat);
    ring2.rotation.x = Math.PI / 2;
    group.add(ring2);

    // Particle flow
    const pCount = 35;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 0.4;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 1.6;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x22d3ee,
      size: 0.045,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(pGeo, pMat);
    group.add(particles);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const pointLight = new THREE.PointLight(0x06b6d4, 3, 10);
    pointLight.position.set(0, 0, 1.5);
    scene.add(pointLight);

    let raf = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const speedMultiplier = runningRef.current ? 2.5 : 0.8;

      group.rotation.y += delta * 0.4 * speedMultiplier;
      ring1.rotation.x += delta * 0.3 * speedMultiplier;
      ring2.rotation.y += delta * 0.25 * speedMultiplier;
      coreMesh.rotation.y -= delta * 0.8 * speedMultiplier;

      // Pulse energy core
      const pulse = 1 + Math.sin(elapsed * (runningRef.current ? 4 : 1.5)) * 0.15;
      coreMesh.scale.set(pulse, pulse, pulse);

      // Particle oscillation
      const posArr = pGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < pCount; i++) {
        if (runningRef.current) {
          posArr[i * 3 + 1] -= delta * 0.6;
          if (posArr[i * 3 + 1] < -0.8) posArr[i * 3 + 1] = 0.8;
        }
      }
      pGeo.attributes.position.needsUpdate = true;

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
      window.removeEventListener("resize", onResize);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}
