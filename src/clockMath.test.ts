import assert from 'node:assert/strict';
import test from 'node:test';
import { CLOCK_RADIUS, getCameraDistance, getHourDirection, getHourFill, getOrbPosition } from './clockMath.ts';

test('hour directions follow an upright analog clock', () => {
  for (const [hour, expectedX, expectedY] of [[0, 0, 1], [3, 1, 0], [6, 0, -1], [9, -1, 0]]) {
    const [x, y] = getHourDirection(hour);
    assert.ok(Math.abs(x - expectedX) < 1e-10);
    assert.ok(Math.abs(y - expectedY) < 1e-10);
  }
});

test('orbits produce the documented groups at every whole second', () => {
  for (let second = 0; second < 60; second++) {
    const expected = second === 0 ? 1 :
      second % 30 === 0 ? 2 :
      second % 20 === 0 ? 3 :
      second % 15 === 0 ? 4 :
      second % 12 === 0 ? 5 :
      second % 10 === 0 ? 6 : 7;
    const positions = Array.from({ length: 7 }, (_, index) =>
      getOrbPosition(11 * 3600 + 7 * 60 + second, index).map(value => Number(value.toFixed(7))).join(','),
    );
    assert.equal(new Set(positions).size, expected, `group count at :${second}`);
  }
});

test('minute convergence follows the hour hand, including fractional hours', () => {
  for (const seconds of [0, 3 * 3600, 6 * 3600, 9 * 3600, 11 * 3600 + 30 * 60]) {
    const direction = getHourDirection(seconds / 3600);
    for (let index = 0; index < 7; index++) {
      const position = getOrbPosition(seconds, index);
      const radius = Math.hypot(...position);
      position.forEach((value, axis) => assert.ok(Math.abs(value / radius - direction[axis]) < 1e-10));
    }
  }
});

test('orb motion is continuous through grouping instants', () => {
  for (const second of [10, 12, 15, 20, 24, 30, 36, 40, 45, 48, 50, 60]) {
    for (let index = 0; index < 7; index++) {
      const before = getOrbPosition(420 + second - 0.001, index);
      const after = getOrbPosition(420 + second + 0.001, index);
      assert.ok(Math.hypot(...before.map((value, axis) => value - after[axis])) < 0.01);
    }
  }
});

test('orbs sweep through multi-second loops rather than spinning once per second', () => {
  for (const seconds of [123.25, 452.5, 1827.75, 3598.5]) {
    for (let index = 0; index < 7; index++) {
      const before = getOrbPosition(seconds, index);
      const after = getOrbPosition(seconds + 0.1, index);
      const distance = Math.hypot(...before.map((value, axis) => value - after[axis]));
      assert.ok(distance / Math.hypot(...before) < 0.29, `orb ${index} moves too fast at ${seconds}`);
    }
  }
});

test('independent orbs fan into different orbital planes', () => {
  const [a, b, c] = [0, 2, 6].map(index => getOrbPosition(124.5, index));
  const volume = a[0] * (b[1] * c[2] - b[2] * c[1]) +
    a[1] * (b[2] * c[0] - b[0] * c[2]) +
    a[2] * (b[0] * c[1] - b[1] * c[0]);
  assert.ok(Math.abs(volume) / Math.pow(Math.hypot(...a), 3) > 0.01);
});

test('orbit growth matches the reference scale throughout the hour', () => {
  const samples = [
    [30, 0.47, 0.56],
    [300, 0.50, 0.59],
    [900, 0.56, 0.67],
    [1800, 0.66, 0.78],
    [2700, 0.78, 0.90],
    [3540, 0.88, 0.96],
  ];
  const radii = samples.map(([seconds, minimumRatio, maximumRatio]) => {
    const radius = Math.hypot(...getOrbPosition(seconds, 0));
    for (let index = 0; index < 7; index++) {
      const position = getOrbPosition(seconds, index);
      const orbRadius = Math.hypot(...position);
      assert.ok(orbRadius / 0.9 > minimumRatio && orbRadius / 0.9 < maximumRatio,
        `orbit scale at ${seconds / 60} minutes`);
      assert.ok(orbRadius + 0.04 < 0.9);
    }
    return radius;
  });
  assert.ok(radii.every((radius, index) => index === 0 || radius > radii[index - 1]));
});

test('minute convergence approaches the next crystal as the hour advances', () => {
  const crystal = getHourDirection(3).map(value => value * 0.9);
  let previousDistance = Infinity;
  for (let minute = 1; minute < 60; minute++) {
    const position = getOrbPosition(2 * 3600 + minute * 60, 0);
    const distance = Math.hypot(...position.map((value, axis) => value - crystal[axis]));
    assert.ok(distance < previousDistance, `convergence at minute ${minute} should be closer`);
    previousDistance = distance;
  }
  assert.ok(previousDistance - 0.04 < 0.04);
});

test('hourly convergence reaches the crystal before contracting without a jump', () => {
  for (const seconds of [0, 3 * 3600, 12 * 3600, 24 * 3600]) {
    const crystal = getHourDirection(seconds / 3600).map(value => value * 0.9);
    for (let index = 0; index < 7; index++) {
      const position = getOrbPosition(seconds, index);
      const gap = Math.hypot(...position.map((value, axis) => value - crystal[axis])) - 0.04;
      assert.ok(gap > 0 && gap < 0.02);
      const before = getOrbPosition(seconds - 0.001, index);
      const after = getOrbPosition(seconds + 0.001, index);
      assert.ok(Math.hypot(...before.map((value, axis) => value - after[axis])) < 0.01);
      const contractedRadius = Math.hypot(...getOrbPosition(seconds + 5, index));
      assert.ok(contractedRadius > 0.9 * 0.47 && contractedRadius < 0.9 * 0.56);
      assert.ok(contractedRadius < Math.hypot(...position) * 0.6);
    }
  }
});

test('hour liquid fills in, then drains toward the next hour', () => {
  assert.equal(getHourFill(0), 0);
  assert.ok(getHourFill(2.5) > 0.49 && getHourFill(2.5) < 0.5);
  assert.ok(getHourFill(5) > 0.99);
  assert.equal(getHourFill(1800), 0.5);
  assert.ok(getHourFill(3599.99) < 0.00001);
});

test('camera closely frames the whole rotating clock in wide and narrow viewports', () => {
  const halfFov = 20 * Math.PI / 180;
  for (const aspect of [0.46, 0.75, 1, 1.85, 3]) {
    const distance = getCameraDistance(aspect, 40);
    const limitingFov = Math.atan(Math.tan(halfFov) * Math.min(aspect, 1));
    const angularRadius = Math.asin(CLOCK_RADIUS / distance);
    assert.ok(angularRadius < limitingFov);
    assert.ok(angularRadius > limitingFov * 0.97);
  }
  assert.ok(getCameraDistance(0.46, 40) > getCameraDistance(1.85, 40));
});
