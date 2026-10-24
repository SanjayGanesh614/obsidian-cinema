import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MediaItem } from '../../types/cinema';
import { getPosterUrl } from '../../services/tmdb';
import { formatReleaseYear } from '../../utils/pure';
import { cinemaAudio } from '../../services/audio';
import { setupStudioLighting, createPosterTexture, isSoftwareGl } from './glUtils';

interface SpatialRibbonProps {
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
  onHoverItem?: (item: MediaItem | null) => void;
}

const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

export const SpatialRibbon: React.FC<SpatialRibbonProps> = ({ items, onSelect, onHoverItem }) => {
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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070707);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 7.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.appendChild(renderer.domElement);
    setupStudioLighting(scene, renderer);

    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    const cardWidth = 2.2;
    const cardHeight = 3.3;
    const geom = new THREE.PlaneGeometry(cardWidth, cardHeight, 4, 4);

    const meshes: { mesh: THREE.Mesh; item: MediaItem; index: number }[] = [];
    const count = itemsRef.current.length;
    const spacing = 3.2;

    itemsRef.current.forEach((item, idx) => {
      const posterUrl = getPosterUrl(item.poster_path, 'w500');
      const year = formatReleaseYear(item);
      const texture = createPosterTexture(posterUrl, item.title, item.vote_average, year);

      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geom, material);
      mesh.userData = { mediaItem: item, index: idx };
      cardGroup.add(mesh);
      meshes.push({ mesh, item, index: idx });
    });

    let scrollOffset = 0;
    let targetOffset = 0;
    let velocity = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartOffset = 0;
    let hoveredMesh: THREE.Mesh | null = null;
    let animFrameId = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartOffset = targetOffset;
      velocity = 0;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - dragStartX;
        const newTarget = dragStartOffset - deltaX * 0.015;
        velocity = (newTarget - targetOffset) * 0.5;
        targetOffset = newTarget;

        if (Math.abs(velocity) > 0.05) {
          cinemaAudio.playReelTick(Math.abs(velocity) * 20);
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (isDragging) {
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
      const delta = (e.deltaY || e.deltaX) * 0.008;
      targetOffset += delta;
      velocity += delta * 0.2;
      cinemaAudio.playReelTick(Math.abs(delta) * 15);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Touch support
    let touchStartX = 0;
    let touchStartOffset = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isDragging = true;
        touchStartX = e.touches[0].clientX;
        touchStartOffset = targetOffset;
        velocity = 0;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        const deltaX = e.touches[0].clientX - touchStartX;
        targetOffset = touchStartOffset - deltaX * 0.015;
      }
    };
    const onTouchEnd = () => { isDragging = false; };

    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    const onResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!isDragging) {
        targetOffset += velocity;
        velocity *= 0.92;
      }

      scrollOffset = THREE.MathUtils.damp(scrollOffset, targetOffset, 8, dt);

      // Distribute meshes along an undulating 3D sine ribbon curve
      meshes.forEach(({ mesh, index }) => {
        // Linear position along ribbon
        const ribbonLength = count * spacing;
        let x = (index * spacing - scrollOffset) % ribbonLength;
        if (x < -ribbonLength / 2) x += ribbonLength;
        if (x > ribbonLength / 2) x -= ribbonLength;

        // Wave curve formula
        const z = -Math.pow(x * 0.28, 2) + Math.sin(x * 0.5 + now * 0.001) * 0.4;
        const y = Math.sin(x * 0.4) * 0.5;
        const rotY = -x * 0.12;
        const rotZ = Math.sin(x * 0.4) * 0.08;

        mesh.position.set(x, y, z);
        mesh.rotation.set(0, rotY, rotZ);

        const isHovered = mesh === hoveredMesh;
        const targetScale = isHovered ? 1.12 : 1.0;
        mesh.scale.setScalar(THREE.MathUtils.damp(mesh.scale.x, targetScale, 10, dt));
      });

      // Raycast hover
      if (!isDragging) {
        _raycaster.setFromCamera(_mouse, camera);
        const intersects = _raycaster.intersectObjects(cardGroup.children);
        if (intersects.length > 0) {
          const topHit = intersects[0].object as THREE.Mesh;
          if (hoveredMesh !== topHit) {
            hoveredMesh = topHit;
            const item = hoveredMesh.userData.mediaItem as MediaItem;
            setActiveTitle(item.title);
            onHoverRef.current?.(item);
          }
        } else if (hoveredMesh) {
          hoveredMesh = null;
          setActiveTitle('');
          onHoverRef.current?.(null);
        }
      }

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
      if (container.contains(dom)) container.removeChild(dom);
      geom.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] select-none cursor-grab active:cursor-grabbing overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" data-testid="spatial-ribbon-canvas" />

      {activeTitle && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="glass-panel px-5 py-2 rounded-full border border-white/15 shadow-2xl flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-display font-medium text-sm tracking-wide text-white uppercase">
              {activeTitle}
            </span>
            <span className="text-xs text-white/50 tracking-wider">Inspect</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none text-xs tracking-widest text-white/40 uppercase font-mono-code flex items-center gap-2">
        <span>← Flowing 3D Spatial Conveyor · Drag or Wheel →</span>
      </div>
    </div>
  );
};
