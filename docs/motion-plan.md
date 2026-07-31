# Motion and UI plan — the second pass

Written after the references were rejected as "still boring". This is the plan for
approval **before** any of it is built, because building a visual phase blind has now
been wrong twice.

---

## 1. What I got wrong

My motion was **incremental**: things fade a little and translate a little. Correct
engineering, no character. The references share something my version has none of:

**Motion that reads as a mechanism, not as decoration.** In Far Cry 2 the menu is a map
and a notebook — you are not navigating a UI, you are operating an object. On bamlab and
trionn, scrolling does not move a page past you; it **advances a state** inside a scene
that is holding still.

That is the difference, and it is not a matter of longer durations or bigger distances.
It is a different model of what scrolling *is*.

The second mistake: I optimised for cost before character. Native scroll-driven CSS is
the cheapest correct thing, so I used it everywhere — and cheap-and-correct is exactly
what "normal boring" means.

---

## 2. The idea everything hangs off

**The site behaves like an instrument.**

It already claims to be mission control. So nothing should *fade in* — things should
**acquire**, the way a readout locks on: a sweep, a settle, a confirmation. The Timeline
is not a page you scroll, it is a mechanism you operate with a scrub bar.

This matters because "add nice animations" with no organising idea is precisely how a
site ends up generic. Every move below is justified by that one sentence, and anything
that cannot be is not in the plan.

---

## 3. The foundation: smooth scroll

**Add Lenis (~3KB gzipped).**

This is the single biggest difference between my version and every site referenced, and
nothing else in this plan lands without it. Native scroll is stepped and mechanical;
inertial scroll makes every downstream animation feel expensive because motion continues
and decays rather than stopping dead with the wheel.

It also unlocks **scroll velocity** as an input, which §4 uses repeatedly.

Costs: ~3KB, and one `requestAnimationFrame` loop. It respects
`prefers-reduced-motion` by disabling itself, and Recruiter Mode will turn it off.

---

## 4. The motion vocabulary

Six named moves, used everywhere, so the site feels like one thing. Currently every page
invents its own entrance.

### A. Mask reveal — replaces every fade

Content is uncovered by a moving `clip-path` edge rather than changing opacity. Text
lines wipe up from behind an invisible rule; images uncover from one edge.

*Why:* fading is the cheapest possible reveal and reads as such. A mask reads as
something being *drawn*, which is the instrument idea, and it is what every reference
site uses instead of opacity.

### B. Line-split headings

Headings split into lines, each line masked and rising with a 40ms stagger.

*Why:* a heading arriving as one block is a div moving. Arriving as lines is typesetting,
and it is the single most recognisable "high-end site" signal there is.

### C. Velocity skew

While scrolling fast, cards skew and scale by a few degrees proportional to scroll
velocity, settling to zero when it stops.

*Why:* almost free, and it is most of why award-tier sites feel physical — the page has
mass. Capped hard so it never becomes nausea.

### D. Pinned scenes

Key sections `position: sticky` for a screen or two while their **contents** advance —
scroll does not move the section, it moves time inside it.

*Why:* this is the Far Cry 2 book. It is the difference between reading a page and
operating a thing.

### E. Counter and glyph settle

Numbers roll to their value; monospace labels resolve through a brief character scramble.

*Why:* the readout-locking-on idea made literal. Used sparingly — the analytics stat
tiles and the timeline year markers — because it is a trick that stops being charming the
fourth time.

### F. Magnetic hover

Buttons and cards translate slightly *toward* the cursor within a small radius.

*Why:* makes a page feel responsive to you rather than waiting for you.

---

## 5. The cursor ripple

**A full-viewport WebGL layer that writes cursor movement into a velocity field, decays
it, and uses it to displace and tint the ambient light.**

The ambient warm/cool fields already exist as flat CSS gradients. This makes them a
surface that reacts: moving the cursor pushes colour outward in a ripple that settles.

*Why this and not brittanychiang's spotlight:* a radial gradient following the pointer is
a **position** effect — static, and everywhere. A flowmap is a **motion** effect: it
remembers where you moved and decays, so fast movement leaves a wake and stillness leaves
nothing. That is the difference between "there is a glow near my mouse" and "the surface
responded to me".

Implementation: raw WebGL, two ping-pong textures, ~120 lines and ~4KB. **No Three.js**
— it would be 150KB for a full-screen quad.

Constraints, because a cursor effect is exactly where a portfolio goes wrong:
- Disabled entirely on touch (no cursor to follow) and under reduced motion / Recruiter
  Mode.
- Half-resolution buffer, capped at 30fps, paused when the tab is hidden.
- Behind everything, at low alpha. **If it is the first thing you notice, it is wrong.**
- Falls back to today's static gradients if WebGL is unavailable.

---

## 6. The Timeline

The signature page, and it needs the most.

### 6a. The scrub bar — replacing the column scrubber

A **persistent thin line** across the bottom, behaving like a video scrub bar:

- Drag the playhead left/right → the timeline scrolls vertically. A horizontal control
  driving vertical travel is what makes it read as a *transport* rather than a scrollbar.
- Era boundaries are ticks along the line; the current era's segment is lit.
- Hovering anywhere shows the year at that point.
- The playhead tracks scroll position when not being dragged.
- Keyboard: arrows step by item, Home/End jump to the ends.

*Why this over the bar-chart columns:* the columns were an information graphic pretending
to be a control — they showed density but afforded nothing. A line with a playhead says
"drag me" without a label, and it is the one component that makes the whole page feel
operable.

### 6b. Era transitions as scenes

Each era gets a pinned title card: the name at full-bleed scale, held for roughly a
screen of scroll while the previous era's cards clear and the new era's first cards
arrive. Between eras the ambient light shifts hue slightly.

*Why:* this is what "travelling through a life" actually requires. Chapters need a
threshold you cross, not a heading you scroll past.

### 6c. Cards, revised

Keep the depth approach but change the character: **cards arrive along the path** rather
than straight out of the screen, with the media revealed by a mask (§4A) a beat after the
card lands. The still moment stays.

### 6d. Media as the anchor

Real project screenshots and video demos, larger than now, with the play affordance
meaning something — clicking opens the demo rather than the case study.

---

## 7. Applied per page

| Page | What changes |
|---|---|
| **Home** | Pinned hero: the headline sets line by line while the status strip acquires. Featured projects arrive on velocity. |
| **Projects** | Mask reveals on cards; magnetic hover; the tag filter animates the grid rather than snapping. |
| **Case study** | Pinned architecture diagram that draws as you scroll past it, rather than once on entry. Metrics roll. |
| **Skills** | Bars grow on entry; category headings line-split. |
| **Analytics** | Heatmap fills column by column on entry; stat tiles count up. |
| **Knowledge** | Mask reveals; search results animate in on velocity. |
| **Timeline** | §6, in full. |
| **Résumé** | **Nothing.** It is a document. Motion there is noise, and it prints. |

---

## 8. Costs, honestly

| | Size | Note |
|---|---|---|
| Lenis | ~3KB | The foundation. Non-negotiable for this look. |
| WebGL ripple | ~4KB | Raw WebGL. No Three.js. |
| Motion | already installed | No new dependency. |
| **GSAP / ScrollTrigger** | **not adding** | Motion plus native scroll-driven CSS covers it. Adding a second animation engine is 50KB to do what is already there. |

**~7KB total.** That is the entire budget for this, and it is less than one photograph.

Three rules kept from before, because they are what keep this defensible rather than
indulgent:

1. `transform` and `opacity` only, per frame. Everything else is layout or paint.
2. Every effect stops completely under `prefers-reduced-motion` and Recruiter Mode.
   Stops — not shortens.
3. Nothing loops. Every animation resolves and then holds still.

And one new one: **frame budget measured on a mid-range phone, not this machine.** If the
timeline drops frames on a five-year-old Android, the effect is not working, however good
it looks here.

---

## 9. What I am deliberately not proposing

- **A page-load intro animation.** A recruiter with thirty tabs open does not wait
  through a logo. Every second of it is a second before your work is visible.
- **Horizontal scroll for the whole timeline.** It fights the scrollbar, breaks on
  trackpads, and is miserable on mobile. The scrub bar delivers the same "transport"
  feeling without hijacking scrolling.
- **A custom cursor replacing the system one.** It breaks affordances and hurts
  accessibility. Magnetic hover gets the same feeling honestly.
- **WebGL image distortion on hover.** One effect too many — the ripple already carries
  the "surface reacts" idea, and repeating it makes both look cheaper.

---

## 10. Order, with review points

Staged so you judge direction early rather than after everything is built.

| | Stage | Review |
|---|---|---|
| 1 | Lenis + velocity + mask reveal + line-split, applied to **Home only** | **Yes — is the character right?** |
| 2 | Cursor ripple | **Yes — subtle enough?** |
| 3 | Timeline: scrub bar | **Yes — does it feel operable?** |
| 4 | Timeline: pinned era scenes + revised cards | **Yes** |
| 5 | Propagate to the remaining pages | No |
| 6 | Performance pass on a real phone | Report |

Stage 1 exists to answer one question — *is this the right character* — before four more
stages are built on top of it.
