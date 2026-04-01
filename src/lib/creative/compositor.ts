/**
 * Image Compositor
 *
 * Takes a raw generated image (URL) and composites text overlays using sharp + SVG.
 * Produces platform-ready creatives with headline, subheadline, CTA, and logo.
 */

import sharp from "sharp";
import { BRAND } from "./brand-config";
import type { ContentPlan } from "./content-plan";
import type { Platform } from "./brand-config";

// Re-export Platform so callers can import from one place
export type { Platform };

const PLATFORM_SIZES: Record<Platform, { width: number; height: number }> = {
  instagram_post:  { width: 1080, height: 1350 },
  instagram_story: { width: 1080, height: 1920 },
  facebook_feed:   { width: 1200, height: 628  },
  facebook_square: { width: 1080, height: 1080 },
  article_header:  { width: 1280, height: 720  },
};

export async function compositeCreative(
  plan: ContentPlan,
  imageBuffer: Buffer
): Promise<Buffer> {
  const { width, height } = PLATFORM_SIZES[plan.platform];

  // Resize base image to platform dimensions
  const resized = await sharp(imageBuffer)
    .resize(width, height, { fit: "cover", position: "centre" })
    .toBuffer();

  const overlay = buildOverlaySvg(plan, width, height);

  const result = await sharp(resized)
    .composite([{
      input: Buffer.from(overlay),
      top: 0,
      left: 0,
    }])
    .jpeg({ quality: 92 })
    .toBuffer();

  return result;
}

// ── SVG overlay builder ────────────────────────────────────────────────────

function buildOverlaySvg(plan: ContentPlan, w: number, h: number): string {
  const isStory    = plan.platform === "instagram_story";
  const isFacebook = plan.platform === "facebook_feed";
  const isArticle  = plan.platform === "article_header";

  // Gradient overlay — dark at bottom for text legibility
  const gradientId = "grad";
  const gradientHeight = isStory ? h * 0.5 : h * 0.55;
  const gradientY      = h - gradientHeight;

  // Font sizes scaled to canvas
  const scale       = w / 1080;
  const headlineSize   = Math.round((isFacebook ? 52 : 64) * scale);
  const sublineSize    = Math.round(30 * scale);
  const ctaFontSize    = Math.round(28 * scale);
  const logoSize       = Math.round(24 * scale);
  const padding        = Math.round(72 * scale);
  const ctaPadX        = Math.round(40 * scale);
  const ctaPadY        = Math.round(22 * scale);
  const ctaRadius      = Math.round(16 * scale);

  // Text positions — bottom-aligned
  const ctaY        = h - padding;
  const headlineY   = ctaY - ctaPadY * 2 - ctaFontSize - Math.round(36 * scale);
  const sublineY    = headlineY + headlineSize + Math.round(16 * scale);
  const logoY       = padding + logoSize;

  // Wrap headline at ~22 chars per line
  const headlineLines = wrapText(plan.headline.toUpperCase(), 22);

  // CTA pill width estimate
  const ctaText    = plan.cta;
  const ctaWidth   = ctaText.length * ctaFontSize * 0.62 + ctaPadX * 2;
  const ctaX       = padding;
  const ctaBoxY    = ctaY - ctaFontSize - ctaPadY;

  const headlineSvgLines = headlineLines
    .map((line, i) => {
      const y = headlineY + i * (headlineSize + 8);
      return `<text
        x="${padding}"
        y="${y}"
        font-family="Inter, Arial, sans-serif"
        font-weight="800"
        font-size="${headlineSize}"
        fill="${BRAND.colors.primary}"
        letter-spacing="-1"
        filter="url(#shadow)"
      >${escapeXml(line)}</text>`;
    })
    .join("\n");

  // Adjust CTA/subline y positions based on headline line count
  const extraHeadlineH = (headlineLines.length - 1) * (headlineSize + 8);
  const adjustedSublineY = sublineY + extraHeadlineH;
  const adjustedCtaBoxY  = ctaBoxY  + extraHeadlineH;
  const adjustedCtaY     = ctaY     + extraHeadlineH;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="transparent" stop-opacity="0"/>
      <stop offset="40%" stop-color="${BRAND.colors.background}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${BRAND.colors.background}" stop-opacity="0.88"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="black" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Gradient overlay -->
  <rect x="0" y="${gradientY}" width="${w}" height="${gradientHeight}" fill="url(#${gradientId})"/>

  <!-- Logo / brand name top left -->
  <text
    x="${padding}"
    y="${logoY}"
    font-family="Inter, Arial, sans-serif"
    font-weight="700"
    font-size="${logoSize}"
    fill="${BRAND.colors.accent}"
    letter-spacing="2"
    filter="url(#shadow)"
  >${BRAND.name.toUpperCase()}</text>

  <!-- Headline -->
  ${headlineSvgLines}

  <!-- Subheadline -->
  ${plan.subheadline ? `<text
    x="${padding}"
    y="${adjustedSublineY}"
    font-family="Inter, Arial, sans-serif"
    font-weight="400"
    font-size="${sublineSize}"
    fill="${BRAND.colors.muted}"
    filter="url(#shadow)"
  >${escapeXml(plan.subheadline)}</text>` : ""}

  <!-- CTA pill -->
  <rect
    x="${ctaX}"
    y="${adjustedCtaBoxY}"
    width="${ctaWidth}"
    height="${ctaFontSize + ctaPadY * 2}"
    rx="${ctaRadius}"
    fill="${BRAND.colors.accent}"
    opacity="0.95"
  />
  <text
    x="${ctaX + ctaWidth / 2}"
    y="${adjustedCtaY}"
    text-anchor="middle"
    font-family="Inter, Arial, sans-serif"
    font-weight="700"
    font-size="${ctaFontSize}"
    fill="#000000"
  >${escapeXml(ctaText)}</text>

  <!-- Accent line above headline -->
  <rect
    x="${padding}"
    y="${headlineY - Math.round(20 * scale)}"
    width="${Math.round(48 * scale)}"
    height="${Math.round(3 * scale)}"
    fill="${BRAND.colors.accent}"
    rx="2"
  />
</svg>`;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}