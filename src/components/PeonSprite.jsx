import { useEffect, useRef, useState } from 'react';
import { useSalesState } from '../hooks/useSalesState';

/**
 * Canvas idle-animation player for the Peon, driven entirely by a manifest
 * (public/assets/Peon/idle/peon-idle.json) describing a clean sprite sheet of
 * uniform `cell`-px cells, `cols` per row, one row per idle variation.
 *
 * Motion model: a continuous breathing BASE loop with crossfade interpolation
 * (adjacent frames are smoothstep-blended every rAF, so poses morph instead of
 * snapping — this is what keeps it from looking choppy at low frame counts).
 * Every few seconds it interjects a one-shot variation, then eases back to
 * breathing. Events: a closed deal triggers a celebratory fidget; a long idle
 * makes him yawn. Honors prefers-reduced-motion, pauses on hidden tabs, and
 * falls back to the static image if the sheet/manifest can't load.
 */
const MANIFEST_URL = '/assets/Peon/idle/peon-idle.json';

const PeonSprite = ({ size = 132, fallbackArt = '/assets/Peon/Peon.jpeg', label = 'Peon' }) => {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | failed
  const [cheering, setCheering] = useState(false);

  const closedDeal = useSalesState((s) => s.closedDeal);
  const prevClosedDeal = useRef(closedDeal);
  // The animation loop polls this for one-shot requests (e.g. a closed deal).
  const commandRef = useRef(null);

  // Closed deal → celebratory fidget one-shot + a quick scale pop.
  useEffect(() => {
    if (closedDeal === prevClosedDeal.current) return;
    prevClosedDeal.current = closedDeal;
    commandRef.current = 'fidget';
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
      // Render mode: clean frame-swaps (like the crusader) by default for crisp
      // frames; set "crossfade": true in the manifest for blended (softer/
      // smoother-at-slow-speed) motion instead.
      const crossfade = manifest.crossfade === true;
      // Per-animation loop duration (ms) → calm, slow breathing; quick blinks.
      // Falls back to a slow default so nothing ever plays at a frantic rate.
      const DEFAULT_LOOP_MS = 4200;
      const frameMsOf = (a) => (a.durationMs || DEFAULT_LOOP_MS) / a.frames;
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

      const byName = (n) => anims.find((a) => a.name === n);
      const breathing = byName('breathing') || anims[0];

      // Weighted bag of the *variations* (everything except the breathing base)
      // that get interjected between breathing loops.
      const vbag = [];
      anims
        .filter((a) => a !== breathing)
        .forEach((a) => {
          const w = Math.max(1, a.weight || 1);
          for (let k = 0; k < w; k += 1) vbag.push(a);
        });
      const pickVariation = () =>
        vbag.length ? vbag[Math.floor(Math.random() * vbag.length)] : breathing;

      // Long calm stretches of breathing between little actions.
      const nextGapMs = () => 6000 + Math.random() * 8000;

      const state = {
        base: true, // looping breathing vs. a one-shot variation
        anim: breathing,
        playhead: 0, // continuous frame position (float)
        last: 0,
        sinceInterjectMs: 0,
        nextInterjectMs: nextGapMs(),
        sinceYawnMs: 0,
      };

      // Smoothstep keeps the crossfade weighted toward the two source frames
      // (less time at the ghosty 50/50 midpoint) for a clean morph.
      const smooth = (t) => t * t * (3 - 2 * t);

      // Crossfade the two frames straddling the continuous playhead — this is
      // what removes the choppy frame-to-frame snap.
      const drawBlend = (anim, playhead) => {
        const n = anim.frames;
        const base = Math.floor(playhead);
        const frac = playhead - base;
        const fA = base % n;
        const fB = (fA + 1) % n;
        const sy = anim.row * cell;
        ctx.clearRect(0, 0, cell, cell);
        ctx.globalAlpha = 1;
        ctx.drawImage(img, fA * cell, sy, cell, cell, 0, 0, cell, cell);
        if (crossfade && fB !== fA && frac > 0.001) {
          ctx.globalAlpha = smooth(frac);
          ctx.drawImage(img, fB * cell, sy, cell, cell, 0, 0, cell, cell);
          ctx.globalAlpha = 1;
        }
      };

      // Paint the rest pose immediately so the canvas is never blank — even if
      // the page loads on a hidden/backgrounded tab and rAF is paused.
      drawBlend(breathing, 0);

      // Reduced motion: hold the rest frame, don't animate.
      if (reduced) return;

      const startOneShot = (anim) => {
        if (!anim) return;
        state.base = false;
        state.anim = anim;
        state.playhead = 0;
      };

      const tick = (ts) => {
        if (!running || document.hidden) return;
        const dt = state.last ? Math.min(ts - state.last, 64) : 0; // clamp tab-switch jumps
        state.last = ts;
        state.sinceYawnMs += dt;

        // Event request (e.g. closed-deal fidget) interrupts immediately.
        if (commandRef.current) {
          const a = byName(commandRef.current);
          commandRef.current = null;
          startOneShot(a);
        }

        state.playhead += dt / frameMsOf(state.anim);

        if (state.base) {
          state.sinceInterjectMs += dt;
          if (state.playhead >= breathing.frames) state.playhead -= breathing.frames;

          if (state.sinceInterjectMs >= state.nextInterjectMs) {
            state.sinceInterjectMs = 0;
            state.nextInterjectMs = nextGapMs();
            // Idle a long while → he yawns; otherwise a weighted variation.
            const v = state.sinceYawnMs > 22000 && byName('yawn') ? byName('yawn') : pickVariation();
            startOneShot(v);
          }
        } else if (state.playhead >= state.anim.frames) {
          // one-shot done → ease back to the breathing base
          if (state.anim.name === 'yawn') state.sinceYawnMs = 0;
          state.base = true;
          state.anim = breathing;
          state.playhead = 0;
          state.sinceInterjectMs = 0;
          state.nextInterjectMs = nextGapMs();
        }

        drawBlend(state.anim, state.playhead);
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
