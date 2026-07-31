/**
 * GLSL for the water surface background.
 *
 * Two passes, because a wake needs memory. The simulation pass advances a height field
 * and writes it back to a texture; the render pass reads that field and lights it. A
 * one-pass "draw a circle where the mouse is" effect cannot produce a wake that spreads
 * and fades after the cursor has gone, which is the whole point.
 *
 * The height field is a damped wave equation on a grid - the same algorithm as the old
 * 2D water demos, which still looks better than anything analytic because the ripples
 * genuinely interfere with each other.
 *
 * Kept in its own module so the component reads as lifecycle and input handling rather
 * than a wall of shader source.
 */

/** Fullscreen triangle. Shared by both passes. */
export const VERTEX = `#version 300 es
in vec2 aPos;
out vec2 vUv;

void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/**
 * Advances the height field one step and injects this frame's disturbances.
 *
 * Channels: `.r` is height now, `.g` is height one step ago. The wave equation needs
 * both, which is why this is not a single-channel texture.
 *
 * All distances are measured in **texels**, not UV. UV distance on a non-square texture
 * is elliptical, so a ripple would be visibly wider than it is tall on a laptop.
 */
export const SIMULATE = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uPrev;
uniform vec2 uSize;          // simulation grid, in texels
uniform vec2 uPointer;       // this frame's pointer, in UV
uniform vec2 uPointerPrev;   // last frame's, so the wake is a line and not a dotted trail
uniform float uPointerForce;
uniform float uPointerRadius;
uniform vec3 uClick;         // xy position in UV, z force
uniform float uClickRadius;
uniform float uDamping;

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 texel = 1.0 / uSize;

  float here = texture(uPrev, vUv).r;
  float before = texture(uPrev, vUv).g;

  float left = texture(uPrev, vUv - vec2(texel.x, 0.0)).r;
  float right = texture(uPrev, vUv + vec2(texel.x, 0.0)).r;
  float up = texture(uPrev, vUv - vec2(0.0, texel.y)).r;
  float down = texture(uPrev, vUv + vec2(0.0, texel.y)).r;

  // The wave equation. Average of the neighbours, minus where this point was, so the
  // surface overshoots and oscillates instead of smoothing to flat.
  float next = (left + right + up + down) * 0.5 - before;
  next *= uDamping;

  vec2 pixel = vUv * uSize;

  // The cursor's wake: a trough along the path travelled since the last frame. Force
  // and width both come from speed, so a slow drag leaves a thread and a flick leaves
  // a gash.
  if (uPointerForce > 0.0) {
    float d = segmentDistance(pixel, uPointerPrev * uSize, uPointer * uSize);
    float fall = 1.0 - smoothstep(0.0, uPointerRadius, d);
    next -= fall * fall * uPointerForce;
  }

  // A click is a single stone dropped in - wider and stronger than the wake, and
  // radial rather than linear.
  if (uClick.z > 0.0) {
    float d = distance(pixel, uClick.xy * uSize);
    float fall = 1.0 - smoothstep(0.0, uClickRadius, d);
    next -= fall * fall * uClick.z;
  }

  // Runaway is possible if a disturbance lands on top of itself; clamping costs one
  // instruction and removes the whole class of failure.
  next = clamp(next, -1.4, 1.4);

  outColor = vec4(next, here, 0.0, 1.0);
}
`;

/**
 * Lights the height field over a slow-moving body of water.
 *
 * The base is a domain-warped fractal noise - noise whose *coordinates* are themselves
 * noise. That is what separates "a mottled texture" from "water seen from above": the
 * warp makes the light and dark regions curl into each other rather than sitting in
 * fixed blobs.
 *
 * Two things make the cursor read as a line drawn in water rather than a glow:
 *
 *   - The base pattern is sampled through the surface normal, so the water underneath a
 *     disturbance is displaced. This is refraction, and it is why the effect looks like
 *     depth rather than paint.
 *   - `crest` lights wherever the height gradient is steep, which is exactly the walls
 *     of a wake and the rings of a ripple. A height-based highlight would light the
 *     peaks and read as foam; a gradient-based one draws the edges.
 */
export const RENDER = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uSim;
uniform vec2 uSize;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uCrest;      // what disturbed water turns toward
uniform vec3 uGlint;      // the specular sparkle on top of it
uniform float uLive;      // eases the whole thing up on first run, so nothing snaps on
uniform float uContrast;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 texel = 1.0 / uSize;

  float left = texture(uSim, vUv - vec2(texel.x, 0.0)).r;
  float right = texture(uSim, vUv + vec2(texel.x, 0.0)).r;
  float up = texture(uSim, vUv - vec2(0.0, texel.y)).r;
  float down = texture(uSim, vUv + vec2(0.0, texel.y)).r;

  vec2 slope = vec2(left - right, up - down);
  vec3 normal = normalize(vec3(slope, 0.34));

  // Pattern space. Scaled by aspect so the water is not stretched on a wide monitor.
  vec2 p = vUv * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0) * 2.6;

  /*
    Refraction. The surface bends what is underneath it.

    Small on purpose. Pattern space spans roughly four units across, so an offset of
    even half a unit displaces the pattern by an eighth of the viewport — the wake stops
    reading as a disturbance in the water and starts smearing the whole surface into
    long diagonal streaks that have nothing to do with where the cursor went. This is
    the number that most changes whether the effect looks like water or like a glitch.
  */
  p += slope * 0.22;

  // Domain warp, drifting. Two levels: the second warp is what makes it curl.
  vec2 q = vec2(
    fbm(p + vec2(0.0, uTime * 0.020)),
    fbm(p + vec2(5.2, 1.3) - uTime * 0.016)
  );
  vec2 r = vec2(
    fbm(p + 3.4 * q + vec2(1.7, 9.2) + uTime * 0.013),
    fbm(p + 3.4 * q + vec2(8.3, 2.8) - uTime * 0.011)
  );
  float base = fbm(p + 3.4 * r);

  float shaped = clamp((base - 0.5) * uContrast + 0.5, 0.0, 1.0);

  /*
    Biased toward the deep tone. Fractal noise clusters around its midpoint, so an even
    mapping spends most of the surface near the light end and the water comes out pale
    and frosted rather than deep. Pulling the low edge up puts more of the screen in the
    deep colour, which is also what gives a bright wake something to be bright against.
  */
  vec3 color = mix(uDeep, uShallow, smoothstep(0.28, 0.92, shaped));

  // A little more depth toward the bottom of the screen. Keeps a tall page from
  // looking like tiled wallpaper.
  color = mix(color, uDeep, smoothstep(0.35, 1.0, vUv.y) * 0.28);

  // The disturbance, in two parts. The multiplier is a sensitivity: too high and the
  // residue of a wake that has spread across the whole screen still lights up at full
  // strength, so the surface never returns to rest.
  float crest = clamp(length(slope) * 2.4, 0.0, 1.0);
  float specular = pow(max(dot(normal, normalize(vec3(0.30, 0.55, 0.78))), 0.0), 24.0);

  /*
    A blend toward the crest colour, not an addition.

    Both themes take the wake LIGHTER than the water it disturbs, and that is a
    legibility decision before it is an aesthetic one. A darker wake was the first
    instinct — it looks like a groove cut into the surface — but it fails: measured
    against the day palette, a dark wake sweeping under the accent colour drops it to
    3.9:1 wherever it passes, and there is no crest colour dark enough to read that
    also leaves the text alone. Lightening can only ever raise contrast for dark ink,
    so the floor stays the resting water and the effect costs nothing.

    The blend is capped at 0.62 rather than left open for the same reason: at full
    strength the night wake takes the surface to 4.2:1 for secondary text.
  */
  color = mix(color, uCrest, clamp(crest * 0.62, 0.0, 1.0) * uLive);

  // The sparkle stays additive. A specular highlight is light arriving, and it is
  // small enough that clipping is the correct behaviour rather than a failure.
  color += uGlint * specular * 0.34 * uLive;

  // Troughs go deeper. Without this the wake reads as drawn on top of the water
  // rather than cut into it.
  float height = texture(uSim, vUv).r;
  color = mix(color, uDeep, clamp(-height, 0.0, 1.0) * 0.30 * uLive);

  outColor = vec4(color, 1.0);
}
`;
