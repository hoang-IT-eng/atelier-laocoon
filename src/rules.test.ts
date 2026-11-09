import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStoryDashProgress, isSlideActive, calculateCameraOrbit } from './rules';

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
  // At scroll = 0:
  // phi = 0
  // y = 0.35 + sin(0)*0.8 = 0.35
  // radius = 4.2 - sin(0)*0.6 = 4.2
  // x = 4.2 * sin(0) = 0
  // z = 4.2 * cos(0) = 4.2
  // easeFactor = (cos(0) + 1) * 0.5 = 1.0
  // lookAtXOffset = -0.9 * 1.0 = -0.9
  const initial = calculateCameraOrbit(0.0);
  assert.ok(Math.abs(initial.x - 0.0) < 1e-5);
  assert.ok(Math.abs(initial.y - 0.35) < 1e-5);
  assert.ok(Math.abs(initial.z - 4.2) < 1e-5);
  assert.ok(Math.abs(initial.lookAtXOffset - (-0.9)) < 1e-5);

  // At scroll = 0.28 (transition to centered lookAt completes):
  const transitioned = calculateCameraOrbit(0.28);
  assert.ok(Math.abs(transitioned.lookAtXOffset - 0.0) < 1e-5);

  // At scroll = 0.5 (halfway orbit, opposite side z < 0):
  const half = calculateCameraOrbit(0.5);
  // phi = PI -> x ~ 0, z ~ -radius
  assert.ok(Math.abs(half.x) < 1e-5);
  assert.ok(half.z < 0);
  assert.ok(Math.abs(half.lookAtXOffset) < 1e-5);

  // At scroll = 1.0 (full 360 orbit back to start angle):
  const full = calculateCameraOrbit(1.0);
  assert.ok(Math.abs(full.x) < 1e-5);
  assert.ok(Math.abs(full.z - 4.2) < 1e-5);
});
