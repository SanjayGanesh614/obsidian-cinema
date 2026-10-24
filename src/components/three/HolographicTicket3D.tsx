import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TicketStub } from '../../types/cinema';
import { getPosterUrl } from '../../services/tmdb';
import { cinemaAudio } from '../../services/audio';
import { isSoftwareGl } from './glUtils';
import { RotateCw, Sparkles, Volume2 } from 'lucide-react';

interface HolographicTicket3DProps {
  ticket: TicketStub;
  onClose?: () => void;
}

export const HolographicTicket3D: React.FC<HolographicTicket3DProps> = ({ ticket, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const isFlippedRef = useRef(false);
  isFlippedRef.current = isFlipped;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 500;
    let height = container.clientHeight || 550;

    const scene = new THREE.Scene();
    scene.background = null; // transparent to show ambient modal glass

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0, 5.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    container.appendChild(renderer.domElement);

    // Studio lighting specifically for metallic foil glints
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(3, 4, 5);
    scene.add(mainLight);

    const blueLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    blueLight.position.set(-4, -2, 3);
    scene.add(blueLight);

    const goldLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
    goldLight.position.set(0, -4, -3);
    scene.add(goldLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    // Generate Front & Back Ticket Textures
    const frontCanvas = document.createElement('canvas');
    frontCanvas.width = 600;
    frontCanvas.height = 960;
    const fctx = frontCanvas.getContext('2d')!;

    // Draw Front Ticket Face
    drawTicketFront(fctx, ticket);
    const frontTexture = new THREE.CanvasTexture(frontCanvas);
    frontTexture.colorSpace = THREE.SRGBColorSpace;

    // Load poster onto front
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = getPosterUrl(ticket.posterPath, 'w500');
    img.onload = () => {
      drawTicketFront(fctx, ticket, img);
      frontTexture.needsUpdate = true;
    };
    img.onerror = () => {
      // Retain high-contrast obsidian artwork placeholder
    };

    // Draw Back Ticket Face
    const backCanvas = document.createElement('canvas');
    backCanvas.width = 600;
    backCanvas.height = 960;
    const bctx = backCanvas.getContext('2d')!;
    drawTicketBack(bctx, ticket);
    const backTexture = new THREE.CanvasTexture(backCanvas);
    backTexture.colorSpace = THREE.SRGBColorSpace;

    // Ticket Geometry (Thin extruded box for physical card thickness)
    const cardWidth = 2.4;
    const cardHeight = 3.84;
    const cardDepth = 0.024;
    const geom = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);

    // Determine foil finishes
    const metalness = ticket.finish === 'onyx_chrome' ? 0.85 : ticket.finish === 'gold_leaf' ? 0.75 : 0.6;
    const roughness = ticket.finish === 'onyx_chrome' ? 0.15 : 0.3;

    // Materials for the 6 faces: right, left, top, bottom, front, back
    const edgeMat = new THREE.MeshStandardMaterial({
      color: ticket.finish === 'gold_leaf' ? 0xd4af37 : 0x1f1f28,
      metalness: 0.8,
      roughness: 0.2,
    });

    const frontMat = new THREE.MeshStandardMaterial({
      map: frontTexture,
      metalness,
      roughness,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
    });

    const backMat = new THREE.MeshStandardMaterial({
      map: backTexture,
      metalness: 0.3,
      roughness: 0.5,
    });

    const ticketMesh = new THREE.Mesh(geom, [
      edgeMat, // +x
      edgeMat, // -x
      edgeMat, // +y
      edgeMat, // -y
      frontMat, // +z
      backMat, // -z
    ]);

    scene.add(ticketMesh);

    // Mouse drag interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotation = { x: 0, y: 0 };
    let currentRotation = { x: 0, y: 0 };
    let animFrameId = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        targetRotation.y += deltaX * 0.012;
        targetRotation.x += deltaY * 0.012;

        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;
        targetRotation.y += deltaX * 0.012;
        targetRotation.x += deltaY * 0.012;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchEnd = () => { isDragging = false; };

    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Desired flip base rotation
      const baseFlipY = isFlippedRef.current ? Math.PI : 0;

      // Subtle ambient hover breathing when idle
      const idleFloatX = Math.sin(now * 0.0015) * 0.06;
      const idleFloatY = Math.cos(now * 0.0018) * 0.08;

      currentRotation.x = THREE.MathUtils.damp(currentRotation.x, targetRotation.x + idleFloatX, 8, dt);
      currentRotation.y = THREE.MathUtils.damp(currentRotation.y, targetRotation.y + baseFlipY + idleFloatY, 8, dt);

      ticketMesh.rotation.x = currentRotation.x;
      ticketMesh.rotation.y = currentRotation.y;

      // Rotate directional glint light with ticket for iridescent rainbow sheen
      blueLight.position.x = Math.sin(now * 0.002) * 5;
      mainLight.position.y = Math.cos(now * 0.002) * 5;

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(animate);
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (container.contains(dom)) container.removeChild(dom);
      geom.dispose();
      frontMat.dispose();
      backMat.dispose();
      edgeMat.dispose();
      renderer.dispose();
    };
  }, [ticket]);

  const toggleFlip = () => {
    cinemaAudio.playWhoosh();
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-[340px] sm:w-[420px] h-[480px] sm:h-[520px] cursor-grab active:cursor-grabbing">
        <div ref={mountRef} className="w-full h-full" data-testid="holographic-ticket-canvas" />

        {/* Ambient Holographic Ring Light */}
        <div className="absolute inset-0 pointer-events-none rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.06)]" />
      </div>

      {/* Ticket Controls Dock */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={toggleFlip}
          className="px-4 py-2 rounded-full glass-panel border border-white/20 text-xs font-mono-code uppercase tracking-wider text-white hover:border-amber-400 hover:text-amber-300 transition-all flex items-center gap-2"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{isFlipped ? 'View Poster Face' : 'Flip to Review & Stamped Seal'}</span>
        </button>

        <div className="glass-panel px-3 py-2 rounded-full border border-white/10 text-xs font-mono-code text-white/60 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="capitalize">{ticket.finish.replace('_', ' ')} Foil</span>
        </div>
      </div>
    </div>
  );
};

// Procedural Canvas Ticket Stamping Functions
function drawTicketFront(
  ctx: CanvasRenderingContext2D,
  ticket: TicketStub,
  posterImg?: HTMLImageElement
) {
  const w = 600;
  const h = 960;

  // Obsidian card body
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(0, 0, w, h);

  // Background artwork (Top 55% of card)
  if (posterImg) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(20, 20, w - 40, 500);
    ctx.clip();
    ctx.drawImage(posterImg, 20, 20, w - 40, 500);

    // Dark cinematic gradient over artwork
    const artVignette = ctx.createLinearGradient(0, 200, 0, 520);
    artVignette.addColorStop(0, 'rgba(10, 10, 14, 0)');
    artVignette.addColorStop(0.7, 'rgba(10, 10, 14, 0.85)');
    artVignette.addColorStop(1, 'rgba(10, 10, 14, 1)');
    ctx.fillStyle = artVignette;
    ctx.fillRect(20, 20, w - 40, 500);
    ctx.restore();
  }

  // Header admission banner
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '700 18px "Cinzel", serif';
  ctx.letterSpacing = '4px';
  ctx.textAlign = 'center';
  ctx.fillText('OBSIDIAN ARCHIVE · ADMIT ONE', w / 2, 55);

  // Perforated tear line indicators (at y = 690)
  const tearY = 690;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.setLineDash([8, 8]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, tearY);
  ctx.lineTo(w - 30, tearY);
  ctx.stroke();
  ctx.setLineDash([]); // Reset

  // Notched perforation side cutouts
  ctx.fillStyle = '#070707';
  ctx.beginPath();
  ctx.arc(0, tearY, 18, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w, tearY, 18, Math.PI / 2, -Math.PI / 2);
  ctx.fill();

  // Film Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 36px "Space Grotesk", sans-serif';
  ctx.textAlign = 'left';
  const displayTitle = ticket.title.length > 20 ? ticket.title.substring(0, 18) + '…' : ticket.title;
  ctx.fillText(displayTitle, 40, 580);

  // Release year & Cinema hall
  ctx.fillStyle = '#9ca3af';
  ctx.font = '500 20px "JetBrains Mono", monospace';
  ctx.fillText(`${ticket.theatre} · ${ticket.year}`, 40, 615);

  // Seat Badge
  ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(40, 635, 300, 34, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = '600 16px "JetBrains Mono", monospace';
  ctx.fillText(ticket.seat, 55, 658);

  // Star Rating on upper right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f59e0b';
  ctx.font = '700 32px "Space Grotesk", sans-serif';
  ctx.fillText(`${ticket.rating.toFixed(1)}`, w - 40, 580);

  // Draw vector gold star next to number
  drawVectorStar(ctx, w - 110, 568, 5, 12, 6, '#f59e0b');

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '16px "JetBrains Mono", monospace';
  ctx.fillText('CRITIC SCORE', w - 40, 610);

  // --- LOWER STUB SECTION (Below tear line) ---
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9ca3af';
  ctx.font = '16px "JetBrains Mono", monospace';
  ctx.fillText('DATE RECORDED', 40, 730);
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.fillText(ticket.watchDate, 40, 755);

  // Holographic security badge seal
  ctx.save();
  const sealGrad = ctx.createLinearGradient(420, 720, 540, 840);
  if (ticket.finish === 'gold_leaf') {
    sealGrad.addColorStop(0, '#ffd700');
    sealGrad.addColorStop(0.5, '#b8860b');
    sealGrad.addColorStop(1, '#daa520');
  } else if (ticket.finish === 'onyx_chrome') {
    sealGrad.addColorStop(0, '#e5e7eb');
    sealGrad.addColorStop(0.5, '#4b5563');
    sealGrad.addColorStop(1, '#9ca3af');
  } else {
    // Iridescent spectrum
    sealGrad.addColorStop(0, '#f43f5e');
    sealGrad.addColorStop(0.25, '#ec4899');
    sealGrad.addColorStop(0.5, '#3b82f6');
    sealGrad.addColorStop(0.75, '#10b981');
    sealGrad.addColorStop(1, '#eab308');
  }
  ctx.fillStyle = sealGrad;
  ctx.beginPath();
  ctx.arc(490, 755, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0a0a0e';
  ctx.font = '900 13px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText('VERIFIED', 490, 752);
  ctx.fillText('ARCHIVE', 490, 768);
  ctx.restore();

  // Scannable barcode representation
  drawBarcode(ctx, ticket.barcode, 40, 810, 520, 60);

  // Outer Luxury Border
  ctx.strokeStyle = ticket.finish === 'gold_leaf' ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, w - 20, h - 20);
}

function drawTicketBack(ctx: CanvasRenderingContext2D, ticket: TicketStub) {
  const w = 600;
  const h = 960;

  ctx.fillStyle = '#0e0e14';
  ctx.fillRect(0, 0, w, h);

  // Subtle guilloche / certificate pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(w - i, h);
    ctx.stroke();
  }

  // Header
  ctx.fillStyle = '#d4af37';
  ctx.font = '700 24px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText('OBSIDIAN CINEMA LOG', w / 2, 80);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '14px "JetBrains Mono", monospace';
  ctx.fillText('PERSONAL ARCHIVE DISPATCH · VOL. 2026', w / 2, 110);

  // Separator
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.moveTo(60, 140);
  ctx.lineTo(w - 60, 140);
  ctx.stroke();

  // Handwritten / Typewriter review notes
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '500 22px "Space Grotesk", sans-serif';
  ctx.fillText('CRITIC\'S NOTEBOOK & IMPRESSIONS', 60, 190);

  // Word wrap review
  ctx.fillStyle = '#d1d5db';
  ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
  const words = (ticket.review || 'An astonishing cinematic accomplishment. Highly recommended for the archive.').split(' ');
  let line = '';
  let lineY = 240;
  const maxWidth = 480;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, 60, lineY);
      line = words[n] + ' ';
      lineY += 34;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 60, lineY);

  // Certification Stamp
  ctx.save();
  ctx.translate(w / 2, 600);
  ctx.rotate(-0.12);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.strokeRect(-120, -35, 240, 70);

  ctx.fillStyle = '#ef4444';
  ctx.font = '700 20px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText('ACQUIRED & LOGGED', 0, -5);
  ctx.font = '14px "JetBrains Mono", monospace';
  ctx.fillText(ticket.barcode, 0, 22);
  ctx.restore();

  // Bottom seal
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NON-TRANSFERABLE DIGITAL ASSET · ARCHIVED IN PERPETUITY', w / 2, 880);

  // Outer border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, w - 20, h - 20);
}

function drawBarcode(
  ctx: CanvasRenderingContext2D,
  code: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.fillStyle = '#ffffff';
  let curX = x;
  const hash = Math.abs(hashCode(code));

  for (let i = 0; i < 48; i++) {
    const bit = (hash >> (i % 31)) & 1;
    const barWidth = (i % 4 === 0 || bit === 1) ? 3 : 1.5;
    ctx.fillRect(curX, y, barWidth, height - 16);
    curX += barWidth + (i % 3 === 0 ? 5 : 3);
    if (curX > x + width - 10) break;
  }

  // Label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '14px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(code, x + width / 2, y + height + 6);
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

function drawVectorStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  color: string
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
