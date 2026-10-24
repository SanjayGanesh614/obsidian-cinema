import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MediaItem } from '../../types/cinema';
import { TMDB_GENRES } from '../../services/tmdb';
import { cinemaAudio } from '../../services/audio';
import { isSoftwareGl } from './glUtils';

interface GenreConstellationProps {
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
  onHoverItem?: (item: MediaItem | null) => void;
}

const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

export const GenreConstellation: React.FC<GenreConstellationProps> = ({ items, onSelect, onHoverItem }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<MediaItem[]>(items);
  itemsRef.current = items;

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const onHoverRef = useRef(onHoverItem);
  onHoverRef.current = onHoverItem;

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);
    scene.fog = new THREE.FogExp2(0x050508, 0.04);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));

    container.appendChild(renderer.domElement);

    // Starfield particles
    const starCount = isSoftwareGl ? 400 : 1200;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 40;
      starPositions[i + 1] = (Math.random() - 0.5) * 40;
      starPositions[i + 2] = (Math.random() - 0.5) * 40;
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x8899bb,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
    });
    const starPoints = new THREE.Points(starGeom, starMat);
    scene.add(starPoints);

    // Constellation Group
    const constellationGroup = new THREE.Group();
    scene.add(constellationGroup);

    // Filter to top active genres present in current items
    const activeGenreIds = new Set<number>();
    itemsRef.current.forEach((m) => m.genre_ids.forEach((id) => activeGenreIds.add(id)));
    const relevantGenres = TMDB_GENRES.filter((g) => activeGenreIds.has(g.id)).slice(0, 7);

    // Place genre hubs on a 3D orbit
    const genreNodes: { id: number; name: string; position: THREE.Vector3; mesh: THREE.Mesh }[] = [];
    const hubGeom = new THREE.SphereGeometry(0.55, 16, 16);

    relevantGenres.forEach((genre, idx) => {
      const angle = (idx / relevantGenres.length) * Math.PI * 2;
      const radius = 5.2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.7;
      const z = (Math.sin(angle * 2) * 1.5);
      const pos = new THREE.Vector3(x, y, z);

      const hubMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
      });
      const hubMesh = new THREE.Mesh(hubGeom, hubMat);
      hubMesh.position.copy(pos);
      constellationGroup.add(hubMesh);

      genreNodes.push({ id: genre.id, name: genre.name, position: pos, mesh: hubMesh });
    });

    // Movie Nodes
    const movieGeom = new THREE.SphereGeometry(0.35, 16, 16);
    const movieNodes: { mesh: THREE.Mesh; item: MediaItem }[] = [];
    const linePositions: number[] = [];

    itemsRef.current.forEach((item, idx) => {
      // Find nearest genre hub
      const primaryGenreId = item.genre_ids[0];
      const hub = genreNodes.find((g) => g.id === primaryGenreId) || genreNodes[idx % genreNodes.length];

      // Offset around hub
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const dist = 1.2 + Math.random() * 1.2;

      const x = hub.position.x + Math.sin(theta) * Math.cos(phi) * dist;
      const y = hub.position.y + Math.sin(theta) * Math.sin(phi) * dist;
      const z = hub.position.z + Math.cos(theta) * dist;

      const movieMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.4,
        roughness: 0.3,
        metalness: 0.7,
      });

      const movieMesh = new THREE.Mesh(movieGeom, movieMat);
      movieMesh.position.set(x, y, z);
      movieMesh.userData = { mediaItem: item, isMovie: true };
      constellationGroup.add(movieMesh);
      movieNodes.push({ mesh: movieMesh, item });

      // Add connection line from hub to movie
      linePositions.push(hub.position.x, hub.position.y, hub.position.z);
      linePositions.push(x, y, z);
    });

    // Connection lines
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.25,
    });
    const lines = new THREE.LineSegments(lineGeom, lineMat);
    constellationGroup.add(lines);

    // Mouse Controls & Drag Rotation
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let rotX = 0;
    let rotY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let hoveredMesh: THREE.Mesh | null = null;
    let animFrameId = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;
        targetRotY += deltaX * 0.005;
        targetRotX += deltaY * 0.005;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        _raycaster.setFromCamera(_mouse, camera);
        const intersects = _raycaster.intersectObjects(movieNodes.map((n) => n.mesh));
        if (intersects.length > 0) {
          const item = intersects[0].object.userData.mediaItem as MediaItem;
          if (item) {
            cinemaAudio.playClick();
            onSelectRef.current(item);
          }
        }
      }
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.006, 5, 18);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

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

      // Slow ambient celestial rotation
      if (!isDragging) {
        targetRotY += 0.0015;
      }

      rotX = THREE.MathUtils.damp(rotX, targetRotX, 8, dt);
      rotY = THREE.MathUtils.damp(rotY, targetRotY, 8, dt);

      constellationGroup.rotation.x = rotX;
      constellationGroup.rotation.y = rotY;

      // Pulse star points
      starPoints.rotation.y = now * 0.0002;

      // Raycast hover
      _raycaster.setFromCamera(_mouse, camera);
      const intersects = _raycaster.intersectObjects(movieNodes.map((n) => n.mesh));
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        if (hoveredMesh !== hit) {
          if (hoveredMesh) (hoveredMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4;
          hoveredMesh = hit;
          (hoveredMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;
          const it = hoveredMesh.userData.mediaItem as MediaItem;
          setHoveredNode(it.title);
          onHoverRef.current?.(it);
        }
      } else if (hoveredMesh) {
        (hoveredMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4;
        hoveredMesh = null;
        setHoveredNode(null);
        onHoverRef.current?.(null);
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
      if (container.contains(dom)) container.removeChild(dom);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] select-none cursor-grab active:cursor-grabbing overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" data-testid="genre-constellation-canvas" />

      {hoveredNode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="glass-panel px-5 py-2 rounded-full border border-amber-500/30 shadow-2xl flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="font-display font-medium text-sm tracking-wide text-white uppercase">
              {hoveredNode}
            </span>
            <span className="text-xs text-amber-200/60 font-mono-code">Orbit Node</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none text-xs tracking-widest text-white/40 uppercase font-mono-code flex items-center gap-2">
        <span>★ 3D Genre Constellation Galaxy · Drag to Orbit · Scroll to Zoom ★</span>
      </div>
    </div>
  );
};
