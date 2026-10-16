import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  isMonitoring: boolean;
  activeCount: number;
}

export default function RadarBeacon3D({ isMonitoring, activeCount }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const monRef = useRef(isMonitoring);
  monRef.current = isMonitoring;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const w = mount.clientWidth, h = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 1.8, 3.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Radar grid base
    const gridHelper = new THREE.PolarGridHelper(1.6, 16, 8, 64, 0x4f46e5, 0x1e293b);
    gridHelper.position.y = -0.3;
    group.add(gridHelper);

    // Central beacon pin
    const beaconGeo = new THREE.ConeGeometry(0.12, 0.45, 16);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      emissive: 0x312e81,
      roughness: 0.2,
      metalness: 0.8,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 0.1;
    beacon.rotation.x = Math.PI;
    group.add(beacon);

    // Glowing satellite sphere at top of pin
    const orbGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.y = 0.35;
    group.add(orb);

    // Concentric expanding pulse wave rings
    const waveCount = 3;
    const waves: { mesh: THREE.Mesh; scale: number; speed: number }[] = [];
    for (let i = 0; i < waveCount; i++) {
      const waveGeo = new THREE.RingGeometry(0.05, 0.08, 32);
      const waveMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const waveMesh = new THREE.Mesh(waveGeo, waveMat);
      waveMesh.rotation.x = -Math.PI / 2;
      waveMesh.position.y = -0.28;
      group.add(waveMesh);
      waves.push({ mesh: waveMesh, scale: i * 0.33, speed: 0.35 + i * 0.05 });
    }

    // Sweeping radar beam line
    const sweepGeo = new THREE.BufferGeometry();
    const sweepPts = new Float32Array([0, -0.28, 0, 1.4, -0.28, 0]);
    sweepGeo.setAttribute("position", new THREE.BufferAttribute(sweepPts, 3));
    const sweepMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.7 });
    const sweepLine = new THREE.Line(sweepGeo, sweepMat);
    group.add(sweepLine);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dLight.position.set(2, 3, 2);
    scene.add(dLight);

    let raf = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Rotate radar sweep
      if (monRef.current) {
        sweepLine.rotation.y += delta * 1.8;
        group.rotation.y += delta * 0.1;
      }

      // Expand pulses
      waves.forEach((w) => {
        w.scale += delta * w.speed;
        if (w.scale > 1.6) w.scale = 0.05;
        w.mesh.scale.set(w.scale, w.scale, 1);
        (w.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - w.scale / 1.6);
      });

      // Pulse beacon orb
      const pulse = 1 + Math.sin(elapsed * 3) * 0.15;
      orb.scale.set(pulse, pulse, pulse);

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
