// Check if text looks like a URL
function isURL(text: string): boolean {
  // Check for common URL patterns
  const urlPattern = /^(https?:\/\/|www\.)/i;
  const domainPattern = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/;
  return urlPattern.test(text) || domainPattern.test(text);
}

// Parse [[Page Name]] into clickable links
export function parseWikiLinks(text: string, pages: Array<{id: string, name: string}>): string {
  let result = text;

  // Find all [[...]] patterns
  const regex = /\[\[([^\]]+)\]\]/g;

  result = result.replace(regex, (_match, pageName) => {
    const trimmedName = pageName.trim();

    // Check if it's a URL - if so, convert to regular markdown link
    if (isURL(trimmedName)) {
      const url = trimmedName.startsWith('http') ? trimmedName : `https://${trimmedName}`;
      return `[${trimmedName}](${url})`;
    }

    const page = pages.find(p => p.name === trimmedName);

    if (page) {
      // Page exists - create a link
      return `<a href="/editor/${page.id}" class="wiki-link wiki-link-exists" data-page-id="${page.id}">${trimmedName}</a>`;
    } else {
      // Page doesn't exist - show as unlinked
      return `<span class="wiki-link wiki-link-missing" title="Страница не найдена">${trimmedName}</span>`;
    }
  });

  return result;
}

// Extract all wiki link names from text
export function extractWikiLinkNames(text: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1].trim());
  }

  return matches;
}
