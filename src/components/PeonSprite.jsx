import { useEffect, useRef, useState } from 'react';
import { useSalesState } from '../hooks/useSalesState';

/**
 * Canvas idle-animation player for the Peon, driven entirely by a manifest
 * (public/assets/Peon/idle/peon-idle.json) describing a clean sprite sheet of
 * uniform `cell`-px cells, `cols` per row, one row per idle variation.
 *
 * It plays a natural idle ROTATION: weighted-random pick of a variation
 * (breathing favored), play it through once, hold the rest frame briefly, then
 * pick the next — matching the art's "suggested idle rotation". A closed deal
 * triggers a quick cheer pop. Falls back to a static image if the sheet/manifest
 * can't load (e.g. before the assets are sliced), so the card never breaks.
 */
const MANIFEST_URL = '/assets/Peon/idle/peon-idle.json';

const PeonSprite = ({ size = 132, fallbackArt = '/assets/Peon/Peon.jpeg', label = 'Peon' }) => {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | failed
  const [cheering, setCheering] = useState(false);

  const closedDeal = useSalesState((s) => s.closedDeal);
  const prevClosedDeal = useRef(closedDeal);

  // Quick cheer pop on a closed deal (same signal the old sprite used).
  useEffect(() => {
    if (closedDeal === prevClosedDeal.current) return;
    prevClosedDeal.current = closedDeal;
    setCheering(true);
    const t = setTimeout(() => setCheering(false), 680);
    return () => clearTimeout(t);
  }, [closedDeal]);

  useEffect(() => {
    let running = true;
    let raf = 0;
    const cleanupRef = { current: null };
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const start = async () => {
      let manifest;
      try {
        const res = await fetch(MANIFEST_URL);
        if (!res.ok) throw new Error(`manifest ${res.status}`);
        manifest = await res.json();
      } catch {
        if (running) setStatus('failed');
        return;
      }

      const img = new Image();
      img.decoding = 'async';
      const loaded = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      img.src = manifest.sheet;
      try {
        await loaded;
      } catch {
        if (running) setStatus('failed');
        return;
      }
      if (!running) return;

      const cell = manifest.cell || 128;
      const fps = manifest.fps || 10;
      const frameMs = 1000 / fps;
      const anims = (manifest.animations || []).filter((a) => a.frames > 0);
      if (!anims.length) {
        setStatus('failed');
        return;
      }
      setStatus('ready');

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = cell;
      canvas.height = cell;
      const ctx = canvas.getContext('2d', { alpha: true });
      ctx.imageSmoothingEnabled = false; // crisp pixel art

      // Build a weighted bag for natural variation selection.
      const bag = [];
      anims.forEach((a, i) => {
        const w = Math.max(1, a.weight || 1);
        for (let k = 0; k < w; k += 1) bag.push(i);
      });
      const pick = () => bag[Math.floor(Math.random() * bag.length)];

      const state = {
        anim: anims.find((a) => a.name === 'breathing') || anims[0],
        frame: 0,
        elapsed: 0,
        mode: 'playing', // playing | holding
        holdMs: 0,
        last: 0,
      };

      const draw = (anim, frame) => {
        const sx = Math.min(frame, anim.frames - 1) * cell;
        const sy = anim.row * cell;
        ctx.clearRect(0, 0, cell, cell);
        ctx.drawImage(img, sx, sy, cell, cell, 0, 0, cell, cell);
      };

      // Paint the rest pose immediately so the canvas is never blank — even if
      // the page loads on a hidden/backgrounded tab and rAF is paused.
      draw(state.anim, 0);

      // Reduced motion: hold the rest frame, don't animate.
      if (reduced) return;

      const tick = (ts) => {
        if (!running || document.hidden) return;
        const dt = state.last ? ts - state.last : 0;
        state.last = ts;
        state.elapsed += dt;

        if (state.mode === 'holding') {
          if (state.elapsed >= state.holdMs) {
            state.anim = anims[pick()];
            state.frame = 0;
            state.elapsed = 0;
            state.mode = 'playing';
          }
          draw(state.anim, 0);
        } else {
          while (state.elapsed >= frameMs) {
            state.elapsed -= frameMs;
            state.frame += 1;
            if (state.frame >= state.anim.frames) {
              // cycle complete — rest on frame 0 for a natural beat
              state.frame = 0;
              state.mode = 'holding';
              state.holdMs = 160 + Math.random() * 640;
              break;
            }
          }
          draw(state.anim, state.frame);
        }
        raf = requestAnimationFrame(tick);
      };

      const onVisibility = () => {
        if (!running || document.hidden) return;
        state.last = 0;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
      };
      document.addEventListener('visibilitychange', onVisibility);
      raf = requestAnimationFrame(tick);

      // store cleanup for the outer effect
      cleanupRef.current = () => {
        document.removeEventListener('visibilitychange', onVisibility);
        cancelAnimationFrame(raf);
      };
    };

    start();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  if (status === 'failed') {
    return (
      <img
        src={fallbackArt}
        alt={`${label} — idle`}
        className="rank-avatar rank-avatar--idle"
        style={{ height: size }}
        draggable={false}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`peon-sprite ${cheering ? 'rank-avatar--cheer' : ''}`}
      style={{ width: size, height: size, opacity: status === 'ready' ? 1 : 0 }}
      role="img"
      aria-label={`${label} — idle animation`}
    />
  );
};

export default PeonSprite;
