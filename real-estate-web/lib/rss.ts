export type NewsItem = { title: string; link: string; pubDate?: string; source?: string };

function stripCdata(s: string) {
  return s.replace(/<!\[CDATA\[/g, "").replace(/]]>/g, "").trim();
}

function extractAll(xml: string, tag: string) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(stripCdata(m[1]));
  return out;
}

export function parseRss(xml: string): NewsItem[] {
  const items = xml.split(/<item\b[^>]*>/i).slice(1).map((chunk) => chunk.split(/<\/item>/i)[0]);
  const parsed: NewsItem[] = items.map((it) => {
    const title = extractAll(it, "title")[0] ?? "";
    const link = extractAll(it, "link")[0] ?? "";
    const pubDate = extractAll(it, "pubDate")[0] ?? undefined;
    const source = extractAll(it, "source")[0] ?? undefined;
    return { title, link, pubDate, source };
  });
  return parsed.filter((n) => n.title && n.link);
}

export function parseAtom(xml: string): NewsItem[] {
  const entries = xml.split(/<entry\b[^>]*>/i).slice(1).map((chunk) => chunk.split(/<\/entry>/i)[0]);
  const parsed: NewsItem[] = entries.map((it) => {
    const title = extractAll(it, "title")[0] ?? "";
    const linkHrefMatch = it.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/>|<link[^>]*href=["']([^"']+)["'][^>]*>/i);
    const link = (linkHrefMatch && (linkHrefMatch[1] || linkHrefMatch[2])) || extractAll(it, "id")[0] || "";
    const pubDate = extractAll(it, "updated")[0] || extractAll(it, "published")[0] || undefined;
    return { title, link, pubDate };
  });
  return parsed.filter((n) => n.title && n.link);
}
