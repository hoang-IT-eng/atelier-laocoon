import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStoryDashProgress,
  isSlideActive,
  calculateCameraOrbit,
  calculateLightingIntensities,
  calculateGranularGrainParams,
  getChapterRegisterName,
} from './rules';

test('calculateStoryDashProgress correctly clamps and interpolates across quarters', () => {
  // Dash 1 (0.0 to 0.25)
  assert.equal(calculateStoryDashProgress(0.0, 1), 0.0);
  assert.equal(calculateStoryDashProgress(0.125, 1), 0.5);
  assert.equal(calculateStoryDashProgress(0.25, 1), 1.0);
  assert.equal(calculateStoryDashProgress(0.5, 1), 1.0);

  // Dash 2 (0.25 to 0.50)
  assert.equal(calculateStoryDashProgress(0.20, 2), 0.0);
  assert.equal(calculateStoryDashProgress(0.375, 2), 0.5);
  assert.equal(calculateStoryDashProgress(0.50, 2), 1.0);

  // Dash 4 (0.75 to 1.00)
  assert.equal(calculateStoryDashProgress(0.70, 4), 0.0);
  assert.equal(calculateStoryDashProgress(0.875, 4), 0.5);
  assert.equal(calculateStoryDashProgress(1.0, 4), 1.0);
});

test('isSlideActive matches specified milestone intervals', () => {
  // Slide 1: [-0.10, 0.12]
  assert.equal(isSlideActive(0.0, -0.10, 0.12), true);
  assert.equal(isSlideActive(0.12, -0.10, 0.12), true);
  assert.equal(isSlideActive(0.13, -0.10, 0.12), false);

  // Slide 2: [0.28, 0.40] (milestone target 0.34)
  assert.equal(isSlideActive(0.34, 0.28, 0.40), true);
  assert.equal(isSlideActive(0.25, 0.28, 0.40), false);
  assert.equal(isSlideActive(0.42, 0.28, 0.40), false);

  // Slide 3: [0.56, 0.68] (milestone target 0.62)
  assert.equal(isSlideActive(0.62, 0.56, 0.68), true);

  // Slide 4: [0.84, 1.05] (milestone target 0.94)
  assert.equal(isSlideActive(0.94, 0.84, 1.05), true);
  assert.equal(isSlideActive(1.00, 0.84, 1.05), true);
});

test('calculateCameraOrbit produces expected initial framing and 360 orbit positions', () => {
  const initial = calculateCameraOrbit(0.0);
  assert.ok(Math.abs(initial.x - 0.0) < 1e-5);
  assert.ok(Math.abs(initial.y - 0.35) < 1e-5);
  assert.ok(Math.abs(initial.z - 4.2) < 1e-5);
  assert.ok(Math.abs(initial.lookAtXOffset - (-0.9)) < 1e-5);

  const transitioned = calculateCameraOrbit(0.28);
  assert.ok(Math.abs(transitioned.lookAtXOffset - 0.0) < 1e-5);

  const half = calculateCameraOrbit(0.5);
  assert.ok(Math.abs(half.x) < 1e-5);
  assert.ok(half.z < 0);
  assert.ok(Math.abs(half.lookAtXOffset) < 1e-5);

  const full = calculateCameraOrbit(1.0);
  assert.ok(Math.abs(full.x) < 1e-5);
  assert.ok(Math.abs(full.z - 4.2) < 1e-5);
});

test('calculateLightingIntensities scales warmth and intensity with scroll progression', () => {
  const atStart = calculateLightingIntensities(0.0);
  assert.ok(Math.abs(atStart.keyLightIntensity - 18.0) < 1e-5);
  assert.ok(Math.abs(atStart.fillLightIntensity - 0.8) < 1e-5);
  assert.ok(Math.abs(atStart.ambientLightIntensity - 0.10) < 1e-5);
  assert.ok(Math.abs(atStart.rimLightIntensity - 10.0) < 1e-5);
  assert.ok(Math.abs(atStart.forgeGlowIntensity - 0.0) < 1e-5);

  const atMid = calculateLightingIntensities(0.5);
  assert.ok(Math.abs(atMid.keyLightIntensity - 22.0) < 1e-5);
  assert.ok(Math.abs(atMid.fillLightIntensity - 2.4) < 1e-5);
  assert.ok(Math.abs(atMid.ambientLightIntensity - 0.16) < 1e-5);
  assert.ok(Math.abs(atMid.rimLightIntensity - 12.5) < 1e-5);
  assert.ok(Math.abs(atMid.forgeGlowIntensity - 2.75) < 1e-5);

  const atEnd = calculateLightingIntensities(1.0);
  assert.ok(Math.abs(atEnd.keyLightIntensity - 26.0) < 1e-5);
  assert.ok(Math.abs(atEnd.fillLightIntensity - 4.0) < 1e-5);
  assert.ok(Math.abs(atEnd.ambientLightIntensity - 0.22) < 1e-5);
  assert.ok(Math.abs(atEnd.rimLightIntensity - 15.0) < 1e-5);
  assert.ok(Math.abs(atEnd.forgeGlowIntensity - 5.5) < 1e-5);
});

test('calculateGranularGrainParams modulates grain rate, metallic pitch, and decay based on scroll speed', () => {
  // Idle scroll velocity -> should not trigger
  const idle = calculateGranularGrainParams(0.0, 0.0, 500, 0, 'bronze');
  assert.equal(idle.shouldTrigger, false);
  assert.equal(idle.gainLevel, 0);
  assert.equal(idle.visualResonancePulse, 0);
  assert.equal(idle.chapterRegisterName, 'I · Molten Bronze');

  // Gentle scroll velocity with sufficient elapsed time -> triggers warm longer grain
  const gentle = calculateGranularGrainParams(0.1, 0.005, 250, 0, 'bronze');
  assert.equal(gentle.shouldTrigger, true);
  assert.ok(gentle.grainIntervalMs > 150);
  assert.ok(gentle.grainDurationSec > 1.1);
  assert.ok(gentle.gainLevel > 0.025 && gentle.gainLevel < 0.12);

  // Fast scroll velocity -> shorter grain interval, higher frequency, louder gain, tighter decay
  const fast = calculateGranularGrainParams(0.85, 0.045, 50, 0, 'bronze');
  assert.equal(fast.shouldTrigger, true);
  assert.equal(fast.grainIntervalMs, 28);
  assert.ok(fast.baseFrequencyHz > gentle.baseFrequencyHz);
  assert.ok(fast.grainDurationSec < gentle.grainDurationSec);
  assert.ok(fast.gainLevel > gentle.gainLevel);
  assert.equal(fast.chapterRegisterName, 'IV · Sapphire Aether');

  // Cooldown check: fast velocity but only 10ms elapsed (< 28ms interval) -> shouldTrigger is false
  const onCooldown = calculateGranularGrainParams(0.85, 0.045, 10, 1, 'bronze');
  assert.equal(onCooldown.shouldTrigger, false);
});

test('getChapterRegisterName maps scroll quarters to curatorial acoustic chapters', () => {
  assert.equal(getChapterRegisterName(0.0), 'I · Molten Bronze');
  assert.equal(getChapterRegisterName(0.34), 'II · Marble Harmonics');
  assert.equal(getChapterRegisterName(0.62), 'III · Liquid Resonance');
  assert.equal(getChapterRegisterName(0.94), 'IV · Sapphire Aether');
});

