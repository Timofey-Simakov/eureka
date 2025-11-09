function isURL(text: string): boolean {
  const urlPattern = /^(https?:\/\/|www\.)/i;
  const domainPattern = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/;
  return urlPattern.test(text) || domainPattern.test(text);
}

export function parseWikiLinks(text: string, pages: Array<{id: string, name: string}>): string {
  let result = text;

  const regex = /\[\[([^\]]+)\]\]/g;

  result = result.replace(regex, (_match, pageName) => {
    const trimmedName = pageName.trim();

    if (isURL(trimmedName)) {
      const url = trimmedName.startsWith('http') ? trimmedName : `https://${trimmedName}`;
      return `[${trimmedName}](${url})`;
    }

    const page = pages.find(p => p.name === trimmedName);

    if (page) {
      return `<a href="/editor/${page.id}" class="wiki-link wiki-link-exists" data-page-id="${page.id}">${trimmedName}</a>`;
    } else {
      return `<span class="wiki-link wiki-link-missing" title="Страница не найдена">${trimmedName}</span>`;
    }
  });

  return result;
}

export function extractWikiLinkNames(text: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1].trim());
  }

  return matches;
}
