import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize untrusted HTML (AI-generated content, external RSS bodies) before
 * rendering via dangerouslySetInnerHTML. Strips <script>, event handlers,
 * javascript: URLs, iframes, etc. — preserves standard rich-text markup.
 */
export function sanitizeHtml(html?: string | null): string {
  if (!html) return "";
  return DOMPurify.sanitize(String(html), { USE_PROFILES: { html: true } });
}
