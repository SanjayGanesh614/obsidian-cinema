import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return true;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
})();

export function setupStudioLighting(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  // Studio room environment for metallic reflections
  try {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();
  } catch (e) {
    console.warn('PMREM environment generation skipped', e);
  }

  // Key Light
  const keyLight = new THREE.DirectionalLight(0xffeedd, 2.2);
  keyLight.position.set(5, 8, 7);
  scene.add(keyLight);

  // Rim / Back Light (cool cinematic cyan/violet)
  const rimLight = new THREE.DirectionalLight(0x7080ff, 1.8);
  rimLight.position.set(-6, -4, -6);
  scene.add(rimLight);

  // Soft Hemisphere fill
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x111122, 1.0);
  scene.add(hemiLight);

  // Horizon fog to blend deep obsidian void
  scene.fog = new THREE.FogExp2(0x070707, 0.038);
}

// Procedural Poster Card Texture Generator with high-res canvas fallback
const textureCache = new Map<string, THREE.Texture>();

export function createPosterTexture(
  imageUrl: string,
  title: string,
  rating: number,
  year: string,
  onLoaded?: () => void
): THREE.Texture {
  const cacheKey = `${imageUrl}_${title}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  // Placeholder dark cinematic gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 768);
  grad.addColorStop(0, '#1c1c24');
  grad.addColorStop(0.5, '#121216');
  grad.addColorStop(1, '#08080a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 768);

  // Border & title placeholder
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 492, 748);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title.length > 20 ? title.substring(0, 18) + '...' : title, 256, 384);

  ctx.font = '24px "JetBrains Mono", monospace';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`★ ${rating.toFixed(1)} · ${year}`, 256, 440);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  textureCache.set(cacheKey, texture);

  // Load actual image onto canvas asynchronously
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = imageUrl;
  img.onload = () => {
    try {
      ctx.drawImage(img, 0, 0, 512, 768);

      // Vignette & sleek bottom glass gradient for title legibility
      const vig = ctx.createLinearGradient(0, 450, 0, 768);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(0.65, 'rgba(0, 0, 0, 0.75)');
      vig.addColorStop(1, 'rgba(7, 7, 7, 0.95)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 450, 512, 318);

      // Render typography onto poster
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px "Space Grotesk", sans-serif';
      ctx.textAlign = 'left';
      const displayTitle = title.length > 22 ? title.substring(0, 20) + '…' : title;
      ctx.fillText(displayTitle, 28, 700);

      // Draw vector gold star
      drawVectorStar(ctx, 42, 730, 5, 10, 5, '#f59e0b');
      ctx.fillStyle = '#f59e0b';
      ctx.font = '500 24px "JetBrains Mono", monospace';
      ctx.fillText(`${rating.toFixed(1)}`, 58, 738);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '22px "JetBrains Mono", monospace';
      ctx.fillText(year, 130, 738);

      // Frame highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, 508, 764);

      texture.needsUpdate = true;
      if (onLoaded) onLoaded();
    } catch (e) {
      // CORS or image draw fallback kept as procedural
    }
  };

  img.onerror = () => {
    // Keep high-contrast procedural typography and frame
  };

  return texture;
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
