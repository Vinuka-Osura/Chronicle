import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

/**
 * Renders a Markdown field from the API.
 *
 * The API returns Markdown raw and unrendered, which means the sanitising has to happen
 * here. rehype-sanitize is not optional: content comes from a database that a CMS
 * writes to, so treating it as trusted would turn a compromised admin session into
 * stored XSS on every visitor.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-chronicle">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
