import { useEffect } from "react";

const SITE_NAME = "CreatorHub";

/**
 * Sets document.title for the current page. A full meta-tag/SSR
 * solution (react-helmet or SSR meta injection) would be needed for
 * real social-share previews per page, but this SPA is client-rendered
 * only at MVP — crawlers executing JS (Google) will see per-page
 * titles; share-preview scrapers that don't execute JS will only see
 * the static index.html Open Graph tags. Flagging this as a v2
 * SEO consideration (SSR/prerendering) rather than solving it now.
 */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Premium digital products`;
  }, [title]);
}
