export interface ContentBlock {
  type: 'heading' | 'rich_text' | 'image_text' | 'quote' | 'cta';
  text?: string;
  image?: string;
  title?: string;
  quote?: string;
  attribution?: string;
  button_text?: string;
  button_link?: string;
  position?: 'left' | 'right';
}

const TYPES = new Set<ContentBlock['type']>(['heading', 'rich_text', 'image_text', 'quote', 'cta']);
const TEXT_FIELDS = ['text', 'title', 'quote', 'attribution', 'button_text'] as const;
const MAX_BLOCKS = 50;
const MAX_TEXT = 20000;

function asText(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= MAX_TEXT ? value : undefined;
}

/** https image URL only. */
function asImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Same-site path, or an http(s) URL; never javascript:/data:/protocol-relative. */
function asLink(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Validates the `custom.content_blocks` JSON metafield; invalid blocks are dropped. */
export function parseContentBlocks(raw: string | null | undefined): ContentBlock[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const blocks: ContentBlock[] = [];
  for (const item of parsed.slice(0, MAX_BLOCKS)) {
    if (typeof item !== 'object' || item === null) continue;
    const input = item as Record<string, unknown>;
    if (typeof input.type !== 'string' || !TYPES.has(input.type as ContentBlock['type'])) continue;
    const block: ContentBlock = {type: input.type as ContentBlock['type']};
    for (const field of TEXT_FIELDS) {
      const value = asText(input[field]);
      if (value !== undefined) block[field] = value;
    }
    const image = asImageUrl(input.image);
    if (image) block.image = image;
    const link = asLink(input.button_link);
    if (link) block.button_link = link;
    if (input.position === 'left' || input.position === 'right') block.position = input.position;
    blocks.push(block);
  }
  return blocks;
}
