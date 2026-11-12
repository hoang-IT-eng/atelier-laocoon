/**
 * Core math and state transformation functions for Laocoön — Bronze and Time
 */

export function calculateStoryDashProgress(scroll: number, dashIndex: number): number {
  const start = (dashIndex - 1) * 0.25;
  const end = dashIndex * 0.25;
  const progress = (scroll - start) / (end - start);
  return Math.max(0, Math.min(1, progress));
}

export function isSlideActive(scroll: number, start: number, end: number): boolean {
  return scroll >= start && scroll <= end;
}

export interface CameraOrbitParams {
  x: number;
  y: number;
  z: number;
  lookAtXOffset: number;
}

export function calculateCameraOrbit(scroll: number): CameraOrbitParams {
  const phi = scroll * Math.PI * 2.0;
  const y = 0.35 + Math.sin(scroll * Math.PI) * 0.8;
  const radius = 4.2 - Math.sin(scroll * Math.PI) * 0.6;
  const x = radius * Math.sin(phi);
  const z = radius * Math.cos(phi);

  const transitionProgress = Math.min(1.0, scroll / 0.28);
  const easeFactor = (Math.cos(transitionProgress * Math.PI) + 1.0) * 0.5;
  const lookAtXOffset = -0.9 * easeFactor;

  return { x, y, z, lookAtXOffset };
}

export interface LightingParams {
  keyLightIntensity: number;
  fillLightIntensity: number;
  ambientLightIntensity: number;
  rimLightIntensity: number;
  forgeGlowIntensity: number;
}

export function calculateLightingIntensities(scroll: number): LightingParams {
  const s = Math.max(0, Math.min(1, scroll));
  return {
    keyLightIntensity: 18.0 + s * 8.0,
    fillLightIntensity: 0.8 + s * 3.2,
    ambientLightIntensity: 0.10 + s * 0.12,
    rimLightIntensity: 10.0 + s * 5.0,
    forgeGlowIntensity: s * 5.5,
  };
}

export type GranularTuningMode = 'bronze' | 'crystalline' | 'harmonic';

export interface GranularGrainParams {
  shouldTrigger: boolean;
  grainIntervalMs: number;
  baseFrequencyHz: number;
  inharmonicPartials: [number, number, number, number];
  grainDurationSec: number;
  gainLevel: number;
  pan: number;
  filterQ: number;
  visualResonancePulse: number;
  chapterRegisterName: string;
}

const TUNING_SCALES: Record<GranularTuningMode, readonly number[]> = {
  // D Dorian / Pentatonic Bronze frequencies (warm, ancient foundry resonance)
  bronze: [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 659.25],
  // Lydian Crystalline frequencies (luminous, sculptural chiaroscuro intervals)
  crystalline: [196.00, 220.00, 246.94, 277.18, 293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 554.37, 587.33],
  // Pure Natural Harmonic Series on fundamental C3 (130.81 Hz)
  harmonic: [130.81, 196.22, 261.63, 327.03, 392.44, 457.85, 523.25, 588.66, 654.06, 719.47, 784.88, 915.69],
};

export function getChapterRegisterName(scroll: number): string {
  const s = Math.max(0, Math.min(1, scroll));
  if (s < 0.25) return 'I · Molten Bronze';
  if (s < 0.50) return 'II · Marble Harmonics';
  if (s < 0.75) return 'III · Liquid Resonance';
  return 'IV · Sapphire Aether';
}

export function calculateGranularGrainParams(
  scroll: number,
  scrollVelocity: number,
  elapsedSinceLastGrainMs: number,
  grainStepIndex: number,
  tuningMode: GranularTuningMode = 'bronze'
): GranularGrainParams {
  const s = Math.max(0, Math.min(1, scroll));
  const v = Math.max(0, scrollVelocity);

  // Normalize velocity into [0, 1] musical intensity range (typical scrollVelocity is 0.0002 to 0.08)
  const normalizedVel = Math.min(1, v / 0.045);

  // Inter-onset interval shrinks from 210ms (gentle movement) down to 28ms (rapid scroll cascade)
  const grainIntervalMs = Math.round(210 - normalizedVel * 182);

  // Minimum velocity threshold to emit grains
  const velocityThreshold = 0.00018;
  const shouldTrigger = v >= velocityThreshold && elapsedSinceLastGrainMs >= grainIntervalMs;

  // Select pitch from scale, shifting up the register as scroll progresses from 0 (Bronze) to 1 (Sapphire)
  const scale = TUNING_SCALES[tuningMode] || TUNING_SCALES.bronze;
  const registerOffset = Math.floor(s * 5); // 0..5 index shift up the scale
  const stepCycle = Math.abs(Math.floor(grainStepIndex)) % 7;
  const scaleIdx = Math.min(scale.length - 1, registerOffset + (stepCycle % (scale.length - registerOffset)));

  // Velocity adds subtle upward harmonic shimmer (up to 1.5x fifth interval at peak speed)
  const velocityPitchMultiplier = 1.0 + normalizedVel * 0.25;
  const baseFrequencyHz = Number((scale[scaleIdx] * velocityPitchMultiplier).toFixed(2));

  // Authentic struck-bronze / Chladni modal partials:
  // Interpolates from warm bell overtones at scroll=0 to shimmering metallic bar ratios at scroll=1
  const p2 = Number((2.0 + s * 0.12).toFixed(3));
  const p3 = Number((2.756 + s * 0.24).toFixed(3));
  const p4 = Number((4.65 + s * 0.754).toFixed(3));
  const inharmonicPartials: [number, number, number, number] = [1.0, p2, p3, p4];

  // Ringing decay: longer resonant tail on slow deliberate scrolls, tighter metallic ping on fast cascades
  const grainDurationSec = Number((1.35 - normalizedVel * 0.75).toFixed(3));

  // Soft-knee musical gain curve [0.025 .. 0.20]
  const gainLevel = v < velocityThreshold
    ? 0
    : Number((0.025 + Math.pow(normalizedVel, 0.75) * 0.175).toFixed(4));

  // Spatial stereo pan follows the 360° camera orbit around the bronze sculpture + slight alternating spread
  const orbitPan = Math.sin(s * Math.PI * 2.0) * 0.55;
  const spread = ((Math.abs(grainStepIndex) % 2 === 0 ? 1 : -1) * 0.18);
  const pan = Number(Math.max(-0.85, Math.min(0.85, orbitPan + spread)).toFixed(3));

  // Resonant Q increases with scroll progression for crystalline metallic sustain
  const filterQ = Number((8.0 + s * 10.0 + normalizedVel * 4.0).toFixed(2));

  // Visual resonance pulse [0..1] to drive WebGL forge glow & UI spectrum bars
  const visualResonancePulse = v < velocityThreshold
    ? 0
    : Number(Math.min(1, 0.2 + normalizedVel * 0.8).toFixed(3));

  return {
    shouldTrigger,
    grainIntervalMs,
    baseFrequencyHz,
    inharmonicPartials,
    grainDurationSec,
    gainLevel,
    pan,
    filterQ,
    visualResonancePulse,
    chapterRegisterName: getChapterRegisterName(s),
  };
}

