# Motion and UI plan — revision 2

Revised after the budget constraint was lifted and Recruiter Mode was named as the
fallback. Revision 1 was a set of tasteful moves; this one commits to a signature.

Approval before building, because building a visual phase blind has been wrong twice.

---

## 1. What was wrong, twice

**Pass one** was incremental: things faded a little, moved a little. Correct engineering,
no character.

**Revision 1 of this plan** was better but still hedged. I was budgeting kilobytes on a
personal portfolio, and every one of those hedges cost character. Cheap-and-correct is
exactly what "normal boring" means.

The references share one thing my work does not: **scrolling advances a state inside a
scene that is holding still, rather than moving a page past you.** Far Cry 2's notebook
is the same idea — you are not navigating a UI, you are operating an object.

---

## 2. The organising idea

**The site is an instrument.**

It already claims to be mission control, so nothing *fades in* — things **acquire**, the
way a readout locks on. The Timeline is not a page, it is a **transport you operate**.

Every move below has to be justifiable by that sentence. "Add nice animations" with no
organising idea is precisely how a site ends up generic.

### And one hero moment

Award-tier sites are remembered for **one** thing, not for being uniformly polished. bam!
has its arrowhead. Chronicle's is:

> **The Timeline is a machine.** A scrub bar you drag, era scenes you pass through, and
> a page that reacts to where the playhead is.

Everything else is in service of that. If the Timeline is not the thing people mention,
this has failed regardless of how good the rest looks.

---

## 3. Degradation, since Recruiter Mode is the named fallback

Recruiter Mode is **opt-in**, so someone on a weak phone who never finds the toggle just
gets a bad site. The default therefore goes maximal *and* scales itself down
automatically:

| Tier | Detected by | What runs |
|---|---|---|
| **Full** | default | Everything below |
| **Reduced** | `deviceMemory < 4`, `hardwareConcurrency <= 4`, `saveData`, or `2g/3g` | No WebGL. Smooth scroll and reveals stay. |
| **Still** | `prefers-reduced-motion`, or Recruiter Mode | Nothing moves. Everything visible, instantly. |

Detected once on load, written as `data-motion="full|reduced|still"` on `<html>` by the
existing pre-paint script, so CSS and JS both read one value and there is no flash.

**This is what lets the default be greedy.** It is not a compromise on the full
experience; it is the reason the full experience can be uncompromising.

---

## 4. The stack

Constraint lifted, so the choice is now "what is best", not "what is smallest".

| | Why |
|---|---|
| **Lenis** | Inertial scroll. The single change everything else depends on — native scroll is stepped, and stepped scroll makes every downstream animation feel cheap. Also gives scroll **velocity** as an input. |
| ~~GSAP + ScrollTrigger~~ | **Reversed again, and this time not adopted — see the note below.** |
| **Motion** | Stays for component-level enter/exit. Already installed. |
| **Raw WebGL** | The cursor field and image distortion. Still **not Three.js** — that is 150KB of scene graph for two full-screen quads, and it is the wrong tool, not merely a large one. |
| **Three.js** | Only if the Software City teaser gets a real 3D preview. Not part of this plan. |

### Why GSAP was dropped, after being chosen twice

The case for it was pinning and *reversible* scrubbing — sequences that have to run
backwards as well as forwards. That case turns out to be an argument for the platform
rather than for a library.

`position: sticky` pins. `animation-timeline: view()` and `scroll()` scrub. And a
scroll-driven animation is reversible **by construction**, because it is a pure function
of scroll position rather than a tween with a direction and a playhead — which is
precisely the property GSAP was being brought in to provide. They also run on the
compositor at no main-thread cost, which matters here more than on most sites, because
the water simulation already has the GPU and the main thread should stay out of the way.

The Home page's two pinned scenes, the hero's title transformation, the staggered
arrivals, the bar fills, the drawn sparkline and the ring are all built this way, in
`src/app/(home)/home.css`. Where `animation-timeline` is unsupported the page is static
and completely readable, which is the correct failure mode and needs no second code path.

The one thing CSS cannot animate is *content*, so a number counting to its value is
JavaScript — `src/components/Figure.tsx`. Everything else is declarative.

### Where the shared vocabulary lives

`src/app/scenes.css`, imported by `globals.css`, and it holds anything more than one
route needs: the scene rhythm, the pinning mechanism, the staggered arrivals and the
figure primitives. A page's own furniture stays beside the page — the Home hero and
pulse cards in `(home)/home.css`, the roles ledger in `about/about.css`.

It was promoted out of the Home stylesheet the moment About needed the same classes. A
second route importing a first route's stylesheet is worse than promoting the rules,
because it makes one page quietly load-bearing for another.

**Four arrival gestures, and the distinction between them is the point:**

| Gesture | Marked with | Used for |
|---|---|---|
| Rise and settle | `[data-stagger]` | Sections, prose, list rows |
| Rise, hold, sink | `data-depart` | Project cards, which leave as well as arrive |
| Pop from behind | `data-pop` | Readings — metric and pulse cards |
| The weave | `data-weave` | Grids where a row should not arrive as a queue |

The weave alternates by `nth-child` parity: odd children drop from above, even ones rise
from below, each with a counter-rotation under two degrees. Parity rather than a fixed
pattern because these grids are `auto-fit` — a rule written for "the third one" describes
a layout that exists at exactly one viewport width.

### One constraint that is easy to trip over

**Never read the clock in a Server Component.** Cache Components forbids it, and it
throws at render rather than at build. A relative timestamp — "3 days ago" — needs
`Date.now()` and is therefore unavailable server-side; use an absolute date, or take the
server's own date from the timeline endpoint, which returns `today` for exactly this
reason. This has now been hit twice: once visibly on About, and once latently on the Home
repository list, where it would only have surfaced when the list stopped being empty.

---

## 5. The motion vocabulary

Eight moves, used site-wide, so it reads as one thing rather than eleven pages of
invention.

**A. Mask reveal** — content uncovered by a moving `clip-path` edge, never opacity.
Fading is the cheapest reveal and reads as such; a mask reads as something being *drawn*.

**B. Line-split headings** — headings split to lines, each masked and rising on a 40ms
stagger. A heading arriving as one block is a div moving; arriving as lines is
typesetting, and it is the most recognisable high-end signal there is.

**C. Velocity skew** — cards skew and scale a few degrees with scroll speed, settling to
zero. Nearly free, and most of why award sites feel physical: the page has mass.

**D. Pinned scenes** — sections hold still while their contents advance. The notebook.

**E. Glyph acquire** — monospace labels resolve through a brief character scramble;
numbers roll to value. The readout locking on, made literal. This is the site's verbal
tic — used on labels and figures only, never on prose.

**F. Magnetic hover** — interactive elements lean toward the cursor within a small
radius. The page responds to you rather than waiting for you.

**G. Cursor companion** *(new)* — a trailing ring that lags the pointer, grows over
interactive things, and shows a verb ("open", "drag"). **The system cursor stays** —
this augments it rather than replacing it, so no affordance or accessibility is lost.

**H. Image displacement on hover** *(new, reversed from revision 1)* — project imagery
warps under the pointer via a WebGL displacement shader. Reconsidered because the ambient
field is *background* and this is *on the image*: they occupy different layers and do not
compete the way I claimed.

---

## 6. The cursor field — decided: **obvious**

You asked me to choose. **Obvious.**

Subtle was the safe answer and safe is what produced two rejected passes. A portfolio's
job is to be remembered, and an effect nobody notices cannot do that.

Concretely: a full-viewport WebGL layer writing pointer movement into a velocity field
that decays over ~1.2s. Moving the cursor pushes visible colour through the ambient
warm/cool fields — a **wake**, not a glow.

Not brittanychiang's spotlight, deliberately: a gradient following the pointer is a
*position* effect, static and always present. A flowmap is a *motion* effect — it
remembers where you went and decays, so fast movement leaves a trail and stillness leaves
nothing. That is the difference between "there is a glow near my mouse" and "the surface
responded to me".

**The one hard limit:** it never reduces text contrast. The field is masked down over
content columns, so it is loud in the margins and quiet under paragraphs. Obvious is
about presence, not about making the site harder to read.

---

## 7. The Timeline — the hero

### 7a. The transport bar

A **persistent line** across the bottom that behaves like a video scrub bar.

- Drag the playhead horizontally → travel vertically. A horizontal control driving
  vertical movement is what makes it read as a *transport* rather than a scrollbar.
- Era boundaries are ticks; the current era's segment is lit.
- Hover anywhere → the year at that point.
- Not dragging → the playhead tracks scroll.
- Keyboard: arrows step item to item, Home/End to the ends.
- Scrubbing fast blurs the cards slightly, the way a video scrub does.

The columns are gone. They were an information graphic pretending to be a control — they
showed density but afforded nothing. A line with a playhead says *drag me* without a
label.

### 7b. Era scenes

Each era gets a pinned full-bleed title card, held for about a screen of scroll: the name
sets at display scale, the years count up, the ambient field shifts hue, and the previous
era's cards clear before the new era's arrive.

Chapters need a **threshold you cross**, not a heading you scroll past. This is the
single biggest change to how the page feels.

### 7c. Cards

Depth stays, character changes: cards arrive **along the path** rather than straight out
of the screen, media uncovers by mask a beat after the card lands, and the still moment
in the middle stays — a card that is never stationary cannot be read.

### 7d. The page reacts to the playhead

Scrubbing to 2021 shifts the whole page's ambient hue to that era's. Small, and it is what
makes the bar feel connected to the world rather than bolted on.

---

## 8. Recruiter Mode becomes genuinely different

Your note that the two modes look the same is fair — today it hides some atmosphere and
tightens spacing. It should be a different **document**:

- No motion, no WebGL, no smooth scroll. Instant.
- Single dense column, no era scenes, no media.
- The Timeline collapses to a **dated table** — the same content as a scannable list.
- Every "read more" becomes the content itself. Fewer clicks, no discovery.

Default: an experience. Recruiter Mode: a document. Right now both are a website.

---

## 9. Applied per page

| Page | Changes |
|---|---|
| **Home** | Pinned hero; headline sets line by line; status strip acquires; featured projects arrive on velocity. |
| **Timeline** | §7, in full. The hero. |
| **Projects** | Mask reveals, magnetic hover, WebGL displacement on card imagery, animated filtering. |
| **Case study** | Architecture diagram pinned and drawing as you scroll it; metrics roll. |
| **Skills** | Bars grow on entry; category headings line-split. |
| **Analytics** | Heatmap fills column by column; stat tiles count up. |
| **Knowledge** | Mask reveals; results arrive on velocity. |
| **Résumé** | **Nothing.** It is a document and it prints. |

---

## 10. Still not doing, and why

- **Whole-page horizontal scroll** — fights the scrollbar, breaks trackpads, miserable on
  mobile. The transport bar gives the same feeling without hijacking scrolling.
- **Replacing the system cursor** — breaks affordances and hurts accessibility. G augments
  instead.
- **A blocking page-load intro** — a recruiter with thirty tabs will not wait through a
  logo, and every second is a second before your work is visible. The acquire language
  already gives arrival a character.

---

## 11. Order

| | Stage | Review |
|---|---|---|
| 1 | Motion tiers + Lenis + velocity + mask reveal + line-split + glyph acquire — **Home only** | **Yes — is the character right?** |
| 2 | Cursor field + companion | **Yes — right intensity?** |
| 3 | Timeline transport bar | **Yes — does it feel operable?** |
| 4 | Timeline era scenes + cards + hue reaction | **Yes** |
| 5 | Remaining pages | No |
| 6 | Recruiter Mode as a document | **Yes** |
| 7 | Real-phone performance pass | Report |

Stage 1 answers one question — *is this the right character* — before six stages are
built on top of it.
