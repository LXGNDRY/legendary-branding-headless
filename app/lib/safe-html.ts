import {parseFragment, serialize, defaultTreeAdapter, type DefaultTreeAdapterTypes} from 'parse5';

type Node = DefaultTreeAdapterTypes.Node;
type Element = DefaultTreeAdapterTypes.Element;
type ParentNode = DefaultTreeAdapterTypes.ParentNode;

// Elements removed together with everything inside them.
const DROP_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'form', 'input', 'button',
  'textarea', 'select', 'option', 'svg', 'math', 'link', 'meta', 'base', 'template', 'noscript', 'title',
  'head', 'audio', 'video', 'source', 'track', 'canvas', 'dialog',
]);

const ALLOWED_TAGS = new Set([
  'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'code', 'col', 'colgroup', 'dd', 'del', 'details', 'div',
  'dl', 'dt', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins', 'li',
  'mark', 'ol', 'p', 'pre', 's', 'small', 'span', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td',
  'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
]);

const GLOBAL_ATTRS = new Set(['class', 'title', 'lang', 'dir']);
// NOTE: kept IDs are namespaced so merchant HTML can't clobber window/document properties (e.g. id="location").
const ID_PREFIX = 'content-';
const SAFE_ID = /^[A-Za-z][\w:.-]{0,99}$/;
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  ol: new Set(['start']),
  col: new Set(['span']),
  colgroup: new Set(['span']),
};

const LINK_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const IMAGE_SCHEMES = new Set(['http:', 'https:']);

/** Returns the URL if it is relative or uses an allowed scheme, otherwise null. */
function safeUrl(raw: string, schemes: Set<string>): string | null {
  // Browsers ignore ASCII control characters and whitespace inside the scheme.
  // eslint-disable-next-line no-control-regex
  const value = raw.replace(/[\u0000- \u007F-\u009F]/g, '');
  if (!value) return null;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value);
  if (scheme) return schemes.has(`${scheme[1].toLowerCase()}:`) ? raw.trim() : null;
  // Relative, root-relative, protocol-relative, query or fragment links.
  return raw.trim();
}

function cleanAttributes(el: Element) {
  const tag = el.tagName;
  const allowedForTag = TAG_ATTRS[tag];
  const kept: {name: string; value: string}[] = [];
  for (const attr of el.attrs) {
    const name = attr.name.toLowerCase();
    if (name === 'id') {
      if (SAFE_ID.test(attr.value)) kept.push({name, value: `${ID_PREFIX}${attr.value}`});
      continue;
    }
    if (!GLOBAL_ATTRS.has(name) && !allowedForTag?.has(name)) continue;
    if (tag === 'a' && name === 'href') {
      const url = safeUrl(attr.value, LINK_SCHEMES);
      if (!url) continue;
      const fragment = /^#([A-Za-z][\w:.-]{0,99})$/.exec(url);
      kept.push({name, value: fragment ? `#${ID_PREFIX}${fragment[1]}` : url});
      continue;
    }
    if (tag === 'img' && name === 'src') {
      const url = safeUrl(attr.value, IMAGE_SCHEMES);
      if (url) kept.push({name, value: url});
      continue;
    }
    if (tag === 'a' && name === 'rel') continue;
    if (tag === 'a' && name === 'target') {
      if (attr.value === '_blank') kept.push({name, value: '_blank'});
      continue;
    }
    kept.push({name, value: attr.value});
  }
  if (tag === 'a' && kept.some((a) => a.name === 'target')) {
    kept.push({name: 'rel', value: 'noopener noreferrer'});
  }
  el.attrs = kept;
}

function clean(parent: ParentNode) {
  for (const child of [...parent.childNodes] as Node[]) {
    if (defaultTreeAdapter.isElementNode(child)) {
      const tag = child.tagName;
      if (DROP_WITH_CONTENT.has(tag)) {
        defaultTreeAdapter.detachNode(child);
        continue;
      }
      clean(child);
      if (!ALLOWED_TAGS.has(tag)) {
        // Unknown wrapper: keep the (already cleaned) children in its place.
        for (const grandchild of [...child.childNodes]) {
          defaultTreeAdapter.insertBefore(parent, grandchild, child);
        }
        defaultTreeAdapter.detachNode(child);
        continue;
      }
      cleanAttributes(child);
    } else if (defaultTreeAdapter.isCommentNode(child)) {
      defaultTreeAdapter.detachNode(child);
    }
  }
}

/**
 * Allowlist sanitizer for merchant/CMS HTML. Parses with a spec-compliant
 * HTML5 parser (not regex), drops active content, unknown attributes and
 * unsafe URL schemes, and re-serializes. Pure JS, so it runs on Workers.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  const fragment = parseFragment(html);
  clean(fragment);
  return serialize(fragment);
}
