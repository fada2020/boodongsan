import Navbar from "@/components/Navbar";
import NewsList from "@/components/NewsList";
import { headers } from "next/headers";

type NewsItem = { title: string; link: string; pubDate?: string; source?: string };

async function getNews(q?: string, src?: string): Promise<{ items: NewsItem[]; xSource?: string }> {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  // Prefer the incoming request host; fall back to configured base url
  const base = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
  const usp = new URLSearchParams();
  if (q) usp.set('q', q);
  if (src) usp.set('src', src);
  const url = `${base}/api/news${usp.size ? `?${usp.toString()}` : ''}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return { items: [], xSource: 'fetch-failed' };
  const xSource = res.headers.get('x-source') || undefined;
  const items = await res.json();
  return { items, xSource };
}

export default async function NewsPage({ searchParams }: { searchParams?: { [k: string]: string | string[] | undefined } }) {
  const q = typeof searchParams?.q === 'string' ? searchParams!.q : undefined;
  const src = typeof searchParams?.src === 'string' ? searchParams!.src : undefined;
  const { items, xSource } = await getNews(q, src);
  return (
    <>
      <Navbar />
      <h2 className="text-xl font-semibold mb-4">정책 뉴스</h2>
      <NewsList initial={items} sourceTag={xSource} />
    </>
  );
}
