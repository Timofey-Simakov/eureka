import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { parseWikiLinks } from "../lib/wikiLinks";
import { theme } from "../styles/theme";

interface MarkdownPreviewProps {
  content: string;
  pages: Array<{ id: string; name: string }>;
}

export default function MarkdownPreview({ content, pages }: MarkdownPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!containerRef.current) return;

    // First, process wiki links
    const contentWithWikiLinks = parseWikiLinks(content, pages);

    // Then, render markdown
    const rawHtml = marked(contentWithWikiLinks, { breaks: true });
    const cleanHtml = DOMPurify.sanitize(rawHtml as string);

    containerRef.current.innerHTML = cleanHtml;

    // Style images
    const images = containerRef.current.querySelectorAll<HTMLImageElement>("img");
    images.forEach((img) => {
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.borderRadius = "8px";
      img.style.marginTop = "16px";
      img.style.marginBottom = "16px";
      img.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
      img.style.cursor = "pointer";

      // Add click to open in new tab
      img.addEventListener("click", () => {
        window.open(img.src, "_blank");
      });
    });

    // Add click handlers for wiki links (internal pages only)
    const wikiLinks = containerRef.current.querySelectorAll<HTMLAnchorElement>(".wiki-link-exists");
    wikiLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const pageId = link.getAttribute("data-page-id");
        if (pageId) {
          nav(`/view/${pageId}`);
        }
      });
    });

    // Ensure external links open in new tab and don't use React router
    const allLinks = containerRef.current.querySelectorAll<HTMLAnchorElement>("a:not(.wiki-link-exists):not(.wiki-link-missing)");
    allLinks.forEach((link) => {
      let href = link.getAttribute("href");
      if (href) {
        // Check if it's an external link (has protocol or looks like a domain)
        const isExternal = href.startsWith("http://") ||
                          href.startsWith("https://") ||
                          href.startsWith("//") ||
                          /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(href); // matches domain.com pattern

        if (isExternal) {
          // Add protocol if missing
          if (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("//")) {
            href = "https://" + href;
            link.setAttribute("href", href);
          }
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");

          // Prevent React Router from handling this link
          link.addEventListener("click", (e) => {
            e.stopPropagation();
          });
        }
      }
    });

    // Cleanup
    return () => {
      wikiLinks.forEach((link) => {
        link.removeEventListener("click", () => {});
      });
    };
  }, [content, pages, nav]);

  return (
    <div
      ref={containerRef}
      style={{
        lineHeight: "1.7",
        fontSize: theme.fontSize.base,
        color: theme.colors.neutral[800],
        wordWrap: "break-word",
        overflowWrap: "break-word",
      }}
      className="markdown-preview"
    />
  );
}
