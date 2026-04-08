# PS2 Crystal Clock

A faithful recreation of the PlayStation 2's iconic system menu clock, built with React Three Fiber and Three.js. The original PS2 clock was a mesmerizing 3D visualization that greeted players when no disc was inserted — this project brings that experience to the web.

## [Live Demo](https://clock.richiepreece.com)

## How It Works

### The Crystal Rods (Hours)

Twelve translucent crystal rods are arranged in a circle like the hours on an analog clock face. The rod corresponding to the current hour glows brighter with a liquid fill effect that drains over the course of the hour — full at the top of the hour, nearly empty just before the next. The entire clock face rotates around the axis of the current hour rod, creating the signature spinning-coin effect of the PS2 clock.

### The Orbs (Seconds & Days of the Week)

Seven orbs continuously fly in a spherical swirling pattern near the center of the clock. The seven orbs represent the seven days of the week.

The orbs' grouping throughout the course of one minute represents the lowest common denominator (LCD) of the number 60 — the number of seconds in one minute. There are 6 possible grouping configurations:

| Seconds | Groups | LCD | Meaning |
|---------|--------|-----|---------|
| :00 | 1 | 60/60 | All 7 orbs merge into one at the hour-hand position |
| :30 | 2 | 60/30 | Half minute |
| :20, :40 | 3 | 60/20 | Third of a minute |
| :15, :45 | 4 | 60/15 | Quarter minute |
| :12, :24, :36, :48 | 5 | 60/12 | Fifth of a minute |
| :10, :50 | 6 | 60/10 | Sixth of a minute |
| All other seconds | 7 | — | All orbs fly independently |

The lowest possible LCD always takes precedence. For example, at :30, the orbs form 2 groups (not 4 or 6, even though 30 is also divisible by 15 and 10).

At second :00, all orbs converge to the exact position where the hour hand would be on an analog clock, creating a brief moment of unity before dispersing again.

The orb positions are entirely determined by the current wall-clock time, so they are always in the correct position — even after a page refresh.

### The Orbit Radius (Minutes)

The radius of the orbs' orbit expands throughout each hour. At the top of the hour the orbs swirl tightly near the center; by the end of the hour they sweep a wider arc. This resets when the hour changes.

### The Background

A procedural wormhole tunnel shader creates the signature PS2 depth effect — an infinite passage of swirling purple clouds receding into the distance.

## Development

### Prerequisites

- Node.js
- pnpm

### Run locally

```
pnpm install
pnpm start
```

Opens at [http://localhost:1234](http://localhost:1234).

### Build for production

```
pnpm build
```

Outputs static files to the `docs/` directory for GitHub Pages deployment.

## References

- [PS2 Clock Rules](https://gamicus.gamepedia.com/PlayStation_2_internal_display_clock)
- [PS2 Clock Video Reference](https://www.youtube.com/watch?v=LTMOkw-0TfQ)
