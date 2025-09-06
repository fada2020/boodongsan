import { NextResponse } from "next/server";
import type { NewsItem } from "@/lib/rss";
import { parseAtom, parseRss } from "@/lib/rss";

// Ensure the route is always dynamic and not statically cached
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const srcFilter = (searchParams.get('src') || '').trim().toLowerCase();

  const fallback: NewsItem[] = [
    { title: "정책 뉴스 샘플 1", link: "https://www.korea.kr/", source: "샘플", pubDate: "" },
    { title: "정책 뉴스 샘플 2", link: "https://www.korea.kr/", source: "샘플", pubDate: "" }
  ];

  const urls = getFeedUrls();
  try {
    const results = await Promise.allSettled(urls.map((u) => fetchAndParse(u)));
    let items: NewsItem[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') items = items.concat(r.value);
    }
    // de-duplicate by link
    const uniq = new Map<string, NewsItem>();
    for (const it of items) {
      if (!uniq.has(it.link)) uniq.set(it.link, it);
    }
    items = Array.from(uniq.values());

    // optional filters
    if (q) items = items.filter((n) => n.title.toLowerCase().includes(q));
    if (srcFilter) items = items.filter((n) => (n.source || '').toLowerCase().includes(srcFilter));

    // sort by date desc when possible
    const withTime = items.map((n) => ({
      ...n,
      _ts: n.pubDate ? Date.parse(n.pubDate) : Number.NaN
    }));
    withTime.sort((a, b) => {
      const ta = isNaN(a._ts) ? -Infinity : a._ts;
      const tb = isNaN(b._ts) ? -Infinity : b._ts;
      return tb - ta;
    });
    const out = withTime.map(({ _ts, ...rest }) => rest).slice(0, 60);
    if (out.length === 0) {
      return NextResponse.json(fallback, { headers: { "x-source": "fallback-empty-parse" } });
    }
    return NextResponse.json(out, { headers: { "x-source": `multi(${urls.length})` } });
  } catch (_e) {
    return NextResponse.json(fallback, { headers: { "x-source": "fallback-error" } });
  }
}

function getFeedUrls(): string[] {
  const multiple = process.env.NEWS_RSS_URLS;
  if (multiple && multiple.trim()) {
    return multiple
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const single = process.env.NEWS_RSS_URL;
  return [single || "https://www.korea.kr/rss/policy.xml"];
}

async function fetchAndParse(feedUrl: string): Promise<NewsItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(feedUrl, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "real-estate-web/1.0 (+https://example.com)",
        Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8",
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    let items = parseRss(xml);
    if (!items.length) items = parseAtom(xml);
    const label = inferSourceLabel(feedUrl);
    return items.map((n) => ({ ...n, source: n.source || label }));
  } catch (_e) {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function inferSourceLabel(u: string) {
  try {
    const host = new URL(u).host;
    if (host.includes("google")) return "Google 뉴스";
    if (host.includes("naver")) return "네이버 뉴스";
    if (host.includes("korea.kr")) return "Korea.kr";
    return host;
  } catch {
    return "뉴스";
  }
}
