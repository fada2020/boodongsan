"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type NewsItem = { title: string; link: string; pubDate?: string; source?: string };

export default function NewsList({ initial, sourceTag }: { initial: NewsItem[]; sourceTag?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const q = (sp.get("q") || "");
  const src = (sp.get("src") || "전체");
  const rawPage = parseInt(sp.get("page") || "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const perPage = 10;

  const updateQuery = (next: { q?: string; src?: string; page?: number }) => {
    const params = new URLSearchParams(sp.toString());
    if (next.q !== undefined) {
      const v = next.q.trim();
      if (v) params.set("q", v); else params.delete("q");
    }
    if (next.src !== undefined) {
      const v = next.src.trim();
      if (v && v !== "전체") params.set("src", v); else params.delete("src");
    }
    if (next.page !== undefined) {
      const p = Math.max(1, Math.floor(next.page));
      if (p > 1) params.set("page", String(p)); else params.delete("page");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of initial) {
      const key = (n.source || "기타").trim();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const total = initial.length;
    return { entries, total };
  }, [initial]);

  const tabs = useMemo(() => ["전체", ...sources.entries.map(([label]) => label)], [sources]);
  const selectedIndex = Math.max(0, tabs.findIndex((t) => t === src));

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    // client-side safety filter; server already sorts by newest
    const arr = initial.filter((n) => {
      const byKeyword = !k || n.title.toLowerCase().includes(k);
      const label = (n.source || "기타").trim();
      const bySource = src === "전체" || label === src;
      return byKeyword && bySource;
    });
    return arr;
  }, [q, src, initial]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.max(1, Math.min(totalPages, page));
  const slice = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const go = (p: number) => updateQuery({ page: Math.max(1, Math.min(totalPages, p)) });

  const hintFromSource = (() => {
    if (!sourceTag) return undefined;
    if (sourceTag.startsWith('fallback-error')) return '네트워크 오류 또는 원본 접근 불가로 샘플 데이터를 표시 중입니다.';
    if (sourceTag.startsWith('fallback-empty-parse')) return '피드 파싱 실패 또는 빈 피드로 샘플 데이터를 표시 중입니다.';
    if (sourceTag.startsWith('fallback')) return '현재 샘플 데이터를 표시 중입니다.';
    return undefined;
  })();

  // Correct out-of-range page in URL
  useEffect(() => {
    if (page !== currentPage) updateQuery({ page: currentPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, currentPage]);

  return (
    <div>
      {/* Source tabs */}
      <div
        className="mb-3 flex items-center gap-2 overflow-x-auto"
        role="tablist"
        aria-label="뉴스 소스 선택"
      >
        <button
          onClick={() => { updateQuery({ src: "전체", page: 1 }); }}
          className={"px-3 py-1.5 rounded border whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 " + (src === "전체" ? "bg-white border-slate-900/20 text-slate-900" : "text-slate-600 hover:bg-slate-50")}
          role="tab"
          aria-selected={src === "전체"}
          id={`tab-0`}
          aria-controls="news-panel"
        >
          전체 <span className="ml-1 text-xs text-slate-500">{sources.total}</span>
        </button>
        {sources.entries.map(([label, count]) => (
          <button
            key={label}
            onClick={() => { updateQuery({ src: label, page: 1 }); }}
            className={"px-3 py-1.5 rounded border whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 " + (src === label ? "bg-white border-slate-900/20 text-slate-900" : "text-slate-600 hover:bg-slate-50")}
            role="tab"
            aria-selected={src === label}
            id={`tab-${tabs.findIndex((t) => t === label)}`}
            aria-controls="news-panel"
            title={label}
          >
            {label} <span className="ml-1 text-xs text-slate-500">{count}</span>
          </button>
        ))}
      </div>

      <form className="flex items-center gap-2 mb-4" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="news-search" className="sr-only">뉴스 키워드 검색</label>
        <input
          value={q}
          onChange={(e) => { updateQuery({ q: e.target.value, page: 1 }); }}
          placeholder="키워드로 필터 (예: 부동산, 정책)"
          aria-label="뉴스 키워드 검색"
          id="news-search"
          className="w-full max-w-md rounded-lg border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        />
        <span className="text-sm text-slate-500">{total}건</span>
      </form>
      {hintFromSource ? (
        <div className="mb-3 rounded border border-amber-200 bg-amber-50 text-amber-800 text-sm px-3 py-2">
          {hintFromSource} <span className="opacity-60">({sourceTag})</span>
        </div>
      ) : null}
      <div role="region" id="news-panel" aria-labelledby={`tab-${selectedIndex}`}>
        {initial.length === 0 && total === 0 ? (
          <div className="rounded-lg border p-6 text-sm text-slate-600 bg-slate-50">
            결과가 없습니다. 설정한 RSS 주소를 확인해주세요.
            <div className="mt-2 text-slate-500">
              - RSS/Atom XML이어야 하며, 일반 뉴스 페이지 URL은 동작하지 않습니다.
            </div>
          </div>
        ) : null}
        {initial.length > 0 && total === 0 ? (
          <div className="rounded-lg border p-6 text-sm text-slate-600 bg-slate-50">
            필터 조건에 맞는 결과가 없습니다. 키워드나 소스를 변경해 보세요.
          </div>
        ) : null}
        <ul className="space-y-3">
          {slice.map((n, i) => (
            <li key={`${n.link}-${i}`} className="p-4 rounded-lg border hover:shadow-sm transition">
              <a href={n.link} target="_blank" className="font-medium text-brand-600">{n.title}</a>
              <div className="text-xs text-slate-500 mt-1">{n.source ?? 'source'} · {n.pubDate ?? ''}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button onClick={() => go(currentPage - 1)} disabled={currentPage <= 1} className="px-3 py-1.5 rounded border disabled:opacity-50">이전</button>
        <span className="text-sm">{currentPage} / {totalPages}</span>
        <button onClick={() => go(currentPage + 1)} disabled={currentPage >= totalPages} className="px-3 py-1.5 rounded border disabled:opacity-50">다음</button>
      </div>
    </div>
  );
}
