/**
 * Merges conditional class name fragments, filtering out falsy
 * values. Previously duplicated inline in every primitive component
 * (Button, Input, Card, Badge, Avatar, Skeleton) — consolidated here
 * as the single implementation all primitives import.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
