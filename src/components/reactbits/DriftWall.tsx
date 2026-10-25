import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './DriftWall.css';

export interface DriftItem {
  image: string;
  title?: string;
  rating?: number;
  year?: string;
  mediaItem?: any;
}

const DEFAULT_ITEMS: DriftItem[] = [];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const columnFactor = (index: number, variance: number) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

export interface DriftWallProps {
  items?: DriftItem[];
  columns?: number;
  tileWidth?: number;
  tileHeight?: number;
  gap?: number;
  radius?: number;
  tilt?: number;
  turn?: number;
  roll?: number;
  perspective?: number;
  depth?: number;
  speed?: number;
  direction?: 'up' | 'down';
  variance?: number;
  parallax?: number;
  lift?: number;
  fade?: number;
  dim?: number;
  grayscale?: boolean;
  overlayColor?: string;
  className?: string;
  style?: React.CSSProperties;
  onItemClick?: (item: DriftItem) => void;
  onItemDoubleClick?: (item: DriftItem) => void;
}

export const DriftWall: React.FC<DriftWallProps> = ({
  items = DEFAULT_ITEMS,
  columns = 8,
  tileWidth = 230,
  tileHeight = 345,
  gap = 24,
  radius = 16,
  tilt = 12,
  turn = -10,
  roll = 0,
  perspective = 1200,
  depth = 140,
  speed = 42,
  direction = 'up',
  variance = 0.4,
  parallax = 0.7,
  lift = 80,
  fade = 0,
  dim = 1,
  grayscale = false,
  overlayColor = '#070707',
  className = '',
  style,
  onItemClick,
  onItemDoubleClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const offsetsRef = useRef<number[]>([]);
  const velocitiesRef = useRef<number[]>([]);
  const hoveredColRef = useRef<number>(-1);
  const lastTapRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });
  const lastOpenRef = useRef<number>(0);

  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerDampedRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTsRef = useRef<number | null>(null);

  const [containerHeight, setContainerHeight] = useState(600);
  const rectRef = useRef<{ left: number; top: number; width: number; height: number }>({
    left: 0,
    top: 0,
    width: 1,
    height: 1,
  });
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const resetHover = () => {
      hoveredColRef.current = -1;
    };
    window.addEventListener('blur', resetHover);
    return () => window.removeEventListener('blur', resetHover);
  }, []);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const columnItems = useMemo(() => {
    const cols: DriftItem[][] = Array.from({ length: columns }, () => []);
    const safeItems = items && items.length > 0 ? items : DEFAULT_ITEMS;
    safeItems.forEach((item, i) => cols[i % columns].push(item));
    return cols.map((col) => (col.length ? col : safeItems.slice(0, 1)));
  }, [items, columns]);

  const columnMeta = useMemo(() => {
    const unit = tileHeight + gap;
    return columnItems.map((col) => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.max(2, Math.ceil((containerHeight * 1.6) / copyHeight) + 1);
      return { copyHeight, copies };
    });
  }, [columnItems, tileHeight, gap, containerHeight]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const updateRect = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      rectRef.current = {
        left: rect.left,
        top: rect.top,
        width: rect.width || 1,
        height: rect.height || 1,
      };
      setContainerHeight(rect.height || 600);
    };

    updateRect();
    const ro = new ResizeObserver(updateRect);
    ro.observe(containerRef.current);
    window.addEventListener('resize', updateRect, { passive: true });
    window.addEventListener('scroll', updateRect, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, []);

  const baseVelocities = useMemo(() => {
    const dirSign = direction === 'up' ? 1 : -1;
    return columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return speed * columnFactor(c, variance) * dirSign * altSign;
    });
  }, [columnItems, speed, direction, variance]);

  useEffect(() => {
    offsetsRef.current = columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));
    velocitiesRef.current = columnItems.map(() => 0);
  }, [columnMeta, columnItems]);

  const applyPlaneTransform = useCallback(
    (px: number, py: number) => {
      const plane = planeRef.current;
      if (!plane) return;
      plane.style.transform =
        `translate(-50%, -50%) scale(1.18) ` +
        `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
        `translateZ(${-depth}px)`;
    },
    [tilt, turn, roll, depth]
  );

  useEffect(() => {
    const animate = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      const maxTilt = parallax * 8;
      const targetX = pointerRef.current.x * maxTilt;
      const targetY = -pointerRef.current.y * maxTilt;
      const damp = 1 - Math.exp(-dt / 0.12);
      pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * damp;
      pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * damp;
      applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);

      if (!reduced) {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const meta = columnMeta[c];
          if (!meta) continue;
          const factor = hoveredColRef.current === c ? 0 : 1;
          const target = baseVelocities[c] * factor;

          // ponytail: Snap to 0 instantly on hover so column freezes under cursor, ease back on leave
          if (target === 0) {
            velocitiesRef.current[c] = 0;
          } else {
            const ease = 1 - Math.exp(-dt / 0.22);
            velocitiesRef.current[c] += (target - velocitiesRef.current[c]) * ease;
          }
          let next = (offsetsRef.current[c] ?? 0) + velocitiesRef.current[c] * dt;
          next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
          offsetsRef.current[c] = next;

          const el = trackRefs.current[c];
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
        }
      } else {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const el = trackRefs.current[c];
          const meta = columnMeta[c];
          if (el && meta) el.style.transform = `translate3d(0, ${-(offsetsRef.current[c] ?? 0)}px, 0)`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [baseVelocities, columnMeta, parallax, reduced, applyPlaneTransform]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (parallax > 0 && !reduced) {
        const r = rectRef.current;
        pointerRef.current.x = (e.clientX - r.left) / r.width - 0.5;
        pointerRef.current.y = (e.clientY - r.top) / r.height - 0.5;
      }
      if (!(e.target as HTMLElement)?.closest('.drift-wall__tile')) {
        hoveredColRef.current = -1;
      }
    },
    [parallax, reduced]
  );

  const handlePointerLeaveWall = useCallback(() => {
    pointerRef.current = { x: 0, y: 0 };
    hoveredColRef.current = -1;
  }, []);

  const cssVars = useMemo(
    () => ({
      '--dw-tile-w': `${tileWidth}px`,
      '--dw-tile-h': `${tileHeight}px`,
      '--dw-gap': `${gap}px`,
      '--dw-radius': `${radius}px`,
      '--dw-perspective': `${perspective}px`,
      '--dw-lift': `${lift}px`,
      '--dw-dim': dim,
      '--dw-gray': grayscale ? 1 : 0,
      '--dw-overlay': overlayColor,
      '--dw-edge': `${Math.max(0, (1 - fade) * 100)}%`,
      ...style,
    } as React.CSSProperties),
    [tileWidth, tileHeight, gap, radius, perspective, lift, dim, grayscale, overlayColor, fade, style]
  );

  const renderTile = (item: DriftItem, id: string, colIndex: number) => {
    const handleOpen = () => {
      const now = Date.now();
      if (now - lastOpenRef.current < 400) return;
      lastOpenRef.current = now;
      hoveredColRef.current = -1;
      if (onItemDoubleClick) {
        onItemDoubleClick(item);
      } else if (onItemClick) {
        onItemClick(item);
      }
    };

    const handleTileDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleOpen();
    };

    const handleTileClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const now = Date.now();
      const itemKey = item.mediaItem?.id ? String(item.mediaItem.id) : (item.title || id);
      const timeDiff = now - lastTapRef.current.time;

      // ponytail: Universal double-click/double-tap detector
      if (lastTapRef.current.key === itemKey && timeDiff > 40 && timeDiff < 480) {
        lastTapRef.current = { key: '', time: 0 };
        handleOpen();
        return;
      }

      lastTapRef.current = { key: itemKey, time: now };
      if (onItemClick) {
        onItemClick(item);
      }
    };

    // ponytail: Touch double-tap detector (fires before click on mobile touchscreens)
    const handleTilePointerUp = (e: React.PointerEvent) => {
      if (e.pointerType === 'touch') {
        const now = Date.now();
        const itemKey = item.mediaItem?.id ? String(item.mediaItem.id) : (item.title || id);
        const timeDiff = now - lastTapRef.current.time;

        if (lastTapRef.current.key === itemKey && timeDiff > 40 && timeDiff < 480) {
          e.preventDefault();
          lastTapRef.current = { key: '', time: 0 };
          handleOpen();
          return;
        }
        lastTapRef.current = { key: itemKey, time: now };
      }
    };

    const inner = (
      <span className="drift-wall__inner">
        <img src={item.image} alt={item.title ?? ''} loading="eager" decoding="async" draggable={false} />
        <span className="drift-wall__overlay" aria-hidden="true" />
        {item.title && (
          <span className="drift-wall__info">
            <span className="block text-xs font-display font-bold text-white truncate drop-shadow-md">
              {item.title}
            </span>
            {(item.rating || item.year) && (
              <span className="flex items-center gap-1.5 text-[10px] font-mono-code text-amber-300 mt-0.5">
                {item.rating && <span>★ {item.rating.toFixed(1)}</span>}
                {item.year && <span className="text-white/60">· {item.year}</span>}
              </span>
            )}
          </span>
        )}
      </span>
    );

    const commonProps = {
      className: 'drift-wall__tile',
      'data-tile-id': id,
      'data-col': colIndex,
      onPointerEnter: () => {
        hoveredColRef.current = colIndex;
      },
      onPointerLeave: () => {
        if (hoveredColRef.current === colIndex) {
          hoveredColRef.current = -1;
        }
      },
      onFocus: () => {
        hoveredColRef.current = colIndex;
      },
      onBlur: () => {
        if (hoveredColRef.current === colIndex) {
          hoveredColRef.current = -1;
        }
      },
      onClick: handleTileClick,
      onDoubleClick: handleTileDoubleClick,
      onPointerUp: handleTilePointerUp,
    };

    return (
      <div key={id} tabIndex={0} role="button" aria-label={item.title ?? 'tile'} {...commonProps}>
        {inner}
      </div>
    );
  };

  const rootClass = ['drift-wall', reduced ? 'drift-wall--reduced' : '', className].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={rootClass}
      style={cssVars}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeaveWall}
      role="group"
      aria-label="Drifting wall of tiles"
    >
      <div ref={planeRef} className="drift-wall__plane">
        {columnItems.map((col, c) => {
          const meta = columnMeta[c];
          const copies = Array.from({ length: meta.copies });
          return (
            <div className="drift-wall__col" key={`col-${c}`}>
              <div
                className="drift-wall__track"
                ref={(el) => {
                  trackRefs.current[c] = el;
                }}
              >
                {copies.map((_, copyIndex) =>
                  col.map((item, itemIndex) => renderTile(item, `${c}-${copyIndex}-${itemIndex}`, c))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DriftWall;
