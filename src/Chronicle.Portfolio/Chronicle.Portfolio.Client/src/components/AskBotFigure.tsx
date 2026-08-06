/**
 * The bot, drawn rather than rendered.
 *
 * **No Three.js, and that is a rule rather than a preference.** The root `CLAUDE.md` says
 * Software City is a separate repository and that no 3D or rendering code belongs here.
 * A WebGL robot would also be a megabyte of runtime, a canvas that cannot inherit a theme,
 * and a second thing to keep at sixty frames on the phone a recruiter is holding.
 *
 * So the dimensionality is done the way it is done in illustration: a light source agreed
 * once — upper left — and then every surface shaded to it. Radial gradients for the domed
 * head and body, a lighter rim on the top-left of each form, a darker one opposite, and a
 * single soft shadow underneath to sit it on the ground. It reads as an object because the
 * shading is consistent, not because a renderer was involved.
 *
 * The visor is the only part that emits rather than reflects, which is what makes the face
 * the thing you look at.
 *
 * `currentColor` is deliberately not used: this keeps its own palette in both themes. A
 * robot that changes colour with the site reads as a UI element; one that does not reads
 * as a character standing in front of it.
 */
export function AskBotFigure({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="A small robot"
      focusable="false"
    >
      <defs>
        {/* Upper-left key light, on every dome. */}
        <radialGradient id="bot-head" cx="0.34" cy="0.28" r="0.85">
          <stop offset="0" stopColor="#f2f6fa" />
          <stop offset="0.55" stopColor="#c3ccd8" />
          <stop offset="1" stopColor="#8e99a8" />
        </radialGradient>

        <radialGradient id="bot-body" cx="0.36" cy="0.24" r="0.9">
          <stop offset="0" stopColor="#8ea2d8" />
          <stop offset="0.6" stopColor="#5f74b4" />
          <stop offset="1" stopColor="#3d4d84" />
        </radialGradient>

        <radialGradient id="bot-limb" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#e6ebf1" />
          <stop offset="1" stopColor="#97a2b0" />
        </radialGradient>

        <linearGradient id="bot-visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b3550" />
          <stop offset="1" stopColor="#141b2b" />
        </linearGradient>

        {/* The ground shadow. Blurred rather than a flat ellipse, so the figure sits on
            the surface instead of being stuck to it. */}
        <filter id="bot-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
      </defs>

      <ellipse cx="60" cy="110" rx="26" ry="4.5" fill="#0b1522" opacity="0.28" filter="url(#bot-shadow)" />

      {/* Ears. Behind the head, so the head's rim light reads as in front of them. */}
      <g>
        <rect x="12" y="26" width="17" height="22" rx="7" fill="url(#bot-limb)" />
        <rect x="15.5" y="30" width="10" height="14" rx="3" fill="#2b3550" />
        <rect x="17" y="32" width="7" height="1.6" rx="0.8" fill="#7d8ff5" opacity="0.85" />
        <rect x="17" y="35.4" width="7" height="1.6" rx="0.8" fill="#7d8ff5" opacity="0.7" />
        <rect x="17" y="38.8" width="7" height="1.6" rx="0.8" fill="#7d8ff5" opacity="0.55" />

        <rect x="91" y="26" width="17" height="22" rx="7" fill="url(#bot-limb)" />
        <rect x="94.5" y="30" width="10" height="14" rx="3" fill="#2b3550" />
        <rect x="96" y="32" width="7" height="1.6" rx="0.8" fill="#7d8ff5" opacity="0.85" />
        <rect x="96" y="35.4" width="7" height="1.6" rx="0.8" fill="#7d8ff5" opacity="0.7" />
        <rect x="96" y="38.8" width="7" height="1.6" rx="0.8" fill="#7d8ff5" opacity="0.55" />
      </g>

      {/* Head. */}
      <rect x="26" y="14" width="68" height="52" rx="22" fill="url(#bot-head)" />
      {/* Rim light along the top-left, and a contact shade opposite. Two strokes are what
          turn a flat rounded rectangle into a dome. */}
      <path d="M32 40a22 22 0 0 1 22-22h12" fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M88 42a22 22 0 0 1-22 22H58" fill="none" stroke="#5c6675" strokeOpacity="0.35" strokeWidth="2.2" strokeLinecap="round" />

      {/* Visor and face. The one emissive surface. */}
      <rect x="35" y="24" width="50" height="32" rx="13" fill="url(#bot-visor)" />
      <rect x="38" y="27" width="44" height="12" rx="7" fill="#ffffff" opacity="0.06" />

      <g className="ask-bot-face" fill="#e8ff5a">
        <rect className="ask-bot-eye" x="46" y="33" width="8" height="9" rx="2.5" />
        <rect className="ask-bot-eye" x="66" y="33" width="8" height="9" rx="2.5" />
        {/* A mouth drawn as three blocks: a smile that survives being 22px wide. */}
        <rect x="52" y="46" width="16" height="3.4" rx="1.7" />
        <rect x="48.5" y="43" width="3.6" height="3.4" rx="1.7" />
        <rect x="67.9" y="43" width="3.6" height="3.4" rx="1.7" />
      </g>

      {/* Neck. */}
      <rect x="52" y="64" width="16" height="7" rx="3" fill="#b7c0cc" />
      <rect x="52" y="66.5" width="16" height="2.4" fill="#e8ff5a" opacity="0.9" />

      {/* Body. */}
      <path d="M60 70c16 0 27 10 27 22 0 13-12 22-27 22s-27-9-27-22c0-12 11-22 27-22z" fill="url(#bot-body)" />
      <path d="M40 82a27 27 0 0 1 20-10" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2.2" strokeLinecap="round" />
      {/* Chest plate, a shade lighter so the torso reads as two surfaces. */}
      <path d="M60 78c9 0 15 5 15 12 0 8-7 13-15 13s-15-5-15-13c0-7 6-12 15-12z" fill="#ffffff" opacity="0.12" />

      {/* Arms. Shoulders are spheres; the forearms are plates. */}
      <g>
        <circle cx="28" cy="76" r="8" fill="#1f2735" />
        <rect x="21" y="84" width="14" height="20" rx="6" fill="url(#bot-limb)" />
        <rect x="22.5" y="104" width="11" height="9" rx="3" fill="#1f2735" />

        <circle cx="92" cy="76" r="8" fill="#1f2735" />
        <rect x="85" y="84" width="14" height="20" rx="6" fill="url(#bot-limb)" />
        <rect x="86.5" y="104" width="11" height="9" rx="3" fill="#1f2735" />
      </g>

      {/* Accents, the same yellow as the face, so the figure reads as one design. */}
      <rect x="33" y="88" width="3" height="9" rx="1.5" fill="#e8ff5a" opacity="0.9" />
      <rect x="84" y="88" width="3" height="9" rx="1.5" fill="#e8ff5a" opacity="0.9" />
    </svg>
  );
}
