import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

export interface MarkdownContentProps {
  content: string;
  codeHighlighting: boolean;
}

/** Assistant markdown: GFM (tables, strikethrough, task lists) + optional highlight.js. */
export function MarkdownContent({ content, codeHighlighting }: MarkdownContentProps) {
  const rehypePlugins = useMemo(
    () => (codeHighlighting ? [rehypeHighlight] : []),
    [codeHighlighting],
  );
  return (
    <div className="ck-markdown leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins}
        components={{
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
