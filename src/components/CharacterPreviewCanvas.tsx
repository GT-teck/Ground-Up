import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CharacterCustomization } from '../types';
import { createHumanCharacter, CharacterRig } from '../utils/characterModel';

interface CharacterPreviewCanvasProps {
  character: CharacterCustomization;
  className?: string;
}

export const CharacterPreviewCanvas: React.FC<CharacterPreviewCanvasProps> = ({
  character,
  className = 'w-full h-64',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<CharacterRig | null>(null);
  const rotationYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const prevPointerXRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = null; // transparent background

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 1.15, 3.4);
    camera.lookAt(0, 1.05, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting (Warm studio automotive garage lights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    keyLight.position.set(3, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.2);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Floor pedestal / circular spotlight shadow
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.95, 0.06, 32),
      new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.6,
        roughness: 0.4,
      })
    );
    pedestal.position.set(0, -0.03, 0);
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // Subtle glowing rim on pedestal
    const pedestalRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.015, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    pedestalRing.rotation.x = Math.PI / 2;
    scene.add(pedestalRing);

    // 4. Generate Human Character Rig
    const rig = createHumanCharacter(character);
    rigRef.current = rig;
    rig.group.position.set(0, 0, 0);
    scene.add(rig.group);

    // 5. Interactive Drag to Rotate
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      prevPointerXRef.current = clientX;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const dx = clientX - prevPointerXRef.current;
      prevPointerXRef.current = clientX;
      rotationYRef.current += dx * 0.012;
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    container.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 6. Animation Loop
    let animId: number;
    let lastTime = performance.now();

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Auto gentle turntable turn if not actively dragging
      if (!isDraggingRef.current) {
        rotationYRef.current += dt * 0.25;
      }

      if (rigRef.current) {
        rigRef.current.group.rotation.y = rotationYRef.current;
        rigRef.current.updateAnimation(dt, false, false);
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      container.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

      if (rigRef.current) {
        rigRef.current.dispose();
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [character]);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden">
      <div
        ref={containerRef}
        className={`${className} cursor-grab active:cursor-grabbing`}
        title="Drag or swipe to rotate character 360°"
      />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/60 border border-zinc-800 backdrop-blur-sm text-[10px] font-tech text-zinc-400 pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
        <span>↔ Drag to Rotate</span>
      </div>
    </div>
  );
};
