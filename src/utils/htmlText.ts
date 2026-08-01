const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

export function htmlToPlainText(html: string): string {
  let text = html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n\n')
    .replace(/<\s*\/div\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '');

  for (const [entity, value] of Object.entries(HTML_ENTITIES)) {
    text = text.split(entity).join(value);
  }

  return text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
}
