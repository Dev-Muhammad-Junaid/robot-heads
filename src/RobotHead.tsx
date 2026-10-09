import { forwardRef, useEffect, useId, useImperativeHandle, useRef, type MouseEvent } from 'react';
import type { RobotHeadProps, RobotHeadShape, RobotHeadState } from './types';
import { getShape } from './tv/geometry';
import { RobotSim, restPose } from './tv/sim';
import { RobotRenderer, type Palette } from './tv/render';
import { linear } from './tv/light';
import { parseColor } from './color';
import { subscribe, pointer } from './ticker';

export const robotHeadShapes: RobotHeadShape[] = ['rectangle', 'square', 'circle', 'hexagon'];

export const robotHeadStates: RobotHeadState[] = ['idle', 'thinking', 'searching', 'listening', 'speaking', 'working', 'happy', 'error', 'sleeping'];

const labels: Record<RobotHeadState, string> = {
  idle: 'idle',
  thinking: 'thinking',
  searching: 'searching',
  listening: 'listening',
  speaking: 'speaking',
  working: 'working',
  happy: 'happy',
  error: 'error',
  sleeping: 'sleeping',
};

function hashSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function palette(color: string, trim: string, screen: string): Palette {
  const shell = parseColor(color) ?? [48, 80, 172];
  const metal = parseColor(trim) ?? [150, 168, 200];
  const led = parseColor(screen) ?? [232, 242, 255];
  return {
    shell: { albedo: linear(shell), f0: 0.05, metal: 0.15, spec: 0.55, shininess: 70, rim: 0.9 },
    trim: { albedo: linear(metal), f0: 0.2, metal: 0.65, spec: 0.8, shininess: 45, rim: 0.7 },
    led,
  };
}

/**
 * A TV-headed robot: a glossy moulded shell with knob ears and an
 * antenna, and an LED matrix for a face that shows what it is doing.
 */
export const RobotHead = forwardRef<HTMLCanvasElement, RobotHeadProps>(function RobotHead(
  {
    model = 'tv',
    shape = 'rectangle',
    state = 'idle',
    size = 160,
    color = '#2b49a3',
    trimColor = '#93a6c8',
    screenColor = '#e8f2ff',
    speed = 1,
    paused = false,
    interactive = true,
    floorShadow = true,
    seed,
    className,
    style,
    onClick,
    'aria-label': ariaLabel,
    ...rest
  },
  ref
) {
  void model;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);
  const reactId = useId();
  const stateKey: RobotHeadState = state in labels ? state : 'idle';
  const shapeKey: RobotHeadShape = robotHeadShapes.includes(shape) ? shape : 'rectangle';
  const seedValue = Math.min(1, Math.max(0, seed ?? hashSeed(reactId)));
  const still = paused || !(speed > 0);

  const sim = useRef<RobotSim | null>(null);
  const renderer = useRef<RobotRenderer | null>(null);
  const pal = useRef<Palette>(palette(color, trimColor, screenColor));
  pal.current = palette(color, trimColor, screenColor);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;
  const shadowRef = useRef(floorShadow);
  shadowRef.current = floorShadow;

  if (!sim.current) sim.current = new RobotSim(seedValue, stateKey);
  sim.current.setState(stateKey);

  const paint = (animated: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
    const want = Math.round(size * dpr);
    if (canvas.width !== want || canvas.height !== want) {
      canvas.width = want;
      canvas.height = want;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!renderer.current) renderer.current = new RobotRenderer();
    const s = sim.current!;
    renderer.current.draw(ctx, want, animated ? s.pose : restPose(stateKey), animated ? s : null, stateKey, getShape(shapeKey), pal.current, { floorShadow: shadowRef.current });
  };

  useEffect(() => {
    if (still || reducedMotion()) {
      paint(false);
      return;
    }
    return subscribe((dt) => {
      const s = sim.current!;
      const canvas = canvasRef.current;
      if (canvas && interactiveRef.current && Number.isFinite(pointer.x)) {
        const box = canvas.getBoundingClientRect();
        const dx = pointer.x - (box.left + box.width / 2);
        const dy = pointer.y - (box.top + box.height * 0.56);
        s.pointer = Math.hypot(dx, dy) < 700 ? { x: dx, y: dy } : null;
      } else s.pointer = null;
      s.update(dt * speedRef.current);
      paint(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still, size, stateKey, shapeKey, color, trimColor, screenColor, floorShadow]);

  const click = (e: MouseEvent<HTMLCanvasElement>) => {
    if (interactive && !still) sim.current?.poke();
    onClick?.(e);
  };

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={ariaLabel ?? `Robot, ${labels[stateKey]}`}
      className={className}
      onClick={click}
      style={{ width: size, height: size, display: 'block', cursor: interactive ? 'pointer' : undefined, ...style }}
      {...rest}
    />
  );
});

