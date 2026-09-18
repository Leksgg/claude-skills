import DOMPurify from 'dompurify';
import { marked } from 'marked';

export function ProductDescription({ markdown }: { markdown: string }) {
  const html = DOMPurify.sanitize(marked.parse(markdown, { async: false }) as string);
  return <div className="description" dangerouslySetInnerHTML={{ __html: html }} />;
}
