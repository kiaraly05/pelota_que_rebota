# AGENTS.md

## What this is
Tiny standalone p5.js "bouncing ball" demo. Two tracked files, no build system, no package manager, no tests, no CI.

- `index.html` — page shell; loads p5 core, then p5.sound, then `sketch.js`
- `sketch.js` — the entire sketch. Global-mode p5: autonomous ball that bounces on all four screen edges, changes size and color (morado / fucsia / turquesa) on each bounce, plays a blip, leaves a fading trail on a dark-charcoal canvas with a faint white grid and mouse particles, and freezes while the mouse hovers over it.

## Running
Open `index.html` in a browser (`file://` is fine). Do **not** add a bundler/dev server/npm project — there is nothing to build or install.

Internet is required at runtime; both libraries are loaded from jsDelivr and version-pinned in `index.html`:
- `https://cdn.jsdelivr.net/npm/p5@2.3.4/lib/p5.js`
- `https://cdn.jsdelivr.net/npm/p5.sound@0.4.1/dist/p5.sound.min.js`

## Conventions / gotchas
- Keep p5 in **global mode**. Do not switch to instance mode (`new p5(...)`) or ES modules/imports; `sketch.js` relies on globals like `createCanvas`, `circle`, `constrain`, `dist`, `random`.
- Preserve script order in `index.html`: p5 core → p5.sound → `sketch.js`. The p5.sound bundle is a UMD/IIFE addon that attaches to the global `p5`, so p5 core must load first.
- **p5.sound is a separate package, not bundled with p5.** p5 `2.3.4` no longer ships `lib/addons/p5.sound.min.js` (that path 404s). The addon `p5.sound@0.4.1` is a Tone.js wrapper with a modernized API (exposes `p5.Oscillator`, `p5.Envelope`, etc.) — legacy p5.sound 1.x examples may not apply.
- **Audio needs a user gesture.** Browsers block the AudioContext until interaction, so audio unlocks in `activarAudio()` (wired to p5's `mousePressed`/`touchStarted` plus native `pointerdown`/`keydown`/`touchstart`): it calls `userStartAudio()` and starts the oscillator. Do **not** start the oscillator in `setup()` (p5.sound's documented pattern starts it on the gesture); gate `rebotar()` on the `audioListo` flag. While locked, the sketch shows a "Haz clic para activar el sonido" hint.
- **`index.html` has an inline polyfill for `AudioParam.cancelAndHoldAtTime` and it must stay before the p5.sound `<script>`.** Firefox/Safari lack that method, and Tone.js (inside p5.sound) calls it on every `osc.freq()`, `osc.amp()`, and `env.play()`, throwing `this._param.cancelAndHoldAtTime is not a function`. p5.sound wraps native AudioParams via standardized-audio-context, which feature-detects support at load time — so patching native `AudioParam.prototype` *before* p5.sound loads is what makes the wrapper expose the method; patching after load does not help.
- Bounce sound is an oscillator routed through an envelope: `osc.disconnect()` then `osc.connect(env)` is required so the tone isn't heard continuously alongside the enveloped blips.
- Hovering the ball **stops** it: `draw()` skips `moverPelota()` while `dist(mouseX, mouseY, posX, posY) < diametro / 2`. `rebotar()` calls `cambiarTamano()` and `cambiarColor()`, so `diametro` is a `let` (clamped to `diametroMin`/`diametroMax`) with `posX`/`posY` re-clamped to the new radius, and `colorPelota` is picked from `morado`/`fucsia`/`turquesa`.
- The canvas is dark charcoal (`fondo = [18, 18, 26]`). The trail lives in a separate transparent layer (`capa = createGraphics(width, height)`): each frame `draw()` first resets the main canvas with opaque `background(fondo)`, fades the layer with `capa.erase(28)`, draws the ball/particles into `capa`, and finally composites it with `image(capa, 0, 0)`. Keep the on-canvas hint text and hover ring on the **main** canvas (after `image`) so they don't leave trails, and keep them light-colored for the dark background.
- `dibujarCuadricula()` draws a faint white grid (`stroke(255, 255, 255, 38)` ≈ 15% opacity) every frame directly on the main canvas. Because the main canvas is reset with opaque `background()` each frame, the grid renders at its true opacity — drawing it over the fading trail canvas instead would accumulate to ~64%. Change `pasoCuadricula` for spacing.
- Mouse particles: `mouseMoved()` sets `mouseEnCanvas`, then `actualizarParticulas()` emits from `mouseX`/`mouseY` every ~35 ms. Each particle lives exactly `VIDA_PARTICULA = 7000` ms (7 s) measured with `millis()` and is removed in `actualizarParticulas()`; they are a separate effect from the ball, not attached to it.
- The visible `<h1>` ("Pelotita Loca") is a full-width overlay on top of the canvas. Keep it `position: fixed` with `pointer-events: none`, otherwise it swallows `pointermove` in the top-center strip and the ball can't be hovered there. The CSS reset (`* { margin: 0 }`, `body { overflow: hidden }`) is what removes the default white border around the canvas.
- `sketch.js` is intentionally minimal; comments are in Spanish — leave them (and their informal tone) in place.
- Canvas is sized once with `windowWidth`/`windowHeight`; there is no `windowResized` handler, so the canvas does not resize with the window (known behavior, not a bug to silently "fix").
