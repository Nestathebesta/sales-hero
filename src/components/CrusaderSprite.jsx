import { useEffect, useRef } from 'react';
import {
  ANIM_TIMING,
  ATTACK_BRIDGE_INDEX,
  ATTACK_LOOP,
  CRUSADER_SPRITE_SHEET,
  DISPLAY_FRAME_SIZE,
  DISPLAY_SIZE,
  drawSpriteCell,
  IDLE_FRAME_MS,
  IDLE_LOOP,
  IDLE_RESTART_INDEX,
} from '../game/crusaderSpriteSheet';
import { useSalesState } from '../hooks/useSalesState';

/**
 * Lightweight canvas sprite — no Pixi/Phaser overhead for dashboard use.
 * The canvas backing store renders one 256px cell 1:1; CSS scales it to `size`.
 * Listens to salesState.closedDeal and plays the attack once, then idles.
 */
const CrusaderSprite = ({ className = '', size = DISPLAY_SIZE, tint = null }) => {
  const canvasRef = useRef(null);
  const sheetRef = useRef(null);
  const rafRef = useRef(0);
  const tintRef = useRef(tint);
  const closedDeal = useSalesState((s) => s.closedDeal);
  const prevClosedDeal = useRef(closedDeal);

  useEffect(() => {
    tintRef.current = tint;
  }, [tint]);

  const animRef = useRef({
    mode: 'idle',
    frameIndex: 0,
    elapsed: 0,
    bridgeHold: 0,
  });

  useEffect(() => {
    if (closedDeal === prevClosedDeal.current) return;
    prevClosedDeal.current = closedDeal;

    animRef.current = {
      mode: 'attack',
      frameIndex: 0,
      elapsed: 0,
      bridgeHold: 0,
    };
  }, [closedDeal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    const img = new Image();
    img.decoding = 'async';
    img.src = CRUSADER_SPRITE_SHEET;

    let running = true;
    const renderSize = DISPLAY_FRAME_SIZE;

    // Draw a frame, then overlay the rank tint (only onto the sprite's pixels).
    const paint = (cell) => {
      drawSpriteCell(ctx, sheetRef.current, cell, renderSize);
      const t = tintRef.current;
      if (t) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = 0.42;
        ctx.fillStyle = t;
        ctx.fillRect(0, 0, renderSize, renderSize);
        ctx.restore();
      }
    };

    const tick = (ts) => {
      if (!running || document.hidden) return; // stop burning frames on a hidden tab

      const sheet = sheetRef.current;
      const anim = animRef.current;

      if (sheet) {
        const dt = anim.lastTs ? ts - anim.lastTs : 0;
        anim.lastTs = ts;
        anim.elapsed += dt;

        if (anim.mode === 'idle') {
          // Per-frame durations: rest extremes hold longer than transitions,
          // which reads as eased breathing instead of a metronome tick.
          let frameMs = IDLE_FRAME_MS[anim.frameIndex] ?? ANIM_TIMING.idleFrameMs;
          while (anim.elapsed >= frameMs) {
            anim.elapsed -= frameMs;
            anim.frameIndex = (anim.frameIndex + 1) % IDLE_LOOP.length;
            frameMs = IDLE_FRAME_MS[anim.frameIndex] ?? ANIM_TIMING.idleFrameMs;
          }
          paint(IDLE_LOOP[anim.frameIndex]);
        } else {
          const frameMs = ANIM_TIMING.attackFrameMs;

          if (anim.frameIndex < ATTACK_BRIDGE_INDEX) {
            while (anim.elapsed >= frameMs && anim.frameIndex < ATTACK_BRIDGE_INDEX) {
              anim.elapsed -= frameMs;
              anim.frameIndex += 1;
            }
            paint(ATTACK_LOOP[anim.frameIndex]);
          } else {
            paint(ATTACK_LOOP[ATTACK_BRIDGE_INDEX]);

            anim.bridgeHold += dt;
            if (anim.bridgeHold >= ANIM_TIMING.bridgeHoldMs) {
              anim.mode = 'idle';
              anim.frameIndex = IDLE_RESTART_INDEX;
              anim.elapsed = 0;
              anim.bridgeHold = 0;
              anim.lastTs = ts;
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    img.onload = () => {
      sheetRef.current = img;
      animRef.current.lastTs = 0;
      if (!document.hidden) rafRef.current = requestAnimationFrame(tick);
    };

    img.onerror = () => {
      console.error('CrusaderSprite: failed to load', CRUSADER_SPRITE_SHEET);
    };

    // Resume the loop when the tab becomes visible again (reset dt to avoid a jump).
    const onVisibility = () => {
      if (!running || document.hidden || !sheetRef.current) return;
      animRef.current.lastTs = 0;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      sheetRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`crusader-sprite ${className}`.trim()}
      width={DISPLAY_FRAME_SIZE}
      height={DISPLAY_FRAME_SIZE}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Animated crusader agent"
    />
  );
};

export default CrusaderSprite;
