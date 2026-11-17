# PS2 Crystal Clock

A faithful recreation of the PlayStation 2's iconic system menu clock, built with React Three Fiber and Three.js. The original PS2 clock was a mesmerizing 3D visualization that greeted players when no disc was inserted — this project brings that experience to the web.

## [Live Demo](https://clock.richiepreece.com)

## How It Works

### The Crystal Rods (Hours)

Twelve translucent crystal rods are arranged in a circle like the hours on an analog clock face. The rod corresponding to the current hour glows brighter with a liquid fill effect that drains over the course of the hour — full at the top of the hour, nearly empty just before the next. The entire clock face rotates around the axis of the current hour rod, creating the signature spinning-coin effect of the PS2 clock.

The rods use transmissive, refractive blue glass with purple environment reflections and sharp highlights. The glowing cyan-white liquid has a flat surface. The centered orbs cast light onto the crystals and are refracted through glass in front of them rather than drawn over it. The camera closely frames the rotating clock with minimal padding on both landscape and portrait screens.

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

Integer orbital frequencies create the groupings continuously, without snapping between target positions. Tapered blue trails with bright cores and soft halos sample the previous 1.5 seconds of motion, so their length does not depend on frame rate. The trails remain depth-tested and appear refracted through crystals behind which they pass.
The orbs sweep around once every few seconds, with their orbital planes fanning apart and regrouping rather than sharing a fixed ring.

### The Orbit Radius (Minutes)

The orbit starts at roughly half the radius of the central crystal gap and grows steadily throughout the hour, matching the scale progression in the cached reference video. Its merged position at each minute's :00 gets progressively closer to the next hour's crystal, almost touching its inner tip at the hour change. After that convergence, the orbit contracts over five seconds to its half-gap starting size before beginning the next expansion.

### The Background

A perspective-mapped cloud tunnel shader carries purple clouds outward from a dark vanishing point, creating forward motion through the tunnel.

## Development

### Prerequisites

- Node.js 22.6 or newer (GitHub Actions uses Node.js 24)
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

Outputs static files to the ignored `dist/` directory. Do not commit generated files.

### Deployment

Every push to `main` runs `.github/workflows/deploy-pages.yml`, which installs
dependencies from the frozen pnpm lockfile, runs the tests, builds the site, and
deploys the resulting artifact to GitHub Pages. No local build or generated-code
commit is needed. The workflow can also be run manually from `main`.

GitHub Pages must use **GitHub Actions** as its source under **Settings > Pages >
Build and deployment**, rather than publishing a branch's `docs/` directory.
The custom domain, `clock.richiepreece.com`, is managed in those Pages settings;
Actions deployments do not need a `CNAME` file.

Actions are pinned to immutable commits. The build has read-only repository
access; only the separate deployment job receives Pages write and OIDC
permissions, using GitHub's short-lived tokens rather than a personal access token.
Protect `main` and review workflow and dependency changes: automation prevents
unreviewed build output from being committed, but does not make dependencies or
source changes inherently safe.

### Test clock behavior

With Node.js 22.6 or newer:

```
pnpm test
```

Checks orb groupings, hour-hand alignment, smooth motion, liquid fill timing, and camera framing.

## References

- [PS2 Clock Rules](https://gamicus.fandom.com/wiki/PlayStation_2_internal_display_clock)
- [PS2 Clock Video Reference](https://www.youtube.com/watch?v=LTMOkw-0TfQ)

The full reference video is cached locally at `references/ps2-clock/reference.mp4`.
`frames/second-00000.jpg` onward samples the full hour once per second;
`first-minute/frame-00000.jpg` onward samples the first minute at 10 frames per second for motion comparisons.
Frame numbers start at zero and refer to elapsed video time. These local media files are ignored by Git.
