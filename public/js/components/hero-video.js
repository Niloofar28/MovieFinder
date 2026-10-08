/**
 * Scroll-driven hero footage.
 *
 * The hero section is a tall track (see `.hero` in pages.css) with a
 * viewport-sized sticky viewport pinned inside it. Scroll progress through that
 * track maps 1:1 onto the video timeline — the video is never played, it is
 * only ever *scrubbed*:
 *
 *   progress 0    -> currentTime 0
 *   progress 0.5  -> currentTime duration / 2
 *   progress 1    -> currentTime duration
 *
 * Scroll listener vs. render loop
 *   The scroll handler does arithmetic on `window.scrollY` only: no layout
 *   reads, no video reads, no `currentTime` writes. It stores a target progress
 *   and makes sure the single requestAnimationFrame loop is running. That loop
 *   owns every read and write, eases the timeline toward the target, and stops
 *   itself as soon as the eased time settles — so a page nobody is scrolling
 *   runs no animation loop at all.
 *
 * Seeking performance, and why the encodes matter
 *   A paused video can only be scrubbed as fast as the browser can jump to a
 *   nearby *keyframe*; everything after that keyframe has to be decoded
 *   forward. Encoding characteristics to insist on for scroll-scrubbed footage:
 *     - a keyframe every few frames rather than the usual ~250 (`-g 5` here,
 *       about 0.2s, so a seek never decodes more than four frames);
 *     - H.264 High profile / yuv420p, `-movflags +faststart` so the moov atom
 *       precedes the mdat and the browser can seek before the file is complete;
 *     - the source resolution, not an upscale, plus a lighter variant for
 *       narrow viewports.
 *   The footage supplied for this hero had a single keyframe for its whole nine
 *   seconds, which makes every scrub decode the entire file — that is the one
 *   characteristic that guarantees stuttering, so it was re-encoded.
 */

/* Share of the remaining gap closed in one 60fps frame. High enough that the
   picture feels attached to the scroll, low enough to hide seek steps. */
const SMOOTHING = 0.18;
/* Seconds — once this close, snap to the target and let the loop stop. */
const SETTLE = 1 / 120;
/* Seconds — a write smaller than this cannot show a different frame. */
const MIN_SEEK = 1 / 60;

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);

export function initHeroVideo(root) {
  if (!root) return null;

  const video = root.querySelector('[data-hero-video]');
  const sticky = root.querySelector('[data-hero-sticky]');
  if (!video || !sticky) return null;

  /* Phones get the lighter encode. The source is chosen here rather than in the
     markup so a phone never starts the heavier download before the swap. */
  const narrow = window.matchMedia('(max-width: 767px)').matches;
  video.src = (narrow && video.dataset.mobileSrc) || video.dataset.src;
  if (!video.src) return null;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let origin = 0; // scrollY at which the hero pins
  let span = 1; // scrollY between the first frame and the last
  let targetProgress = 0;
  let targetTime = 0;
  let smoothTime = 0;
  let rendered = -1;
  let lastFrame = 0;
  let running = false;
  let ready = false;

  const measure = () => {
    origin = root.getBoundingClientRect().top + window.scrollY;
    /* The sticky viewport's own height, so a mobile URL bar cannot skew the
       mapping the way `window.innerHeight` would. */
    span = Math.max(1, root.offsetHeight - sticky.offsetHeight);
  };

  /* One style write per thousandth of progress, at most. */
  const render = (progress) => {
    const value = Math.round(progress * 1000) / 1000;
    if (value === rendered) return;
    rendered = value;
    root.style.setProperty('--hero-progress', String(value));
    root.classList.toggle('is-hero-faded', value > 0.3);
  };

  const tick = (now) => {
    const duration = video.duration;
    if (!ready || !duration || !Number.isFinite(duration)) {
      running = false;
      return;
    }

    targetTime = targetProgress * duration;

    /* Frame-rate independent form of `time += (target - time) * k`. */
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    smoothTime += (targetTime - smoothTime) * (1 - Math.pow(1 - SMOOTHING, dt * 60));
    if (Math.abs(targetTime - smoothTime) <= SETTLE) smoothTime = targetTime;

    /* Skip writes the eye cannot see, but always land exactly on the frame the
       scroll is asking for once the easing has arrived. */
    const gap = Math.abs(video.currentTime - smoothTime);
    if (gap > MIN_SEEK || (smoothTime === targetTime && gap > 0)) {
      video.currentTime = smoothTime;
    }

    render(targetProgress);

    if (smoothTime !== targetTime) requestAnimationFrame(tick);
    else running = false;
  };

  const start = () => {
    if (running) return;
    running = true;
    lastFrame = performance.now();
    requestAnimationFrame(tick);
  };

  const onScroll = () => {
    targetProgress = clamp01((window.scrollY - origin) / span);
    /* The header stays transparent for the whole pinned sequence, then takes its
       solid state back for the rest of the page. */
    document.documentElement.classList.toggle('is-hero-pinned', targetProgress < 1);
    start();
  };

  const onReady = () => {
    if (ready || video.readyState < 2) return;
    ready = true;
    measure();
    onScroll();
    root.classList.add('is-video-ready');
    root.classList.remove('is-hero-loading');
  };

  /* A paused video paints nothing until it is asked for a frame, and on some
     mobile browsers that first seek is also what pulls the data down. */
  video.addEventListener('loadedmetadata', () => {
    measure();
    if (video.readyState < 2) video.currentTime = 0.001;
  });
  video.addEventListener('loadeddata', onReady);
  video.addEventListener('seeked', onReady);

  video.addEventListener('error', () => {
    root.classList.remove('is-hero-loading');
    root.classList.add('is-video-failed');
  });

  root.classList.add('is-hero-loading');
  video.load();
  measure();

  /* Reduced motion: keep the footage as a still first frame, drop the scrub. */
  if (reduced) return null;

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener(
    'resize',
    () => {
      measure();
      onScroll();
    },
    { passive: true }
  );

  onScroll();
  return { measure, onScroll };
}
