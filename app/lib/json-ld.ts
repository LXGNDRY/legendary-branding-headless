/**
 * JSON.stringify is not safe inside a <script> element: a "</script>" or
 * "<!--" in any string value would end or alter the element. Escaping these
 * characters as JSON unicode escapes keeps the output valid JSON that parses
 * back to the original value.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
