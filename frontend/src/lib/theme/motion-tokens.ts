/**
 * ============================================================
 * MOTION TOKENS (JS/TS mirror) — CreatorHub Design System v1.0.0
 * ============================================================
 * Purpose:
 *   Framer Motion needs actual numbers/strings in JS, not CSS custom
 *   properties. This file mirrors the motion primitives defined in
 *   `src/styles/tokens/primitives.css` and the category mapping in
 *   `src/styles/tokens/semantic.css`, so both systems move together.
 *
 *   IMPORTANT: if a motion value changes in primitives.css, it must
 *   be changed here too. This is the one place in the token system
 *   where a value is intentionally duplicated (CSS custom properties
 *   cannot be read into JS without a runtime style computation, which
 *   would cost a layout read on every component mount — not worth it
 *   for a handful of stable values).
 *
 * Usage:
 *   import { MOTION_DURATION, MOTION_EASE } from "@/lib/theme/motion-tokens";
 *   <motion.div transition={{ duration: MOTION_DURATION.feedback, ease: MOTION_EASE.standard }} />
 * ============================================================
 */

/** Raw durations, in seconds (Framer Motion expects seconds, not ms). */
export const MOTION_DURATION = {
  micro: 0.12,
  transition: 0.2,
  page: 0.35,
} as const;

/** Single project-wide easing curve. Matches --motion-ease-standard. */
export const MOTION_EASE = {
  standard: [0.4, 0, 0.2, 1],
} as const;

/**
 * Category mapping by intent — mirrors the semantic --motion-feedback-*,
 * --motion-navigation-*, --motion-attention-* tokens in semantic.css.
 *
 * - feedback: button press, toggle, cart-add confirmation
 * - navigation: route transitions, modal/drawer enter-exit, tabs
 * - attention: new-item badges, notification dots — use sparingly
 */
export const MOTION_CATEGORY = {
  feedback: {
    duration: MOTION_DURATION.micro,
    ease: MOTION_EASE.standard,
  },
  navigation: {
    duration: MOTION_DURATION.transition,
    ease: MOTION_EASE.standard,
  },
  navigationPage: {
    duration: MOTION_DURATION.page,
    ease: MOTION_EASE.standard,
  },
  attention: {
    duration: MOTION_DURATION.micro,
    ease: MOTION_EASE.standard,
  },
} as const;

export type MotionCategory = keyof typeof MOTION_CATEGORY;
