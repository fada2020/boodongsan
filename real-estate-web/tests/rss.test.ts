import { describe, expect, it } from 'vitest';
import { parseRss, parseAtom } from '../lib/rss';

const sampleRss = `<?xml version="1.0"?><rss><channel><title>Korea.kr 정책</title>
  <item><title><![CDATA[ 첫 번째 뉴스 ]]></title><link>https://example.com/a</link><pubDate>Mon, 02 Sep 2024 10:00:00 +0900</pubDate></item>
  <item><title>두 번째 뉴스</title><link>https://example.com/b</link><pubDate>Mon, 01 Sep 2024 09:00:00 +0900</pubDate><source>Korea.kr</source></item>
</channel></rss>`;

const sampleAtom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Google 뉴스 - 부동산 정책</title>
  <entry>
    <title>Google 첫 뉴스</title>
    <link href="https://news.google.com/articles/abc"/>
    <updated>2024-09-02T01:00:00Z</updated>
  </entry>
  <entry>
    <title><![CDATA[ Google 두 번째 ]]></title>
    <id>https://news.google.com/articles/def</id>
    <published>2024-09-01T01:00:00Z</published>
  </entry>
</feed>`;

describe('parseRss', () => {
  it('parses items with title/link/pubDate', () => {
    const out = parseRss(sampleRss);
    expect(out.length).toBe(2);
    expect(out[0].title).toMatch('첫 번째 뉴스');
    expect(out[0].link).toBe('https://example.com/a');
    expect(out[0].pubDate).toBeTruthy();
    expect(out[1].source || '').toContain('Korea');
  });

  it('returns empty for malformed xml', () => {
    const out = parseRss('<rss><channel></channel></rss>');
    expect(out.length).toBe(0);
  });
});

describe('parseAtom', () => {
  it('parses entries with link href or id fallback', () => {
    const out = parseAtom(sampleAtom);
    const links = out.map((x) => x.link);
    expect(out.length).toBe(2);
    expect(links).toContain('https://news.google.com/articles/abc');
    expect(links).toContain('https://news.google.com/articles/def');
  });
});

