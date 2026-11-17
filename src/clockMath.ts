const TAU = Math.PI * 2;

export const CLOCK_RADIUS = 2.92;

export function getHourDirection(hours: number): [number, number, number] {
  const angle = (hours / 12) * TAU;
  return [Math.sin(angle), Math.cos(angle), 0];
}

export function getCameraDistance(aspect: number, verticalFov: number): number {
  const halfFov = (verticalFov * Math.PI) / 360;
  const limitingFov = Math.atan(Math.tan(halfFov) * Math.min(aspect, 1));
  return CLOCK_RADIUS / Math.sin(limitingFov) / 0.99;
}

export function getHourFill(secondsInHour: number): number {
  return (1 - secondsInHour / 3600) * Math.min(secondsInHour / 5, 1);
}

export function getOrbPosition(seconds: number, index: number): [number, number, number] {
  const secondsInHour = ((seconds % 3600) + 3600) % 3600;
  const hourProgress = secondsInHour / 3600;
  const growingRadius = 0.45 + hourProgress * 0.4;
  const resetRadius = 0.45 + 0.4 * Math.max(1 - secondsInHour / 5, 0);
  const radius = Math.max(growingRadius, resetRadius);
  const [hourX, hourY] = getHourDirection(seconds / 3600);
  // Integer orbit counts per minute naturally produce the 1/2/3/4/5/6/7
  // groupings, with all seven meeting on the hour direction at :00.
  const minutePhase = ((seconds % 60) / 60) * TAU;
  const spread = minutePhase * (index + 1);
  const phase = minutePhase * 12 + spread;
  const tilt = 0.7 + Math.sin((seconds / 300) * TAU) * 0.3 + Math.sin(spread) * 0.75;
  const radial = Math.cos(phase) * radius;
  const tangent = Math.sin(phase) * radius;
  return [
    hourX * radial + hourY * tangent * Math.cos(tilt),
    hourY * radial - hourX * tangent * Math.cos(tilt),
    tangent * Math.sin(tilt),
  ];
}
