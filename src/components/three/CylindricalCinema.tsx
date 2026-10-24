import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MediaItem } from '../../types/cinema';
import { getPosterUrl } from '../../services/tmdb';
import { formatReleaseYear } from '../../utils/pure';
import { cinemaAudio } from '../../services/audio';
import { setupStudioLighting, createPosterTexture, isSoftwareGl } from './glUtils';

interface CylindricalCinemaProps {
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
  onHoverItem?: (item: MediaItem | null) => void;
}

// Module-scope reusable math helpers for zero GC in render loop
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

export const CylindricalCinema: React.FC<CylindricalCinemaProps> = ({
  items,
  onSelect,
  onHoverItem,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<MediaItem[]>(items);
  itemsRef.current = items;

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const onHoverRef = useRef(onHoverItem);
  onHoverRef.current = onHoverItem;

  const [activeTitle, setActiveTitle] = useState<string>('');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070707);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);
    setupStudioLighting(scene, renderer);

    // Curved Card Geometry
    const cardWidth = 2.4;
    const cardHeight = 3.6;
    const cardRadius = 7.0; // Distance from center
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    // Build mesh cards for items
    const meshes: { mesh: THREE.Mesh; item: MediaItem; baseAngle: number }[] = [];
    const count = Math.max(1, itemsRef.current.length);
    const angleStep = (Math.PI * 2) / count;

    // Curved plane geometry for authentic curved amphitheater feel
    const geom = new THREE.PlaneGeometry(cardWidth, cardHeight, 16, 1);
    // Subtle cylinder curve
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, -Math.pow(x / cardWidth, 2) * 0.15);
    }
    geom.computeVertexNormals();

    itemsRef.current.forEach((item, idx) => {
      const angle = idx * angleStep;
      const posterUrl = getPosterUrl(item.poster_path, 'w500');
      const year = formatReleaseYear(item);
      const texture = createPosterTexture(posterUrl, item.title, item.vote_average, year, () => {
        // Redraw on load
      });

      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.25,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geom, material);
      mesh.userData = { mediaItem: item, index: idx };

      // Position on cylinder
      mesh.position.x = Math.sin(angle) * cardRadius;
      mesh.position.z = Math.cos(angle) * cardRadius - cardRadius;
      mesh.rotation.y = angle;

      cardGroup.add(mesh);
      meshes.push({ mesh, item, baseAngle: angle });
    });

    // Interaction & Physics state
    let targetRotationY = 0;
    let currentRotationY = 0;
    let velocityY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartRotation = 0;
    let hoveredMesh: THREE.Mesh | null = null;
    let animFrameId = 0;

    // Mouse / Touch Handlers
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartRotation = targetRotationY;
      velocityY = 0;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - dragStartX;
        const sensitivity = 0.004;
        const newTarget = dragStartRotation + deltaX * sensitivity;
        velocityY = (newTarget - targetRotationY) * 0.8;
        targetRotationY = newTarget;

        if (Math.abs(velocityY) > 0.008) {
          cinemaAudio.playReelTick(Math.abs(velocityY) * 100);
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        // Check if it was a quick click rather than a big drag
        const deltaX = Math.abs(e.clientX - dragStartX);
        if (deltaX < 6) {
          _raycaster.setFromCamera(_mouse, camera);
          const intersects = _raycaster.intersectObjects(cardGroup.children);
          if (intersects.length > 0) {
            const hitItem = intersects[0].object.userData.mediaItem as MediaItem;
            if (hitItem) {
              cinemaAudio.playClick();
              onSelectRef.current(hitItem);
            }
          }
        }
      }
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const wheelDelta = e.deltaY * 0.0022;
      targetRotationY -= wheelDelta;
      velocityY -= wheelDelta * 0.4;
      cinemaAudio.playReelTick(Math.abs(e.deltaY) * 0.04);
    };

    // Touch event handlers for responsive mobile & tablet support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isDragging = true;
        dragStartX = e.touches[0].clientX;
        dragStartRotation = targetRotationY;
        velocityY = 0;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        const deltaX = e.touches[0].clientX - dragStartX;
        const sensitivity = 0.005;
        const newTarget = dragStartRotation + deltaX * sensitivity;
        velocityY = (newTarget - targetRotationY) * 0.8;
        targetRotationY = newTarget;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop with Smooth Exponential Damping & Tilt Physics
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Apply drag momentum inertia
      if (!isDragging) {
        targetRotationY += velocityY;
        velocityY *= 0.92; // Friction damping
      }

      // Frame-rate independent exponential damping
      currentRotationY = THREE.MathUtils.damp(currentRotationY, targetRotationY, 8.5, delta);
      cardGroup.rotation.y = currentRotationY;

      // Card velocity tilt physics
      const currentVel = (targetRotationY - currentRotationY);
      cardGroup.rotation.z = THREE.MathUtils.damp(cardGroup.rotation.z, currentVel * 0.35, 6, delta);

      // Raycast for hover state when not dragging fast
      if (!isDragging && Math.abs(currentVel) < 0.05) {
        _raycaster.setFromCamera(_mouse, camera);
        const intersects = _raycaster.intersectObjects(cardGroup.children);

        if (intersects.length > 0) {
          const topHit = intersects[0].object as THREE.Mesh;
          if (hoveredMesh !== topHit) {
            if (hoveredMesh) {
              (hoveredMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
            }
            hoveredMesh = topHit;
            (hoveredMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x222233);
            const item = hoveredMesh.userData.mediaItem as MediaItem;
            setActiveTitle(item.title);
            onHoverRef.current?.(item);
          }
        } else {
          if (hoveredMesh) {
            (hoveredMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
            hoveredMesh = null;
            setActiveTitle('');
            onHoverRef.current?.(null);
          }
        }
      }

      // Gently animate meshes
      meshes.forEach(({ mesh }) => {
        const isHovered = mesh === hoveredMesh;
        const targetScale = isHovered ? 1.08 : 1.0;
        mesh.scale.setScalar(THREE.MathUtils.damp(mesh.scale.x, targetScale, 10, delta));
      });

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(animate);
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      if (container.contains(dom)) {
        container.removeChild(dom);
      }
      geom.dispose();
      meshes.forEach(({ mesh }) => {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] select-none cursor-grab active:cursor-grabbing overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" data-testid="cylindrical-cinema-canvas" />

      {/* Floating active title pill in cinema viewport */}
      {activeTitle && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300">
          <div className="glass-panel px-5 py-2 rounded-full border border-white/15 shadow-2xl flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="font-display font-medium text-sm tracking-wide text-white uppercase">
              {activeTitle}
            </span>
            <span className="text-xs text-white/50 tracking-wider">Click to Inspect</span>
          </div>
        </div>
      )}

      {/* Interactive Drag & Scroll Guidance Indicator */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none text-xs tracking-widest text-white/40 uppercase font-mono-code flex items-center gap-2">
        <span>← Drag or Scroll to Rotate 3D Amphitheater →</span>
      </div>
    </div>
  );
};
