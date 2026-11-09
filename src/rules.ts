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
