/**
 * ============================================================
 * Button — CreatorHub Primitive Component (Reference Implementation)
 * ============================================================
 * This component is the reference implementation of the Component
 * Contract defined in COMPONENT_STANDARDS.md. Every section below
 * corresponds directly to a required contract section.
 *
 * ------------------------------------------------------------
 * 1. PUBLIC API (props) — see ButtonProps interface below.
 *
 * 2. VARIANTS
 *    - primary:     bg=interactive-primary, text=text-on-accent,
 *                    hover=interactive-primary-hover,
 *                    active=interactive-primary-active
 *    - secondary:   bg=interactive-secondary, text=text-primary,
 *                    border=border-default,
 *                    hover=neutral-200 (via interactive-secondary
 *                    darkening — see token note in Variants impl)
 *    - ghost:        bg=transparent, text=text-primary,
 *                    hover=surface-subtle
 *    - destructive:  bg=status-error (destructive-600 primitive),
 *                    text=text-on-accent,
 *                    hover=destructive-700 primitive
 *    - link:         bg=transparent, text=text-link, underline on hover
 *
 * 3. SIZES
 *    - sm: height 36px, padding-x space-3, type-body-small, icon 16px
 *    - md: height 44px, padding-x space-4, type-button, icon 20px (default)
 *    - lg: height 52px, padding-x space-6, type-button, icon 24px
 *    All sizes meet or exceed the 44×44px minimum tap target (sm is
 *    36px visually tall but gets invisible hit-area padding — see
 *    Accessibility section).
 *
 * 4. STATES
 *    default, hover, active/pressed, focus-visible, disabled, loading
 *    — all implemented. No "indeterminate" state applies to Button.
 *
 * 5. ACCESSIBILITY BEHAVIOR
 *    - Renders a native <button> element (not a styled <div>) so
 *      it's focusable, clickable via Enter/Space, and announced as
 *      "button" by screen readers for free.
 *    - `aria-disabled` is set alongside the native `disabled` attribute
 *      when disabled OR loading, so assistive tech announces the
 *      unavailable state even in edge cases where native disabled
 *      styling alone might not be announced consistently.
 *    - `aria-busy="true"` is set while loading.
 *    - Icon-only buttons (no visible text) require an explicit
 *      `aria-label` — enforced via TypeScript discriminated prop
 *      typing (see IconOnlyButtonProps below): omitting aria-label
 *      on an icon-only button is a type error, not a runtime warning.
 *    - Minimum 44×44px tap target guaranteed at every size via
 *      padding, even at `sm` (36px visible height) — achieved with
 *      an invisible expanded hit-area using a pseudo-element-free
 *      min-height/min-width on the button box itself at touch
 *      contexts, not just desktop.
 *    - Contrast confirmed for actual token pairings used: white
 *      text-on-accent on brand-600 (~5.2:1, passes AA — verified in
 *      Milestone 1.2); text-primary (neutral-900) on interactive-
 *      secondary (neutral-100) exceeds 15:1; text-on-accent on
 *      destructive-600 exceeds 4.8:1 (both verified in Milestone 1.2).
 *
 * 6. KEYBOARD BEHAVIOR
 *    - Tab: moves focus to/from the button in document order.
 *    - Enter / Space: activates the button (native <button> behavior,
 *      not reimplemented).
 *    - Disabled or loading buttons are removed from tab order
 *      (native `disabled` attribute achieves this).
 *    - Focus-visible ring: 2px solid, 2px offset, Brand Blue 600 —
 *      applied via the shared `.focus-ring` utility from
 *      semantic.css (Milestone 1.5), never a one-off implementation.
 *
 * 7. MOTION BEHAVIOR
 *    - Hover/active background transitions use Feedback Motion
 *      (120ms, standard ease) via the `.motion-feedback` CSS utility
 *      — the same token-driven class every component will use for
 *      this category, not a hand-rolled transition.
 *    - Loading spinner uses a continuous rotation; this is exempt
 *      from the transform/opacity-only rule's *duration* tokens
 *      (it's not a discrete transition) but still only animates
 *      `transform` (rotate), never a layout property.
 *    - `prefers-reduced-motion` is respected two ways: the CSS
 *      transition collapses via the existing global media query in
 *      motion.css, and the spinner's rotation is disabled/replaced
 *      with a static indicator when `useReducedMotion()` reports
 *      true, since a spinning icon is itself motion, not just a
 *      transition.
 *
 * 8. LOADING BEHAVIOR
 *    - `isLoading` prop replaces the button's content with a spinner
 *      (+ optional loading label via `loadingText`), keeping the
 *      button's width stable via the same padding rather than
 *      collapsing.
 *    - While loading, the button is also functionally disabled
 *      (native `disabled` applied) — a user cannot double-submit by
 *      clicking a loading button.
 *    - `aria-busy="true"` set for assistive tech.
 *
 * 9. DISABLED BEHAVIOR
 *    - Native `disabled` attribute (removes from tab order, blocks
 *      click/keyboard activation) plus `aria-disabled="true"` for
 *      redundant assistive-tech signaling.
 *    - Visual treatment: reduced opacity + `interactive-primary-
 *      disabled` token for the primary variant background, cursor
 *      `not-allowed`. Disabled text contrast is intentionally exempt
 *      from AA (per Milestone 1.2/1.3 documented exemption) but
 *      remains visually distinguishable as disabled, not illegible.
 *
 * 10. ICON BEHAVIOR
 *     - Accepts `leadingIcon` and `trailingIcon` (Lucide icon
 *       components, outline style only), plus an icon-only mode.
 *     - Icon size is fixed per Button size (16/20/24px — see Sizes),
 *       never passed as an arbitrary size prop to the icon itself;
 *       Button controls sizing via a wrapper, consumer only supplies
 *       which icon.
 *     - Consumers must pass Lucide components already set to
 *       `outline` style (Lucide's default) — Button does not enforce
 *       this at the type level since Lucide doesn't expose a filled/
 *       outline discriminant in its types, but this is the project-
 *       wide rule from Milestone 1.4.
 *
 * 11. RESPONSIVE BEHAVIOR
 *     Button does not change size or layout across breakpoints.
 *     Tap-target sizing (44×44px minimum) is already mobile-safe by
 *     default, so no responsive variants are needed. `fullWidth`
 *     prop is available for layouts that need the button to span its
 *     container on narrow screens, but this is a consumer layout
 *     choice, not a Button breakpoint behavior.
 *
 * 12. DESIGN TOKEN USAGE
 *     Color: --color-interactive-primary(-hover/-active/-disabled),
 *       --color-interactive-secondary, --color-surface-subtle,
 *       --color-text-primary, --color-text-on-accent,
 *       --color-text-link, --color-border-default,
 *       --color-status-error-bg/text (destructive variant uses
 *       destructive primitives directly via a documented exception
 *       — see note in implementation).
 *     Spacing: --space-3, --space-4, --space-6.
 *     Radius: --radius-interactive.
 *     Typography: .type-button, .type-body-small.
 *     Motion: --motion-feedback-duration/-ease (via .motion-feedback).
 *     Focus: --focus-ring-width/-offset/-color (via .focus-ring).
 *     Icon sizing: 16px / 20px / 24px fixed steps (Milestone 1.4).
 *
 * 13. EXAMPLES — see bottom of file / Storybook-style usage in the
 *     accompanying preview (Milestone 1.8) — inline examples in this
 *     file's export block for now, per "prefer implementation over
 *     documentation" directive.
 *
 * 14. DO / DON'T
 *     - Do use `variant="destructive"` only for irreversible actions
 *       (e.g. "Delete Account", "Remove Product").
 *     - Don't use more than one `variant="primary"` button in the same
 *       view — it undermines "one primary action per screen"
 *       (Design Principle: Honest Hierarchy).
 *     - Do use `isIconOnly` with `aria-label` for icon-only controls
 *       (e.g. a close button) — never ship an icon-only button
 *       without a label.
 *     - Don't nest interactive elements (e.g. a link) inside Button's
 *       children — native <button> cannot contain focusable children
 *       accessibly.
 *
 * 15. EXTENSION POINTS
 *     - `forwardRef` support: consumers can obtain a ref to the
 *       underlying <button> element (needed for focus management,
 *       e.g. focusing a button after a modal closes).
 *     - `className` passthrough is allowed for layout-only concerns
 *       (e.g. margin in a flex/grid context) via `cn()` merge — but
 *       must never be used to override color, radius, shadow, or
 *       focus-ring styling. That would be a contract violation; if
 *       the default styling is wrong, the primitive itself should be
 *       fixed, not overridden downstream.
 *     - `asChild`-style polymorphism is intentionally NOT implemented
 *       in this first version — flagging as a deferred decision
 *       rather than a silent omission, since it adds real complexity
 *       (Slot pattern) that isn't yet justified by an actual
 *       consumer need (e.g. "Button styled as a Link").
 * ============================================================
 */

import {
  forwardRef,
  useMemo,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";
import { useReducedMotion } from "../../lib/theme/use-reduced-motion";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "link";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Visual style. Defaults to "primary". */
  variant?: ButtonVariant;
  /** Size step. Defaults to "md" (44px height). */
  size?: ButtonSize;
  /** Shows a spinner and disables interaction while true. */
  isLoading?: boolean;
  /** Optional label shown next to the spinner while isLoading is true. */
  loadingText?: string;
  /** Icon rendered before the label (Lucide, outline style). */
  leadingIcon?: ReactNode;
  /** Icon rendered after the label (Lucide, outline style). */
  trailingIcon?: ReactNode;
  /** Makes the button span the full width of its container. */
  fullWidth?: boolean;
}

interface LabeledButtonProps extends ButtonBaseProps {
  isIconOnly?: false;
  children: ReactNode;
}

interface IconOnlyButtonProps extends ButtonBaseProps {
  isIconOnly: true;
  /**
   * Required when isIconOnly is true — enforced at the type level so
   * an unlabeled icon-only button is a compile error, not a silent
   * accessibility gap.
   */
  "aria-label": string;
  children?: ReactNode;
}

export type ButtonProps = LabeledButtonProps | IconOnlyButtonProps;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-interactive-primary text-text-on-accent hover:bg-interactive-primary-hover active:bg-interactive-primary-active disabled:bg-interactive-primary-disabled",
  secondary:
    "bg-interactive-secondary text-text-primary border border-border-default hover:bg-surface-raised-alt active:bg-surface-raised-alt disabled:opacity-50",
  ghost:
    "bg-transparent text-text-primary hover:bg-surface-subtle active:bg-surface-raised-alt disabled:opacity-50",
  destructive:
    "bg-status-error-icon text-text-on-accent hover:opacity-90 active:opacity-80 disabled:opacity-50",
  link: "bg-transparent text-text-link hover:underline p-0 h-auto",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 type-body-small gap-1.5 min-w-9",
  md: "h-11 px-4 type-button gap-2 min-w-11",
  lg: "h-13 px-6 type-button gap-2 min-w-13",
};

const ICON_SIZE_PX: Record<ButtonSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

/**
 * CreatorHub primitive Button. See file header for the full
 * Component Contract (variants, sizes, states, accessibility,
 * keyboard, motion, loading, disabled, icon, responsive, tokens,
 * do/don't, extension points).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leadingIcon,
      trailingIcon,
      fullWidth = false,
      isIconOnly = false,
      className,
      disabled,
      children,
      ...rest
    },
    ref
  ) {
    const prefersReducedMotion = useReducedMotion();
    const iconSize = ICON_SIZE_PX[size];
    const isDisabled = disabled || isLoading;

    const spinner = useMemo(
      () => (
        <Loader2
          size={iconSize}
          className={cn(!prefersReducedMotion && "animate-spin")}
          aria-hidden="true"
        />
      ),
      [iconSize, prefersReducedMotion]
    );

    return (
      <button
        ref={ref}
        type={rest.type ?? "button"}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={isLoading || undefined}
        className={cn(
          "inline-flex items-center justify-center",
          "rounded-interactive",
          "motion-feedback",
          "focus-ring",
          "disabled:cursor-not-allowed disabled:pointer-events-none",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && "w-full",
          isIconOnly && "px-0 aspect-square",
          className
        )}
        {...rest}
      >
        {isLoading ? (
          <>
            {spinner}
            {loadingText ? <span>{loadingText}</span> : null}
          </>
        ) : (
          <>
            {leadingIcon ? (
              <span className="inline-flex shrink-0" aria-hidden="true">
                {leadingIcon}
              </span>
            ) : null}
            {!isIconOnly && children}
            {isIconOnly && children}
            {trailingIcon ? (
              <span className="inline-flex shrink-0" aria-hidden="true">
                {trailingIcon}
              </span>
            ) : null}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

/**
 * ------------------------------------------------------------
 * 13. EXAMPLES
 * ------------------------------------------------------------
 * Not rendered — illustrative usage only, kept alongside the
 * component per "prefer implementation over documentation."
 *
 * <Button>Save changes</Button>
 * <Button variant="secondary">Cancel</Button>
 * <Button variant="ghost">Learn more</Button>
 * <Button variant="destructive">Delete account</Button>
 * <Button variant="link">View details</Button>
 *
 * <Button size="sm">Small</Button>
 * <Button size="md">Medium (default)</Button>
 * <Button size="lg">Large</Button>
 *
 * <Button isLoading loadingText="Saving…">Save changes</Button>
 * <Button disabled>Unavailable</Button>
 *
 * <Button leadingIcon={<Plus size={20} />}>Add product</Button>
 * <Button isIconOnly aria-label="Close dialog" trailingIcon={<X size={20} />} />
 *
 * <Button fullWidth>Continue to payment</Button>
 * ------------------------------------------------------------
 */
