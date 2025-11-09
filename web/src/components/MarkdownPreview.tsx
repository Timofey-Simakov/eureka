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

    const contentWithWikiLinks = parseWikiLinks(content, pages);

    const rawHtml = marked(contentWithWikiLinks, { breaks: true });
    const cleanHtml = DOMPurify.sanitize(rawHtml as string);

    containerRef.current.innerHTML = cleanHtml;

    const images = containerRef.current.querySelectorAll<HTMLImageElement>("img");
    images.forEach((img) => {
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.borderRadius = "8px";
      img.style.marginTop = "16px";
      img.style.marginBottom = "16px";
      img.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
      img.style.cursor = "pointer";

      img.addEventListener("click", () => {
        window.open(img.src, "_blank");
      });
    });

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

    const allLinks = containerRef.current.querySelectorAll<HTMLAnchorElement>("a:not(.wiki-link-exists):not(.wiki-link-missing)");
    allLinks.forEach((link) => {
      let href = link.getAttribute("href");
      if (href) {
        const isExternal = href.startsWith("http://") ||
                          href.startsWith("https://") ||
                          href.startsWith("//") ||
                          /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(href);

        if (isExternal) {
          if (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("//")) {
            href = "https://" + href;
            link.setAttribute("href", href);
          }
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");

          link.addEventListener("click", (e) => {
            e.stopPropagation();
          });
        }
      }
    });

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
