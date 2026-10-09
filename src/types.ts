import type { CanvasHTMLAttributes, CSSProperties } from 'react';

/** What the robot is doing: each state has its own face on the screen, its own motion and its own antenna light. */
export type RobotHeadState =
  | 'idle'
  | 'thinking'
  | 'searching'
  | 'listening'
  | 'speaking'
  | 'working'
  | 'happy'
  | 'error'
  | 'sleeping';

/** The head's build. Only the TV head so far. */
export type RobotHeadModel = 'tv';

/** The outline of the head, seen from the front. Every shape carries the same screen, ears and antenna. */
export type RobotHeadShape = 'rectangle' | 'square' | 'circle' | 'hexagon';

export interface RobotHeadProps extends Omit<CanvasHTMLAttributes<HTMLCanvasElement>, 'color' | 'ref'> {
  /** Which head. Default `tv`. */
  model?: RobotHeadModel;
  /** The head's outline: `rectangle` (default), `square`, `circle` or `hexagon`. */
  shape?: RobotHeadShape;
  /** What it is doing. Default `idle`. */
  state?: RobotHeadState;
  /** Rendered size in px. Default `160`. */
  size?: number;
  /** Colour of the shell. Default a deep glossy blue. */
  color?: string;
  /** Colour of the ears and the antenna's collar. Default a pale steel. */
  trimColor?: string;
  /** Colour of the LEDs on the screen. Default a cool white. */
  screenColor?: string;
  /** Multiplier on every animation's speed. Default `1`. */
  speed?: number;
  /** Freeze every animation on its current frame. */
  paused?: boolean;
  /** Follow the pointer with the eyes and head, and hop and spin on a click. Default `true`. */
  interactive?: boolean;
  /** Draw the soft shadow on the floor under the head. Default `true`. */
  floorShadow?: boolean;
  /** 0–1, offsets the blinks and glances so a row of heads does not move in unison. */
  seed?: number;
  className?: string;
  style?: CSSProperties;
}
