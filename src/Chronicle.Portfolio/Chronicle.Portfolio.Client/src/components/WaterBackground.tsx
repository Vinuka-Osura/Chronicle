"use client";

import { useEffect, useRef } from "react";
import { RENDER, SIMULATE, VERTEX } from "@/lib/water/shaders";

/**
 * The page background: a body of water seen from above.
 *
 * The cursor draws lines in it — a thread when you move slowly, a gash when you flick —
 * and a click drops a stone. Everything else on the site sits on top of this, so it is
 * deliberately low-contrast: a surface with weather, not a picture competing with the
 * text laid over it.
 *
 * **It never has to run.** `<body>` carries a still gradient in the same colours, so the
 * page is correct before this mounts, if WebGL is missing, if the context is lost, and
 * in Recruiter Mode — where the whole thing is skipped on purpose, and the stillness is
 * the point rather than a fallback.
 *
 * Cost is bounded by construction. The simulation runs on a fixed grid (~440px on the
 * long edge) whatever the window size, so a 4K monitor costs the same as a laptop, and
 * the render pass is capped at 1.5× device pixel ratio. It pauses on tab hide.
 */
export function WaterBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const root = document.documentElement;
    // `still` is Recruiter Mode or prefers-reduced-motion. Both mean: do not start.
    // `reduced` is a weak device, which still gets water — it is the site's identity —
    // but a coarser grid and one step per frame.
    if (root.dataset.motion === "still") return;

    const thrifty = root.dataset.motion === "reduced";

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      // The compositor can skip a copy when it knows nothing reads the buffer back.
      preserveDrawingBuffer: false,
    });

    // No WebGL2, or a float-renderable texture is unavailable: the still background is
    // already on screen and is a perfectly good page. Leave it.
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const link = (fragmentSource: string) => {
      const vertex = compile(gl.VERTEX_SHADER, VERTEX);
      const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
      if (!vertex || !fragment) return null;

      const program = gl.createProgram();
      if (!program) return null;
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.bindAttribLocation(program, 0, "aPos");
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        return null;
      }
      return program;
    };

    const simulateProgram = link(SIMULATE);
    const renderProgram = link(RENDER);
    if (!simulateProgram || !renderProgram) return;

    // One triangle that covers the viewport. Two would add a seam along the diagonal
    // where the GPU rasterises the shared edge twice.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const uniform = (program: WebGLProgram, name: string) =>
      gl.getUniformLocation(program, name);

    const sim = {
      prev: uniform(simulateProgram, "uPrev"),
      size: uniform(simulateProgram, "uSize"),
      pointer: uniform(simulateProgram, "uPointer"),
      pointerPrev: uniform(simulateProgram, "uPointerPrev"),
      pointerForce: uniform(simulateProgram, "uPointerForce"),
      pointerRadius: uniform(simulateProgram, "uPointerRadius"),
      click: uniform(simulateProgram, "uClick"),
      clickRadius: uniform(simulateProgram, "uClickRadius"),
      damping: uniform(simulateProgram, "uDamping"),
    };

    const draw = {
      sim: uniform(renderProgram, "uSim"),
      size: uniform(renderProgram, "uSize"),
      resolution: uniform(renderProgram, "uResolution"),
      time: uniform(renderProgram, "uTime"),
      deep: uniform(renderProgram, "uDeep"),
      shallow: uniform(renderProgram, "uShallow"),
      crest: uniform(renderProgram, "uCrest"),
      glint: uniform(renderProgram, "uGlint"),
      live: uniform(renderProgram, "uLive"),
      contrast: uniform(renderProgram, "uContrast"),
    };

    /* ---------------------------------------------------------------- palette --- */

    /*
      The colours live in CSS, not here.

      `globals.css` is already the single source of truth for the theme, and the still
      `<body>` gradient has to match the canvas exactly or the handover would be a
      visible flash. Reading the same custom properties guarantees they cannot drift.
    */
    const parse = (value: string): [number, number, number] => {
      const hex = value.trim().replace("#", "");
      if (hex.length !== 6) return [0, 0, 0];
      return [
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255,
      ];
    };

    let deep: [number, number, number] = [0, 0, 0];
    let shallow: [number, number, number] = [0, 0, 0];
    let crest: [number, number, number] = [1, 1, 1];
    let glint: [number, number, number] = [1, 1, 1];
    let contrast = 1.6;

    const readPalette = () => {
      const style = getComputedStyle(root);
      deep = parse(style.getPropertyValue("--water-deep"));
      shallow = parse(style.getPropertyValue("--water-shallow"));
      crest = parse(style.getPropertyValue("--water-crest"));
      glint = parse(style.getPropertyValue("--water-glint"));
      contrast = Number(style.getPropertyValue("--water-contrast")) || 1.6;
    };

    readPalette();

    /* ------------------------------------------------------------ simulation --- */

    // Fixed grid. The window can be any size; this cannot, or a wide monitor would pay
    // for water nobody is looking at.
    const GRID = thrifty ? 260 : 440;
    let simWidth = GRID;
    let simHeight = GRID;

    let textures: WebGLTexture[] = [];
    let targets: WebGLFramebuffer[] = [];
    let front = 0;

    const disposeTargets = () => {
      for (const texture of textures) gl.deleteTexture(texture);
      for (const target of targets) gl.deleteFramebuffer(target);
      textures = [];
      targets = [];
    };

    const createTargets = () => {
      disposeTargets();

      for (let index = 0; index < 2; index++) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA16F,
          simWidth,
          simHeight,
          0,
          gl.RGBA,
          gl.HALF_FLOAT,
          null,
        );
        // CLAMP, not REPEAT: a ripple reaching the edge should stop, not reappear on
        // the far side of the screen.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        const target = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, target);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          texture,
          0,
        );
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (texture) textures.push(texture);
        if (target) targets.push(target);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    /* ---------------------------------------------------------------- sizing --- */

    let viewWidth = 1;
    let viewHeight = 1;

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, thrifty ? 1 : 1.5);

      viewWidth = Math.max(1, Math.round(width * ratio));
      viewHeight = Math.max(1, Math.round(height * ratio));
      canvas.width = viewWidth;
      canvas.height = viewHeight;

      // Match the grid to the window's shape. A square grid on a 16:9 window would
      // propagate waves faster horizontally, and every ripple would be an ellipse.
      const aspect = width / Math.max(height, 1);
      if (aspect >= 1) {
        simWidth = GRID;
        simHeight = Math.max(64, Math.round(GRID / aspect));
      } else {
        simHeight = GRID;
        simWidth = Math.max(64, Math.round(GRID * aspect));
      }

      createTargets();
    };

    resize();

    /* --------------------------------------------------------------- pointer --- */

    let pointerX = 0.5;
    let pointerY = 0.5;
    /*
      Where the pointer was at the END OF THE LAST FRAME, not at the last event.

      Several pointermove events land between two frames. Advancing this on each event
      would leave the shader drawing only the final hop, so a fast movement would come
      out as a dotted trail with the gaps in between untouched — precisely the case the
      effect is meant to look best in.
    */
    let pointerPrevX = 0.5;
    let pointerPrevY = 0.5;
    let pointerForce = 0;
    let pointerRadius = 6;
    /** Separate from the frame anchor above: speed is per event, the line is per frame. */
    let lastEventX = 0.5;
    let lastEventY = 0.5;
    let lastMoveTime = 0;
    let moved = false;

    let clickX = 0.5;
    let clickY = 0.5;
    let clickForce = 0;

    /** Fastest cursor speed, in px/ms, that still increases the size of the wake. */
    const TOP_SPEED = 3.2;

    const onPointerMove = (event: PointerEvent) => {
      const now = event.timeStamp;
      const x = event.clientX / window.innerWidth;
      // Flipped: the texture's origin is bottom-left, the window's is top-left.
      const y = 1 - event.clientY / window.innerHeight;

      if (!moved) {
        pointerX = pointerPrevX = lastEventX = x;
        pointerY = pointerPrevY = lastEventY = y;
        lastMoveTime = now;
        moved = true;
        return;
      }

      const dt = Math.max(now - lastMoveTime, 1);
      const dx = (x - lastEventX) * window.innerWidth;
      const dy = (y - lastEventY) * window.innerHeight;
      const speed = Math.hypot(dx, dy) / dt;

      pointerX = x;
      pointerY = y;
      lastEventX = x;
      lastEventY = y;
      lastMoveTime = now;

      // Squared, so the difference between a drift and a flick is dramatic rather than
      // proportional. This is the whole character of the effect: slow leaves a thread,
      // fast tears the surface.
      const eased = Math.min(speed / TOP_SPEED, 1) ** 2;

      pointerForce = 0.035 + eased * 0.52;
      pointerRadius = 3.5 + eased * 20;
    };

    const onPointerDown = (event: PointerEvent) => {
      clickX = event.clientX / window.innerWidth;
      clickY = 1 - event.clientY / window.innerHeight;
      clickForce = 0.95;
    };

    // Passive: this never calls preventDefault, and saying so keeps it off the
    // browser's scroll-blocking path.
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    /* ------------------------------------------------------------------ loop --- */

    let frame = 0;
    let live = 0;
    let startTime: number | null = null;
    let running = true;

    const step = (time: number) => {
      if (!running) return;
      frame = requestAnimationFrame(step);

      if (startTime === null) startTime = time;
      const elapsed = (time - startTime) / 1000;

      // Ease the surface up over the first second rather than snapping it on.
      live = Math.min(1, live + 0.02);

      const substeps = thrifty ? 1 : 2;

      /*
        Did the pointer travel, or did it teleport?

        Leaving the window and coming back somewhere else, switching tabs, or a
        dropped frame all produce one enormous step. Drawing a segment across it
        gashes the whole screen in a single frame — an effect nobody triggered and
        which looks like a rendering fault. Past a third of the viewport we re-anchor
        instead of drawing, which costs one skipped wake and removes the artefact.
      */
      const travelled = Math.hypot(pointerX - pointerPrevX, pointerY - pointerPrevY);
      const teleported = travelled > 0.33;

      gl.useProgram(simulateProgram);
      gl.uniform2f(sim.size, simWidth, simHeight);
      // 0.982 kept a wake alive long enough to cross the whole screen and meet itself
      // coming back. This settles in a couple of seconds, which is what water does.
      gl.uniform1f(sim.damping, 0.968);
      gl.uniform1i(sim.prev, 0);
      gl.viewport(0, 0, simWidth, simHeight);

      for (let index = 0; index < substeps; index++) {
        // Disturbances are injected once, on the first substep. Injecting on every one
        // would make the wake `substeps` times deeper on a fast machine than a slow
        // one — the effect would literally change shape with the frame rate.
        const first = index === 0;

        gl.uniform2f(sim.pointer, pointerX, pointerY);
        gl.uniform2f(sim.pointerPrev, pointerPrevX, pointerPrevY);
        gl.uniform1f(sim.pointerForce, first && !teleported ? pointerForce : 0);
        gl.uniform1f(sim.pointerRadius, pointerRadius);
        gl.uniform3f(sim.click, clickX, clickY, first ? clickForce : 0);
        gl.uniform1f(sim.clickRadius, 26);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[front]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, targets[1 - front]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        front = 1 - front;
      }

      // Both decay to nothing, so a cursor that stops leaves a wake that spreads and
      // fades instead of a permanent groove.
      pointerPrevX = pointerX;
      pointerPrevY = pointerY;
      pointerForce *= 0.55;
      if (pointerForce < 0.004) pointerForce = 0;
      clickForce *= 0.42;
      if (clickForce < 0.004) clickForce = 0;

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, viewWidth, viewHeight);
      gl.useProgram(renderProgram);
      gl.uniform1i(draw.sim, 0);
      gl.uniform2f(draw.size, simWidth, simHeight);
      gl.uniform2f(draw.resolution, viewWidth, viewHeight);
      gl.uniform1f(draw.time, elapsed);
      gl.uniform3f(draw.deep, deep[0], deep[1], deep[2]);
      gl.uniform3f(draw.shallow, shallow[0], shallow[1], shallow[2]);
      gl.uniform3f(draw.crest, crest[0], crest[1], crest[2]);
      gl.uniform3f(draw.glint, glint[0], glint[1], glint[2]);
      gl.uniform1f(draw.live, live);
      gl.uniform1f(draw.contrast, contrast);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[front]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      canvas.dataset.ready = "true";
    };

    frame = requestAnimationFrame(step);

    /* --------------------------------------------------------------- upkeep --- */

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      // Recreating two float textures on every resize event would stutter the whole
      // window drag.
      resizeTimer = window.setTimeout(resize, 140);
    };
    window.addEventListener("resize", onResize);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        // Reset the clock, or the drift jumps forward by however long the tab was away.
        startTime = null;
        frame = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Theme and Recruiter Mode are attributes on <html>; watching them is how every
    // other client component here stays in step without a provider.
    const appearance = new MutationObserver(() => {
      readPalette();
      if (root.dataset.motion === "still") {
        running = false;
        cancelAnimationFrame(frame);
        delete canvas.dataset.ready;
      } else if (!running && !document.hidden) {
        running = true;
        frame = requestAnimationFrame(step);
      }
    });
    appearance.observe(root, { attributeFilter: ["data-theme", "data-motion"] });

    // A lost context on a laptop waking from sleep is normal, not exceptional. Stop
    // cleanly and let the still background carry the page.
    const onContextLost = (event: Event) => {
      event.preventDefault();
      running = false;
      cancelAnimationFrame(frame);
      delete canvas.dataset.ready;
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      appearance.disconnect();
      disposeTargets();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(simulateProgram);
      gl.deleteProgram(renderProgram);
    };
  }, []);

  return <canvas ref={canvasRef} className="water" aria-hidden />;
}
