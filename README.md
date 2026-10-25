# Highway Rush — Endless Drive

A premium 3D endless highway racer built with **Next.js App Router**, **TypeScript**, **React**, **Three.js**, **styled-components**, and **Zustand**.

Thread traffic across seven distinct destinations, chain near misses, fire nitro, upgrade an eight-car garage, and chase local records. The entire game runs in the browser — no backend, database, or API keys required.

**Built by Umar Nazir.**

## Highlights

- **Real 3D racing** — procedural highway, traffic, scenery, lighting, and vehicle models rendered with Three.js.
- **Free continuous steering** — analog-style steering with drifting, collisions, damage, fuel, nitro, gears, RPM, and checkpoints every 700 m.
- **Seven destinations** — Mountain Highway, City Night, Desert Highway, Coastal Road, Snowy Mountain Pass, Forest Highway, and Neon City, each with its own palette, weather, traffic, and layout.
- **Eight-car garage** — rotate and inspect each car in 3D; paint, rims, wheels, spoilers, decals, and underglow with persistent saves.
- **Progression** — 32 trophies across Bronze/Silver/Gold/Platinum, long-term missions, daily missions, statistics, and a local leaderboard.
- **Complete settings** — graphics, audio, controls, gameplay, and accessibility options, including key rebinding, UI scale, reduced motion, and performance mode.
- **Procedural audio** — engine, tire, wind, ambience, music, and UI cues synthesized with the Web Audio API. No audio files to load or break.
- **Input coverage** — keyboard, touch, and gamepad support with pause, restart, countdown, and results flows.
- **Production-ready UI** — dark charcoal/electric-lime racing theme, responsive layouts, animated feedback, and accessible touch targets.

## Requirements

- Node.js **20.9+**
- npm 10+
- A modern browser with WebGL 2 and Web Audio support

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Run the TypeScript compiler with no emit |

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Main menu, featured destination, progress snapshot |
| `/play` | Race setup: destination, car, difficulty, race/endless mode |
| `/garage` | 3D car viewer, purchases, customization, stat comparison |
| `/destinations` | Route gallery, unlock requirements, records |
| `/missions` | Daily and long-term mission tracking |
| `/trophies` | Trophy cabinet with progress and rewards |
| `/statistics` | Lifetime driving statistics and recent runs |
| `/settings` | Graphics, audio, controls, gameplay, accessibility |
| `/how-to-play` | Controls, scoring, race rules |
| `/leaderboard` | Local run leaderboard |
| `/credits` | Production credits and project notes |

## Controls

Default keyboard bindings (all can be remapped in **Settings → Controls**):

| Action | Default |
| --- | --- |
| Steer left | `←` |
| Steer right | `→` |
| Accelerate | `↑` |
| Brake | `↓` |
| Nitro | `Space` |
| Pause | `Escape` |

- **Touch:** on-screen steering, throttle, brake, and nitro controls appear during a race.
- **Gamepad:** left stick steers; triggers accelerate/brake; face/shoulder buttons fire nitro; `Start` pauses.
- **Audio:** browsers require a user gesture before audio can start. Pressing **Start Race**, or interacting with the menu, unlocks the audio context.

## Scoring

- Distance: **2 points per metre**, plus a speed component
- Near miss: **150 × combo multiplier**
- Coin: **35 × multiplier** and **+1 coin**
- Checkpoint (every 700 m): **600 + 150 × checkpoint index**
- Finish bonus: **5000**
- Drift: **4 points per metre**

Runs end on finish, critical damage, empty fuel, or quitting. Rewards are paid once per run, and trophy progress updates both live and at the results screen.

## Persistence

All progress is stored locally in the browser under the `highway-rush-save-v2` key using Zustand's `persist` middleware. This includes settings, coins, owned cars, customization, unlocks, trophies, missions, statistics, and local run history.

- No account or server is involved.
- Clearing site data resets progress.
- The leaderboard is explicitly local-only and does not represent global rankings.

## Audio

`lib/audio/AudioManager.ts` synthesizes every sound at runtime:

- layered oscillators for the engine, sub-bass, tire noise, and wind
- filtered noise beds per destination for ambience
- looping procedural music patterns per destination
- short synthesized cues for UI, coins, near misses, crashes, nitro, and trophies

The synthesized soundtrack is a functional, dependency-free placeholder and can be replaced with licensed tracks without changing game logic. Audio nodes, timers, and intervals are disposed when a race unmounts.

## Architecture

```text
app/                     Next.js App Router pages, layout, global styles
components/
  game/                  RaceStage, HUD, touch controls, preview canvas
  layout/                NavBar, Footer, PageShell
  providers/             Theme/styled-components, store hydration, global audio
  ui/                    Reusable buttons, panels, modals, toasts, controls
lib/
  audio/                 Procedural Web Audio manager
  data/                  Cars, destinations, missions, trophies
  game/                  Three.js engine, environment, car model, input, preview
  hooks/                 Menu audio lifecycle
  store/                 Zustand game and UI stores
  ui/                    Theme, formatting utilities, styled-components types
public/                  App icon
```

### Rendering and performance

- A single WebGL renderer and race loop are owned by `RaceStage` and disposed on unmount.
- Graphics settings apply live where possible; antialiasing changes require a renderer rebuild.
- Performance mode, render scale, shadow quality, and effects levels reduce GPU cost on lower-end devices.
- Input listeners, audio timers, and animation frames are cleaned up to avoid duplicate loops.

## Deployment

### Vercel

1. Push the repository to GitHub/GitLab/Bitbucket.
2. Import the project in Vercel.
3. Keep the detected framework preset **Next.js**.
4. Build command: `npm run build`. Output is handled automatically.
5. No environment variables are required.

### Other Node hosts

```bash
npm ci
npm run build
npm run start
```

Serve the app over HTTPS. The game is fully client-side apart from Next.js page rendering, so any Node-compatible host works.

## Browser Notes

- Audio starts only after a user gesture, by browser policy.
- WebGL is required; unsupported devices see a graceful error state.
- Touch controls are optimized for landscape play.
- Progress is per-browser and per-origin.

## Credits

Design, development, and direction: **Umar Nazir**.

Built with Next.js, React, TypeScript, Three.js, styled-components, Zustand, and Lucide.

**Built by Umar Nazir.**
