/* ============================================================
   nsquareai redesign — interactions v3
   GSAP + ScrollTrigger + SplitText + Lenis engine when loaded
   (index.html); graceful vanilla fallback otherwise (about.html,
   CDN failure, reduced motion).
   ============================================================ */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const gsapReady = !!(window.gsap && window.ScrollTrigger);
const engineOn = gsapReady && !reduceMotion;
const splitOn = engineOn && !!window.SplitText;

if (gsapReady) {
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
}
if (engineOn) document.documentElement.classList.add('gsap-on');

/* ── Lenis smooth scroll (desktop only) ── */
let lenis = null;
let lenisVel = 0;
if (engineOn && finePointer && window.innerWidth >= 760 && window.Lenis) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', (e) => { lenisVel = Number.isFinite(e.velocity) ? e.velocity : 0; ScrollTrigger.update(); });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
}

/* ── Smooth anchor scrolling (works with Lenis) ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (ev) => {
    const id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    ev.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -60, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});

/* ── Progress hairline ── */
const rail = document.querySelector('.progress-rail > i');
if (rail && engineOn) {
  const toProgress = gsap.quickTo(rail, 'scaleX', { duration: 0.25, ease: 'power2.out' });
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => toProgress(self.progress) });
}
function updateRail() {
  if (!rail || engineOn) return;
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  rail.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
}

/* ── Nav frosted-on-scroll ── */
const nav = document.querySelector('.nav');
function updateNav() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 30); }

/* ── Mobile menu ── */
const burger = document.querySelector('.nav-burger');
const mobileNav = document.querySelector('.nav-mobile');
if (burger && mobileNav) {
  burger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }));
}

/* ============================================================
   HERO — chaos → flow
   Engine: one continuously scrubbed timeline (chips drift along
   curved paths, headlines crossfade, chapter rail fills).
   Fallback: discrete chapter thresholds as before.
   ============================================================ */
const hero = document.querySelector('.hero');
// keep in sync with the mobile-nav breakpoint (<=900). Below that width the
// hero still animates (see heroMobile/buildMobileHero) with its own
// typography-led beat sequence — only reduced-motion, or a narrow screen
// where GSAP failed to load, falls back to the fully static resolved state.
const isNarrow = window.innerWidth < 901;
const heroStatic = reduceMotion || (isNarrow && !engineOn);
const heroMobile = isNarrow && !heroStatic;
let heroProgress = 0; // shared with the particle field

// desktop scrub chapters (chaos / fix / flow). Mobile no longer uses this —
// it runs its own five-beat scrubbed master timeline (buildMobileHero).
const heroBeats = [0.34, 0.72];

if (hero) {
  if (heroStatic) {
    hero.classList.add('hero--static');
    hero.dataset.chapter = '2';
  } else {
    hero.dataset.chapter = '0';
    if (heroMobile) hero.classList.add('hero--mobile');
  }
}

function chapterFor(p) {
  for (let i = 0; i < heroBeats.length; i++) { if (p < heroBeats[i]) return String(i); }
  return String(heroBeats.length);
}

/* Desktop: chaos → flow chip choreography (unchanged from before the
   mobile split — verbatim except the old heroMobile chip-restage branch,
   which is gone because mobile no longer builds chips at all). */
function buildDesktopHero(hero, chips) {
  const lines = { l0: hero.querySelector('.hl-0'), l1: hero.querySelector('.hl-1'), l2: hero.querySelector('.hl-2') };

  gsap.set(lines.l0, { autoAlpha: 1, y: 0 });
  gsap.set([lines.l1, lines.l2], { autoAlpha: 0, y: 26 });

  // idle float on chips via --fy (composes with the scrub through calc())
  chips.forEach((chip, i) => {
    gsap.set(chip, { '--fy': '0px', '--sc': 1, '--op': 1, '--box': 1, '--orb': 0, '--orb-sc': 0.4 });
    gsap.fromTo(chip,
      { '--fy': `${-5 - (i % 3) * 2}px` },
      { '--fy': `${5 + (i % 3) * 2}px`, duration: 2.2 + i * 0.35, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      onUpdate(self) {
        heroProgress = self.progress;
        const ch = chapterFor(self.progress);
        if (hero.dataset.chapter !== ch) hero.dataset.chapter = ch;
      },
    },
  });

  // chapter rail fill
  tl.fromTo('.ch-rail i', { scaleY: 0 }, { scaleY: 1, duration: 1, ease: 'none' }, 0);

  // chips condense into energy orbs that get absorbed into the flow (starts sooner)
  chips.forEach((chip, i) => {
    const at = 0.03 + i * 0.015;
    const collapse = chip.style.getPropertyValue('--collapse').trim() || '0px';
    // slide toward the pipeline core and shrink
    tl.to(chip, { '--x': '0px', duration: 0.16, ease: 'power2.inOut' }, at);
    tl.to(chip, { '--y': collapse, duration: 0.16, ease: 'power2.in' }, at);
    tl.to(chip, { '--rot': '0deg', '--sc': 0.4, duration: 0.16, ease: 'power1.in' }, at);
    // the card dissolves as a teal orb ignites in its place
    tl.to(chip, { '--box': 0, duration: 0.09, ease: 'power1.in' }, at + 0.03);
    tl.to(chip, { '--orb': 1, '--orb-sc': 1, duration: 0.07, ease: 'back.out(2.2)' }, at + 0.05);
    // orb is pulled into the flow and vanishes
    tl.to(chip, { '--orb': 0, '--orb-sc': 1.8, duration: 0.1, ease: 'power1.in' }, at + 0.13);
    tl.to(chip, { '--op': 0, duration: 0.03 }, at + 0.22);
  });

  // headline crossfades
  tl.to(lines.l0, { autoAlpha: 0, y: -26, duration: 0.08, ease: 'power1.in' }, 0.24);
  tl.to(lines.l1, { autoAlpha: 1, y: 0, duration: 0.08, ease: 'power1.out' }, 0.31);
  tl.to(lines.l1, { autoAlpha: 0, y: -26, duration: 0.08, ease: 'power1.in' }, 0.60);
  tl.to(lines.l2, { autoAlpha: 1, y: 0, duration: 0.09, ease: 'power1.out' }, 0.68);

  // scroll hint fades once flow is reached
  tl.to('.hero__hint', { autoAlpha: 0, duration: 0.06 }, 0.70);

  /* ── Intro sequence on load ── */
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro.from('.hero__eyebrow', { autoAlpha: 0, y: 14, duration: 0.7 }, 0.15)
       .from('.hero__sub', { autoAlpha: 0, y: 18, duration: 0.8 }, 0.45)
       .from('.hero__cta > *', { autoAlpha: 0, y: 16, stagger: 0.08, duration: 0.7 }, 0.6)
       .from('.hero__chapters', { autoAlpha: 0, x: -14, duration: 0.7 }, 0.7)
       .fromTo(chips, { '--op': 0, '--sc': 0.82 }, { '--op': 1, '--sc': 1, stagger: 0.06, duration: 0.6 }, 0.35);

  // headline: masked line rise once fonts are ready
  if (splitOn) {
    document.fonts.ready.then(() => {
      SplitText.create(lines.l0, {
        type: 'lines', mask: 'lines',
        onSplit(self) {
          return gsap.from(self.lines, { yPercent: 115, duration: 1, stagger: 0.1, ease: 'power4.out', delay: 0.1 });
        },
      });
    });
  }
}

/* Mobile: one sticky stage scrubbed by ONE master timeline — the mirror of
   the desktop chaos→flow scrub, and deliberately the same THREE chapters so
   the two don't read as different sites. Scroll position physically drives
   every element: masked headline words rise in and exit through the top,
   alert chips dissolve into orbs that dive into the particle stream, one
   message surfaces behind the type, and the payoff bloom rises — so scrubbing
   back and forth plays the story forward and backward. Native position:sticky
   does the pinning (no ScrollTrigger pin → no mobile pin-jank) and the canvas
   field reads heroProgress every frame, exactly like desktop. */
function buildMobileHero(hero) {
  const heroM = hero.querySelector('.hero-m');
  const stage = heroM && heroM.querySelector('.hero-m__stage');
  if (!stage) return;

  ScrollTrigger.config({ ignoreMobileResize: true });
  heroM.dataset.beat = '0';

  const beats  = [...heroM.querySelectorAll('.hm-beat')];
  const lines  = beats.map((b) => b.querySelector('.hm-line'));
  const ghosts = [...heroM.querySelectorAll('.hg')];
  const copy   = heroM.querySelector('.hero-m__copy');
  const sub    = heroM.querySelector('.hm-sub');
  const cta    = heroM.querySelector('.hm-cta');
  const meterFill = heroM.querySelector('.hero-m__meter > i');

  const story     = heroM.querySelector('.hero-m__story');
  const chips     = [...story.querySelectorAll('.st-alert')];
  const chipCards = chips.map((c) => c.querySelector('.st-alert-card'));
  const chipOrbs  = chips.map((c) => c.querySelector('.st-alert-orb'));
  const msg       = story.querySelector('.st-msg');
  const bubble    = story.querySelector('.st-msg-bubble');
  const ping      = story.querySelector('.st-msg-ping');
  const bloom     = story.querySelector('.st-bloom');

  const vh = () => stage.clientHeight || window.innerHeight;
  const vw = () => stage.clientWidth || window.innerWidth;

  // from-states (transform/opacity only — filters are what caused the old
  // mobile scroll jank). Containers hidden by html.gsap-on come alive here.
  gsap.set(chips,     { xPercent: -50, yPercent: -50 });
  gsap.set(chipOrbs,  { autoAlpha: 0, scale: 0.4 });
  gsap.set(msg,       { autoAlpha: 1 });
  gsap.set(bubble,    { autoAlpha: 0 });
  gsap.set(ping,      { autoAlpha: 0 });
  gsap.set(bloom,     { xPercent: -50, yPercent: -50 });
  gsap.set(ghosts,    { xPercent: -50, yPercent: -50, autoAlpha: 0 });
  gsap.set(sub,       { autoAlpha: 0, y: 26 });
  gsap.set(cta,       { autoAlpha: 0, y: 22 });

  // fonts first so SplitText measures real glyphs
  document.fonts.ready.then(() => {
    // masked word splits (fallback: whole-line fade when SplitText is absent)
    const words = lines.map((line) => {
      gsap.set(line, { autoAlpha: 1 });
      return splitOn ? SplitText.create(line, { type: 'words', mask: 'words' }).words : null;
    });
    words.forEach((w, i) => {
      if (w) gsap.set(w, { yPercent: 120 });
      else gsap.set(lines[i], { autoAlpha: 0, y: 34 });
    });

    const wordsIn = (tl, i, at) => {
      if (words[i]) tl.fromTo(words[i], { yPercent: 120 }, { yPercent: 0, duration: 0.75, stagger: 0.085, ease: 'power3.out' }, at);
      else tl.fromTo(lines[i], { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, at);
    };
    const wordsOut = (tl, i, at) => {
      if (words[i]) tl.to(words[i], { yPercent: -130, duration: 0.55, stagger: 0.06, ease: 'power2.in' }, at);
      else tl.to(lines[i], { autoAlpha: 0, y: -30, duration: 0.5, ease: 'power2.in' }, at);
    };

    // kinetic lean: the copy layer skews with scroll velocity, springs back
    const skewTo = gsap.quickTo(copy, 'skewY', { duration: 0.4, ease: 'power3' });
    const skewReset = gsap.delayedCall(0.15, () => skewTo(0)).pause();

    // landing mid-hero (reload/anchor): beat 0's words must start resolved,
    // or scrubbing back to the top would leave the opening line invisible
    const deepLoad = window.scrollY > vh() * 0.35;
    if (deepLoad) {
      if (words[0]) gsap.set(words[0], { yPercent: 0 });
      else gsap.set(lines[0], { autoAlpha: 1, y: 0 });
    }

    /* ── THE master timeline: 10 units of time ≡ the hero's scroll track ── */
    /* Three beats, mirroring the desktop's three chapters. The last one is the
       very END of the track on purpose: the hero only hands control back to
       the page at progress ~1, so a stop short of that would swallow every
       downward swipe and trap the reader on the payoff. */
    const BEAT_STOPS = [0, 0.46, 1];
    const nearestStop = (v) => BEAT_STOPS.reduce((a, b) =>
      Math.abs(b - v) < Math.abs(a - v) ? b : a);

    // declared up here: ScrollTrigger can fire onUpdate synchronously while
    // it refreshes during creation, which would hit the temporal dead zone
    let beatIx = 0;
    let stepping = false;

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: heroM,
        start: 'top top',
        end: 'bottom bottom',
        // low scrub: the step animation below supplies the easing, this just
        // keeps the render tracking it with a touch of trailing smoothness
        scrub: 0.3,
        invalidateOnRefresh: true,
        onUpdate(self) {
          heroProgress = self.progress;
          if (!stepping) beatIx = BEAT_STOPS.indexOf(nearestStop(self.progress));
          const b = String(BEAT_STOPS.indexOf(nearestStop(self.progress)));
          if (heroM.dataset.beat !== b) heroM.dataset.beat = b;
          skewTo(gsap.utils.clamp(-3.5, 3.5, self.getVelocity() / -420));
          skewReset.restart(true);
        },
      },
    });

    /* ══ DISCRETE BEAT CONTROL ═══════════════════════════════════════════
       One gesture = one beat, whatever its speed. Letting scroll drive the
       timeline directly — even with snapping bolted on — always left a way to
       come to rest halfway through an animation, because the finger position
       IS the playhead. So the hero consumes the gesture instead: any swipe or
       wheel tick past a small threshold animates the page to the next beat's
       exact offset over a fixed duration, and further input is ignored until
       it lands. The scrub still renders the motion, so the story plays out
       continuously between beats — it just can't be left half-told.
       At either end the gesture is released and the page scrolls normally. */
    const st = tl.scrollTrigger;
    const STEP_SECS = 0.8;   // time for one beat transition
    const SWIPE_PX  = 26;    // finger travel that counts as a swipe
    const WHEEL_PX  = 24;
    let touchY = 0, consumed = false, wheelAcc = 0, wheelLock = false;

    function goToBeat(i, force) {
      i = gsap.utils.clamp(0, BEAT_STOPS.length - 1, i);
      if (stepping || (!force && i === beatIx)) return;
      beatIx = i;
      stepping = true;
      const o = { y: window.scrollY };
      gsap.to(o, {
        y: st.start + (st.end - st.start) * BEAT_STOPS[i],
        duration: STEP_SECS, ease: 'power2.inOut', overwrite: true,
        onUpdate: () => window.scrollTo(0, o.y),
        onComplete: () => { stepping = false; },
      });
    }

    // does a gesture this way belong to the hero, or should the page have it?
    const engaged = (down) => st.enabled &&
      (down ? st.progress < 0.999 : st.progress > 0.001);

    heroM.addEventListener('touchstart', (e) => {
      touchY = e.touches[0].clientY;
      consumed = false;
    }, { passive: true });

    heroM.addEventListener('touchmove', (e) => {
      const dy = touchY - e.touches[0].clientY; // >0 → swiping up → forward
      if (!engaged(dy > 0)) return;             // at an end: let the page go
      e.preventDefault();                       // otherwise the hero owns it
      if (consumed || stepping || Math.abs(dy) < SWIPE_PX) return;
      consumed = true;
      goToBeat(beatIx + (dy > 0 ? 1 : -1));
    }, { passive: false });

    heroM.addEventListener('wheel', (e) => {
      const down = e.deltaY > 0;
      if (!engaged(down)) return;
      e.preventDefault();
      if (stepping || wheelLock) return;
      wheelAcc += e.deltaY;
      if (Math.abs(wheelAcc) < WHEEL_PX) return;
      wheelAcc = 0;
      wheelLock = true; // a trackpad sends a long tail — ignore it
      goToBeat(beatIx + (down ? 1 : -1));
      setTimeout(() => { wheelLock = false; }, STEP_SECS * 1000 + 200);
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      const down = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ';
      const up = e.key === 'ArrowUp' || e.key === 'PageUp';
      if ((!down && !up) || !engaged(down)) return;
      e.preventDefault();
      goToBeat(beatIx + (down ? 1 : -1));
    });

    /* One-shot: if the browser restores a mid-hero scroll position on reload,
       settle onto the nearest beat rather than opening on a half-played frame.
       Deliberately NOT a standing scroll listener — a persistent corrector
       fights the reader when they scroll back up into the hero from below,
       dragging them forward again just as they try to leave. */
    setTimeout(() => {
      if (!st.enabled || stepping || st.progress <= 0 || st.progress >= 1) return;
      const n = nearestStop(st.progress);
      if (Math.abs(n - st.progress) > 0.01) goToBeat(BEAT_STOPS.indexOf(n), true);
    }, 400);

    // continuous meter — the one element mapped 1:1 to scroll
    tl.fromTo(meterFill, { scaleX: 0 }, { scaleX: 1, duration: 10 }, 0);

    /* ghost type parallax: one oversized word per beat, drifting through the
       stage. Centres track the three beat stops (t 0 / 4.6 / 8.5). */
    const GHOST_AT = [0.8, 4.6, 8.3];
    const lastGhost = ghosts.length - 1;
    ghosts.forEach((g, i) => {
      const c = GHOST_AT[i] ?? (i * 4);
      const t0 = Math.max(0, c - 2.2);
      const t1 = Math.min(10, c + 2.2);
      const span = t1 - t0;
      if (i === lastGhost) {
        /* GROWTH is the payoff's backdrop rather than a passing accent: it
           eases to the centre of the stage and STAYS there, visible behind
           the copy, instead of drifting up and out like the others */
        tl.fromTo(g, { y: () => vh() * 0.28 }, { y: 0, duration: span, ease: 'power1.out' }, t0);
        tl.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: span * 0.45, ease: 'power1.in' }, t0);
      } else {
        tl.fromTo(g, { y: () => vh() * 0.55 }, { y: () => vh() * -0.6, duration: span }, t0);
        tl.fromTo(g, { autoAlpha: 0 }, { autoAlpha: 1, duration: span * 0.38, ease: 'power1.in' }, t0);
        tl.to(g, { autoAlpha: 0, duration: span * 0.38, ease: 'power1.out' }, t1 - span * 0.38);
      }
    });

    /* ═══ BEAT 0 → 1 · chaos becomes flow ═══
       every alert dissolves into an orb and dives into the stream band (62%
       down the stage, where the canvas lanes run) */
    wordsOut(tl, 0, 1.15);
    chips.forEach((chip, i) => {
      const fx = parseFloat(chip.style.getPropertyValue('--fx')) / 100;
      const fy = parseFloat(chip.style.getPropertyValue('--fy')) / 100;
      const at = 0.7 + i * 0.13;
      tl.to(chipCards[i], { autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, at);
      tl.to(chipOrbs[i],  { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, at + 0.08);
      // curved dive: x eases both ways, y accelerates in — reads as an arc
      tl.to(chip, { x: () => (0.5 - fx) * vw() * 0.7, duration: 0.95, ease: 'power1.inOut' }, at + 0.3);
      tl.to(chip, { y: () => (0.62 - fy) * vh(), duration: 0.95, ease: 'power2.in' }, at + 0.3);
      tl.to(chipOrbs[i], { scale: 2.1, autoAlpha: 0, duration: 0.22, ease: 'power1.in' }, at + 1.05);
    });
    /* the next line starts rising BEFORE the previous has finished leaving.
       With proximity snapping the user can come to rest anywhere, including
       mid-transition, so the two must overlap — a clean gap between them left
       a frame with no headline at all. */
    wordsIn(tl, 1, 1.5);

    /* the flow beat's quiet payload: the stream surfaces ONE real message
       behind the headline. Low alpha, no vertical travel — it fades up in
       place as depth behind the type, then fades out again. The ring collapses
       inward first (many signals resolving into one). Settled by t 4.6. */
    tl.fromTo(ping, { autoAlpha: 0, scale: 3.6 },
      { autoAlpha: 0.55, scale: 0.6, duration: 0.7, ease: 'power2.in' }, 2.9);
    tl.to(ping, { autoAlpha: 0, scale: 0.2, duration: 0.3, ease: 'power1.out' }, 3.6);
    tl.fromTo(bubble, { autoAlpha: 0, scaleX: 0.55, scaleY: 0.8 },
      { autoAlpha: 0.42, scaleX: 1, scaleY: 1, duration: 0.7, ease: 'power3.out' }, 3.5);

    /* ═══ BEAT 1 → 2 · flow becomes the payoff ═══ */
    wordsOut(tl, 1, 5.9);
    tl.to(bubble, { autoAlpha: 0, scale: 0.9, duration: 0.5, ease: 'power2.in' }, 5.8);
    tl.fromTo(bloom, { autoAlpha: 0, scale: 0.6, y: () => vh() * 0.18 },
      { autoAlpha: 1, scale: 1.06, y: 0, duration: 2.5, ease: 'power1.out' }, 6.3);
    /* spread across the back half so the payoff is still arriving most of the
       way through the final step, and lands just before it comes to rest */
    wordsIn(tl, 2, 6.1); // overlaps beat 1's exit — see the note above
    tl.to(sub, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 7.7);
    tl.to(cta, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 8.2);

    /* load intro — one-shot masked rise for the opening line (skipped mid-hero).
       The intro and the scrubbed master both write beat 0's word yPercent, and
       two owners on one property is a race: fonts.ready can resolve ~2s in on a
       cold load, so the user starts scrolling mid-intro and the words settle in
       mixed states (some still rising, some already exited) — which paints
       "First, the chaos." and "Then, flow." on top of each other. Keeping the
       master's trigger disabled until the intro hands off guarantees exactly
       one owner at every frame. */
    if (!deepLoad && tl.scrollTrigger) {
      let handedOff = false;
      function handOff() {
        if (handedOff) return;
        handedOff = true;
        if (intro.isActive()) intro.progress(1);
        tl.scrollTrigger.enable(); // renders at the live scroll position
        window.removeEventListener('scroll', handOff);
      }

      tl.scrollTrigger.disable(false); // false → leave the from-states in place
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: handOff });
      if (words[0]) intro.to(words[0], { yPercent: 0, duration: 1, stagger: 0.09, ease: 'power4.out' }, 0.2);
      else intro.to(lines[0], { autoAlpha: 1, y: 0, duration: 0.9 }, 0.2);
      intro.from('.hero-m__eyebrow', { autoAlpha: 0, y: 12, duration: 0.7 }, 0.45)
           .from('.hero-m__meter',   { autoAlpha: 0, duration: 0.7 }, 0.6)
           .from('.hm-hint',         { autoAlpha: 0, duration: 0.7 }, 0.7);
      // scrolled before the intro landed? finish it now and hand over cleanly
      window.addEventListener('scroll', handOff, { passive: true });
    }
  });
}

if (hero && !heroStatic && engineOn) {
  if (heroMobile) buildMobileHero(hero);
  else buildDesktopHero(hero, [...hero.querySelectorAll('.hero__field .chip')]);
}

/* fallback: discrete chapters on scroll */
function updateHero() {
  if (!hero || engineOn || hero.classList.contains('hero--static')) return;
  const track = hero.offsetHeight - window.innerHeight;
  const p = Math.min(Math.max((window.scrollY - hero.offsetTop) / track, 0), 1);
  heroProgress = p;
  const ch = chapterFor(p);
  if (hero.dataset.chapter !== ch) hero.dataset.chapter = ch;
}

/* ── One rAF-batched scroll loop (fallback duties + nav) ── */
let ticking = false;
function onScroll() {
  if (!ticking) {
    requestAnimationFrame(() => { updateRail(); updateNav(); updateHero(); ticking = false; });
    ticking = true;
  }
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
onScroll();

/* ============================================================
   Particle flow field — chaos organizes into streaming lanes
   as the hero scrub progresses. Vanilla canvas. Desktop gets the
   full field; mobile gets the same engine tuned down, plus two
   extra phases wired to its three story beats: RECEDE (after the
   flow beat the stream sinks below the copy, spreads and dims to
   background texture) and GROWTH (it softens further under the
   payoff bloom).
   ============================================================ */
(function initParticles() {
  const desktopCanvas = document.querySelector('.hero-canvas');
  const mobileCanvas = document.querySelector('.hero-m-canvas');
  const canvas = heroMobile ? mobileCanvas : desktopCanvas;
  const unused = heroMobile ? desktopCanvas : mobileCanvas;
  if (unused) unused.remove();
  if (!canvas) return;
  if (heroStatic || !engineOn || (!heroMobile && !finePointer)) { canvas.remove(); return; }

  const M = heroMobile;
  const ctx = canvas.getContext('2d');
  const N = M ? 60 : 140;
  const LINK = M ? 6400 : 8100; // px² constellation link radius
  const parts = [];
  let W = 0, H = 0;
  let mouseX = -9999, mouseY = -9999;
  let running = false, rafId = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, M ? 1.75 : 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  for (let i = 0; i < N; i++) {
    parts.push({
      x: Math.random() * 1600, y: Math.random() * 900, // rescaled to W/H on first frame
      ang: Math.random() * Math.PI * 2,
      speed: 0.42 + Math.random() * 0.62,
      r: (M ? 0.9 : 1.0) + Math.random() * (M ? 1.5 : 1.9),
      alpha: 0.3 + Math.random() * 0.52,
      lane: i % 3,
      laneSpeed: 1.1 + Math.random() * 1.4,
      seeded: false,
    });
  }

  if (!M) window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });

  const smooth = (a, b, t) => { const x = Math.min(Math.max((t - a) / (b - a), 0), 1); return x * x * (3 - 2 * x); };

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    const pr = heroProgress;
    const k = M ? smooth(0.09, 0.26, pr) : smooth(0.28, 0.7, pr); // chaos → flow
    // a speed surge as the message surfaces mid-flow. It no longer pinches the
    // lanes together — collapsing three lanes into one made a hard bright line
    // right under the type, and the spread-lane look is the part that works.
    const c = M ? smooth(0.26, 0.40, pr) : 0;
    // RECEDE: reserved for the payoff beat only, so the flow beat keeps full
    // punch. The stream sinks below the copy, spreads and dims to background
    // texture so the payoff headline, sub and CTA stay readable.
    const recede = M ? smooth(0.58, 0.76, pr) : 0;
    const g = M ? smooth(0.74, 0.92, pr) : 0;                     // growth
    // pushed DOWN, never up through the headline
    const laneBase = H * (M ? 0.62 + 0.20 * recede + 0.06 * g : 0.5);
    const laneGap = M ? 26 + 18 * recede + 8 * g : 30;
    const speedK = 1 + k * 1.6 + c * 0.8 - g * 0.9;
    const dim = M ? 1 - 0.62 * recede - 0.16 * g : 1;
    const streakK = M ? 1 - 0.45 * recede : 1; // shorter streaks once receded

    for (const p of parts) {
      if (!p.seeded) { p.x = Math.random() * W; p.y = Math.random() * H; p.seeded = true; }

      // chaotic wander
      p.ang += (Math.random() - 0.5) * 0.42;
      const wx = Math.cos(p.ang) * p.speed;
      const wy = Math.sin(p.ang) * p.speed;

      // flow: stream left → right in lanes (wave flattens as lanes converge)
      const laneY = laneBase + (p.lane - 1) * laneGap + Math.sin((p.x * 0.02) + p.lane * 2) * 4 * (1 - c * 0.6);
      const fx = p.laneSpeed * speedK;
      const fy = (laneY - p.y) * (0.06 + c * 0.06);

      p.x += wx * (1 - k) + fx * k;
      p.y += wy * (1 - k) + fy * k;

      // gentle mouse repel (desktop only — mouse stays parked on mobile)
      const dx = p.x - mouseX, dy = p.y - mouseY;
      const d2 = dx * dx + dy * dy;
      if (d2 < 14400 && d2 > 1) {
        const d = Math.sqrt(d2), f = (120 - d) / 120 * 1.4;
        p.x += (dx / d) * f; p.y += (dy / d) * f;
      }

      // wrap
      if (p.x > W + 24) p.x = -24;
      if (p.x < -24) p.x = W + 24;
      if (p.y > H + 24) p.y = -24;
      if (p.y < -24) p.y = H + 24;

      // draw: dot in chaos, streak in flow (streaks stretch as speed rises)
      const a = p.alpha * (0.85 + 0.15 * k) * dim;
      if (k > 0.15) {
        const len = (6 + 16 * k * p.laneSpeed) * (1 + c * 0.8) * streakK;
        const grad = ctx.createLinearGradient(p.x - len, p.y, p.x, p.y);
        grad.addColorStop(0, 'rgba(43,196,207,0)');
        grad.addColorStop(1, `rgba(43,196,207,${a})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = p.r;
        ctx.beginPath();
        ctx.moveTo(p.x - len * k, p.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      if (k < 0.85) {
        ctx.fillStyle = `rgba(43,196,207,${a * (1 - k * 0.6)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // constellation lines while chaotic
    if (k < 0.5) {
      const la = 0.07 * (1 - k * 2);
      ctx.lineWidth = 0.5;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = parts[i].x - parts[j].x, dy = parts[i].y - parts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK) {
            ctx.strokeStyle = `rgba(43,196,207,${la * (1 - d2 / LINK)})`;
            ctx.beginPath();
            ctx.moveTo(parts[i].x, parts[i].y);
            ctx.lineTo(parts[j].x, parts[j].y);
            ctx.stroke();
          }
        }
      }
    }
    rafId = requestAnimationFrame(frame);
  }

  const vis = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !running) { running = true; rafId = requestAnimationFrame(frame); }
      else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(rafId); }
    });
  });
  vis.observe(hero);
})();

/* ============================================================
   Reveal system
   Engine: ScrollTrigger.batch with rise + settle stagger.
   Fallback: IntersectionObserver class toggles (as before).
   ============================================================ */
const revealEls = [...document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right')];

/* masked line reveals for section headlines (engine only) */
const splitTargets = splitOn ? [...document.querySelectorAll('h2.h-lg')].filter(h => !h.closest('.hero')) : [];
if (splitTargets.length) {
  document.fonts.ready.then(() => {
    splitTargets.forEach(h => {
      gsap.set(h, { autoAlpha: 1, y: 0 });
      SplitText.create(h, {
        type: 'lines', mask: 'lines',
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 115, duration: 0.9, stagger: 0.09, ease: 'power4.out',
            scrollTrigger: { trigger: h, start: 'top 86%', once: true },
          });
        },
      });
    });
  });
}

if (engineOn && revealEls.length) {
  const batchEls = revealEls.filter(el => !splitTargets.includes(el));
  document.querySelectorAll('[data-stagger]').forEach(group => {
    [...group.children].forEach((c, i) => c.style.setProperty('--i', i));
  });
  ScrollTrigger.batch(batchEls, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, {
      autoAlpha: 1, y: 0, x: 0, scale: 1,
      duration: 0.85, ease: 'power3.out', stagger: 0.07, overwrite: true,
    }),
  });
} else if (revealEls.length && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach(el => io.observe(el));
  document.querySelectorAll('[data-stagger]').forEach(group => {
    [...group.children].forEach((c, i) => c.style.setProperty('--i', i));
  });
  requestAnimationFrame(() => revealEls.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) el.classList.add('visible');
  }));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

/* ── Section-head parallax: heads drift slower than tiles ── */
// deliberately scoped to desktop only (isNarrow, not heroStatic) — the hero
// redefinition above no longer implies "not mobile", and this parallax was
// never designed/tested for phones.
if (engineOn && !isNarrow) {
  document.querySelectorAll('.section-head').forEach(el => {
    gsap.fromTo(el, { y: 26 }, {
      y: -26, ease: 'none',
      scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  // atmosphere slowly rises with scroll so lower sections keep ambient light
  gsap.to('.atmosphere', {
    yPercent: -5, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 1.5 },
  });
}

/* ── Before/After scan sweep ── */
if (engineOn) {
  document.querySelectorAll('.ba-card').forEach(card => {
    ScrollTrigger.create({ trigger: card, start: 'top 78%', once: true, onEnter: () => card.classList.add('swept') });
  });
}

/* ── Live workflow pulse cycling ── */
const flowSteps = document.querySelectorAll('.flow-step');
if (flowSteps.length && !reduceMotion) {
  let idx = 0;
  setInterval(() => {
    flowSteps.forEach(s => s.classList.remove('pulse'));
    flowSteps[idx % flowSteps.length].classList.add('pulse');
    idx++;
  }, 1500);
}

/* ── Animated counters ── */
const counters = document.querySelectorAll('[data-counter]');
if (counters.length) {
  const co = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.counter);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      if (reduceMotion) { el.textContent = prefix + target + suffix; co.unobserve(el); return; }
      const dur = 1500, start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      co.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => co.observe(el));
}

/* ── How-it-works: scrubbed line draw + spring dots ── */
const hiw = document.querySelector('.hiw');
if (hiw && engineOn && window.innerWidth > 900) {
  const line = hiw.querySelector('.hiw-line > i');
  if (line) {
    gsap.set(line, { width: '100%', scaleX: 0, transformOrigin: 'left center' });
    gsap.to(line, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: hiw, start: 'top 82%', end: 'top 28%', scrub: 1 },
    });
  }
  hiw.querySelectorAll('.hiw-step .dot').forEach((dot, i) => {
    ScrollTrigger.create({
      trigger: hiw, start: `top ${76 - i * 15}%`, once: true,
      onEnter: () => gsap.fromTo(dot, { scale: 0.4 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.45)' }),
    });
  });
} else if (hiw) {
  const ho = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { hiw.classList.add('on'); ho.unobserve(hiw); } });
  }, { threshold: 0.3 });
  ho.observe(hiw);
}

/* ── Marquee: seamless clone loop (unchanged) ── */
function initMarquee(track) {
  const originals = [...track.children];
  if (!originals.length) return;
  originals.forEach(el => track.appendChild(el.cloneNode(true)));
  const period = track.children[originals.length].offsetLeft - track.children[0].offsetLeft;
  let guard = 0;
  while (track.scrollWidth < window.innerWidth + period && guard < 24) {
    originals.forEach(el => track.appendChild(el.cloneNode(true)));
    guard++;
  }
  track.style.setProperty('--mq-shift', `-${period}px`);
}
document.querySelectorAll('.marquee-track').forEach(initMarquee);

/* ── Marquee: velocity-reactive speed (engine + Lenis only) ── */
if (lenis) {
  const trackAnims = [...document.querySelectorAll('.marquee-track')]
    .map(t => t.getAnimations().find(a => a instanceof CSSAnimation))
    .filter(Boolean);
  if (trackAnims.length) {
    let rate = 1;
    gsap.ticker.add(() => {
      const target = 1 + Math.min(Math.abs(lenisVel) / 45, 3);
      rate += (target - rate) * 0.06;
      trackAnims.forEach(a => { a.playbackRate = rate; });
    });
  }
}

/* ── Cursor-lit tiles ── */
if (!reduceMotion && finePointer) {
  document.querySelectorAll('.tile.lit').forEach(tile => {
    tile.addEventListener('mousemove', (e) => {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', `${e.clientX - r.left}px`);
      tile.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* ── Magnetic CTAs: eased pull, springy release ── */
if (!reduceMotion && finePointer) {
  document.querySelectorAll('[data-magnetic]').forEach(btn => {
    const strength = 0.3;
    if (engineOn) {
      const qx = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3' });
      const qy = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3' });
      let releasing = null;
      btn.addEventListener('mousemove', (e) => {
        if (releasing) { releasing.kill(); releasing = null; }
        const r = btn.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * strength);
        qy((e.clientY - r.top - r.height / 2) * strength);
      });
      btn.addEventListener('mouseleave', () => {
        releasing = gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: true });
      });
    } else {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    }
  });
}

/* ── FAQ accordion ── */
const faq = document.querySelector('.faq-list');
if (faq) {
  faq.addEventListener('click', (e) => {
    const q = e.target.closest('.faq-q');
    if (!q) return;
    const item = q.parentElement;
    const open = item.classList.contains('open');
    faq.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!open) item.classList.add('open');
  });
}

/* ── Contact form → Web3Forms (reuses live access key) ── */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Sending…';
    const payload = {
      access_key: '0c1b7aae-f345-4c31-9243-25366ed2f725',
      subject: 'New enquiry via nsquareai.in',
      name: form.name.value,
      business: form.business.value,
      contact: form['contact-info'].value,
      message: form.message.value,
    };
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('form-success').classList.remove('hidden');
        form.classList.add('hidden');
      } else { throw new Error(data.message || 'failed'); }
    } catch (err) {
      btn.disabled = false; btn.textContent = 'Send Message';
      alert('Something went wrong. Please try again or email nekunj@nsquareai.in directly.');
    }
  });
}
