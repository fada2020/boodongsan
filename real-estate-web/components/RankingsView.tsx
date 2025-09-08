"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { prevYYYYMM } from "@/lib/stats";
import { rankRegionsForMonth } from "@/lib/ranking";
import SearchBox from "@/components/SearchBox";

type Tx = { regionCode: string; name: string; date: string; price: number; aptName?: string; area?: number; floor?: number; buildYear?: number; jibun?: string };

export default function RankingsView() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const lawdCd = sp.get("lawdCd") || "11500";
  const name = sp.get("name") || "";
  const dealYmd = sp.get("dealYmd") || toYYYYMM(new Date());
  const sort = (sp.get("sort") || "score") as "score" | "count" | "avgPrice";
  const mode = (sp.get("mode") || "sale") as "sale" | "lease";

  const [loading, setLoading] = useState(false);
  const [itemsCur, setItemsCur] = useState<Tx[]>([]);
  const [itemsPrev, setItemsPrev] = useState<Tx[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [detailName, setDetailName] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState<string | null>(null);

  const updateQuery = (next: { lawdCd?: string; name?: string; dealYmd?: string; sort?: string; mode?: string }) => {
    const params = new URLSearchParams(sp.toString());
    if (next.lawdCd !== undefined) {
      const v = next.lawdCd.trim();
      if (v) params.set("lawdCd", v); else params.delete("lawdCd");
    }
    if (next.name !== undefined) {
      const v = next.name.trim();
      if (v) params.set("name", v); else params.delete("name");
    }
    if (next.dealYmd !== undefined) {
      const v = next.dealYmd.trim();
      if (v) params.set("dealYmd", v); else params.delete("dealYmd");
    }
    if (next.sort !== undefined) {
      const v = next.sort.trim();
      if (v && v !== "score") params.set("sort", v); else params.delete("sort");
    }
    if (next.mode !== undefined) {
      const v = next.mode.trim();
      if (v && v !== "sale") params.set("mode", v); else params.delete("mode");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  useEffect(() => {
    const ctrl = new AbortController();
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const prev = prevYYYYMM(dealYmd);
        const urls = mode === 'lease'
          ? [
              `/api/leases?lawdCd=${encodeURIComponent(lawdCd)}&dealYmd=${dealYmd}&strict=1`,
              `/api/leases?lawdCd=${encodeURIComponent(lawdCd)}&dealYmd=${prev}&strict=1`,
            ]
          : [
              `/api/transactions?lawdCd=${encodeURIComponent(lawdCd)}&dealYmd=${dealYmd}&strict=1`,
              `/api/transactions?lawdCd=${encodeURIComponent(lawdCd)}&dealYmd=${prev}&strict=1`,
            ];
        const [r1, r2] = await Promise.all(urls.map(u => fetch(u, { signal: ctrl.signal })));
        
        // API 응답 헤더 체크
        console.log('🔍 API Debug - Current month response headers:', Object.fromEntries(r1.headers.entries()));
        console.log('🔍 API Debug - Previous month response headers:', Object.fromEntries(r2.headers.entries()));
        
        if (!r1.ok || !r2.ok) throw new Error("fetch-failed");
        const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
        
        console.log('🔍 API Debug - Current month data length:', d1?.length || 0);
        console.log('🔍 API Debug - Previous month data length:', d2?.length || 0);
        console.log('🔍 API Debug - Query params:', { lawdCd, dealYmd, prev, mode });
        
        const mapLease = (arr: any[]) => arr.map((t) => ({ ...t, price: t.deposit }));
        const curArr = mode === 'lease' ? mapLease(d1 || []) : (d1 || []);
        const prevArr = mode === 'lease' ? mapLease(d2 || []) : (d2 || []);
        setItemsCur(curArr as Tx[]);
        setItemsPrev(prevArr as Tx[]);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message || "failed");
      } finally {
        setLoading(false);
      }
    }
    run();
    return () => ctrl.abort();
  }, [lawdCd, dealYmd, mode]);

  const ranks = useMemo(() => {
    // Combine for ranking but counts are computed by month inside the util;
    const base = rankRegionsForMonth([...(itemsCur || []), ...(itemsPrev || [])], dealYmd, prevYYYYMM(dealYmd));
    const sorted = [...base].sort((a, b) => {
      if (sort === "count") return b.count - a.count;
      if (sort === "avgPrice") return b.avgPrice - a.avgPrice;
      return b.score - a.score; // default
    });
    return sorted;
  }, [itemsCur, itemsPrev, sort, dealYmd]);

  const total = ranks.length;
  const curMonth = dealYmd;
  const [detailSort, setDetailSort] = useState<'date' | 'price' | 'area' | 'floor'>('date');
  const [minArea, setMinArea] = useState<string>('');
  const [maxArea, setMaxArea] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [detailMonth, setDetailMonth] = useState<string>(dealYmd);
  const [detailFetch, setDetailFetch] = useState<Tx[] | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const detail = useMemo(() => {
    if (!detailName || !detailKey) return { list: [] as Tx[], monthPrefix: '' };
    
    const toNum = (s: string) => {
      const cleaned = (s || '').replace(/[^0-9.]/g, '');
      if (!cleaned || cleaned === '') return undefined; // 빈 문자열은 undefined 반환
      const n = Number(cleaned);
      return Number.isFinite(n) && n > 0 ? n : undefined; // 0보다 큰 값만 유효
    };
    const minA = toNum(minArea);
    const maxA = toNum(maxArea);
    const minP = toNum(minPrice);
    const maxP = toNum(maxPrice);
    const targetYYYYMM = detailMonth || curMonth;
    const curPrefix = `${targetYYYYMM.slice(0,4)}-${targetYYYYMM.slice(4,6)}`;
    const groupKeyOf = (t: Tx) => (t.regionCode && /-/.test(t.regionCode)) ? t.regionCode : (t.name || t.regionCode);
    
    // Fix: 랭킹과 동일한 데이터 소스를 사용하여 일관성 확보
    let src = itemsCur;
    if (targetYYYYMM !== curMonth && detailFetch) {
      // 다른 월을 선택한 경우 별도 fetch된 데이터 사용
      src = detailFetch;
    } else if (targetYYYYMM === curMonth) {
      // 현재 월인 경우 랭킹 계산과 동일한 전체 데이터 사용 (현재월 + 이전월)
      src = [...(itemsCur || []), ...(itemsPrev || [])];
    }
    
    let arr = src.filter((t) => groupKeyOf(t) === detailKey && t.date.startsWith(curPrefix));
    arr = arr.filter((t) => {
      const a = t.area;
      const p = t.price;
      if (minA !== undefined && a !== undefined && a < minA) return false;
      if (maxA !== undefined && a !== undefined && a > maxA) return false;
      if (minP !== undefined && p < minP) return false;
      if (maxP !== undefined && p > maxP) return false;
      return true;
    });
    arr.sort((a, b) => {
      if (detailSort === 'price') return Math.round(b.price - a.price);
      if (detailSort === 'area') return Math.round((b.area || 0) - (a.area || 0));
      if (detailSort === 'floor') return Math.round((b.floor || 0) - (a.floor || 0));
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });
    return { list: arr.slice(0, 20), monthPrefix: curPrefix };
  }, [detailName, detailKey, itemsCur, itemsPrev, curMonth, detailSort, minArea, maxArea, minPrice, maxPrice, detailMonth, detailFetch]);

  useEffect(() => {
    if (!detailName || !detailKey) return;
    if (detailMonth === curMonth) { setDetailFetch(null); return; }
    let alive = true;
    setDetailLoading(true);
    (async () => {
      const url = mode === 'lease'
        ? `/api/leases?lawdCd=${encodeURIComponent(lawdCd)}&dealYmd=${detailMonth}&strict=1`
        : `/api/transactions?lawdCd=${encodeURIComponent(lawdCd)}&dealYmd=${detailMonth}&strict=1`;
      const r = await fetch(url, { cache: 'no-store' });
      const data = await r.json();
      const mapLease = (arr: any[]) => arr.map((t) => ({ ...t, price: t.deposit }));
      const normalized: Tx[] = mode === 'lease' ? mapLease(data || []) : (data || []);
      if (!alive) return;
      setDetailFetch(normalized);
      setDetailLoading(false);
    })().catch(() => { if (alive) setDetailLoading(false); });
    return () => { alive = false; };
  }, [detailName, detailKey, detailMonth, mode, lawdCd, curMonth]);

  return (
    <div>
      <div className="mb-4">
        <SearchBox onSelect={(l) => {
          const base = l.code.includes('-') ? l.code.split('-')[0] : l.code;
          // 시(2자리) 선택 시에는 그대로 두되, 사용자에게 구 단위 선택을 유도
          const nextCode = base.length >= 5 ? base.slice(0, 5) : base;
          updateQuery({ lawdCd: nextCode, name: l.name });
        }} />
        <div className="mt-2 text-sm text-slate-600">선택: {name || '없음'} {lawdCd ? `(법정동 ${lawdCd})` : ''}</div>
      </div>

      <form className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">거래 유형</label>
          <div className="inline-flex rounded border overflow-hidden">
            <button type="button" onClick={() => updateQuery({ mode: 'sale' })} className={`px-3 py-2 text-sm ${mode==='sale' ? 'bg-white' : 'bg-slate-50 text-slate-600'}`}>매매</button>
            <button type="button" onClick={() => updateQuery({ mode: 'lease' })} className={`px-3 py-2 text-sm border-l ${mode==='lease' ? 'bg-white' : 'bg-slate-50 text-slate-600'}`}>전월세</button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="month" className="text-xs text-slate-600">조회 월</label>
          <input id="month" type="month" value={toMonthInputValue(dealYmd)} onChange={(e) => updateQuery({ dealYmd: fromMonthInputValue(e.target.value) })} className="rounded border px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sort" className="text-xs text-slate-600">정렬</label>
          <select id="sort" value={sort} onChange={(e) => updateQuery({ sort: e.target.value })} className="rounded border px-3 py-2">
            <option value="score">지수(종합)</option>
            <option value="count">거래건수</option>
            <option value="avgPrice">{mode==='lease' ? '평균 보증금' : '평균가'}</option>
          </select>
        </div>
        <div className="flex items-end text-sm text-slate-500">총 {total}개 지역</div>
      </form>

      {error ? (
        <div className="rounded border border-rose-200 bg-rose-50 text-rose-800 px-3 py-2 text-sm">데이터를 불러오지 못했습니다.</div>
      ) : null}
      {loading ? (
        <div className="rounded border px-3 py-2 text-sm">불러오는 중…</div>
      ) : null}

      {!loading && total === 0 ? (
        <div className="rounded border px-3 py-6 text-sm text-slate-600">
          결과가 없습니다. 다른 월이나 지역 코드를 시도해 보세요.
          <br />
          <span className="text-xs text-slate-500 mt-1 block">💡 현재 데이터는 2024년 12월까지만 제공됩니다.</span>
        </div>
      ) : null}

      {total > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">순위</th>
                <th className="px-3 py-2 text-left">지역(동/구)</th>
                <th className="px-3 py-2 text-right">거래 건수</th>
                <th className="px-3 py-2 text-right">{mode==='lease' ? '평균 보증금(만원)' : '평균 가격(만원)'} </th>
                <th className="px-3 py-2 text-right">거래량 증감률(전월)</th>
                <th className="px-3 py-2 text-right">중위가 증감률(전월)</th>
                <th className="px-3 py-2 text-right">모멘텀</th>
                <th className="px-3 py-2 text-right">상세</th>
              </tr>
            </thead>
            <tbody>
              {ranks.map((r, i) => (
                <tr key={r.code} className="border-t">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">
                    <a className="text-brand-600 hover:underline" href={`https://map.naver.com/p/search/${encodeURIComponent(String(r.name || ''))}`} target="_blank" rel="noopener noreferrer">{r.name}</a>
                  </td>
                  <td className="px-3 py-2 text-right">{r.count}</td>
                  <td className="px-3 py-2 text-right">{Math.round(r.avgPrice).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{Math.round((r.momCount ?? 0) * 100)}%</td>
                  <td className="px-3 py-2 text-right">{Math.round((r.momPrice ?? 0) * 100)}%</td>
                  <td className="px-3 py-2 text-right">
                    <span className={momentumClass(r.score)}>
                      {momentumLabel(r.score)} <span className="opacity-70">({r.score})</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => { setDetailName(r.name); setDetailKey(r.code); }} className="px-2 py-1 rounded border text-xs hover:bg-slate-50">보기</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : null}

      {detailName ? (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">상세 거래: {detailName}</h3>
              <select value={detailMonth} onChange={(e) => setDetailMonth(e.target.value)} className="rounded border px-2 py-1 text-sm" aria-label="상세 표시 월">
                {lastMonths(curMonth, 6).map((m) => (
                  <option key={m} value={m}>{m.slice(0,4)}-{m.slice(4,6)}</option>
                ))}
              </select>
              {detailLoading ? <span className="text-xs text-slate-500">불러오는 중…</span> : null}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => exportCsv(detail.list)} className="px-2 py-1 rounded border text-xs hover:bg-slate-50">CSV 내보내기</button>
              <button onClick={() => setDetailName(null)} className="px-2 py-1 rounded border text-xs hover:bg-slate-50">닫기</button>
            </div>
          </div>
          {detail.list.length === 0 ? (
            <div className="rounded border px-3 py-4 text-sm text-slate-600">해당 월에 상세 거래가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <form className="p-3 grid grid-cols-2 md:grid-cols-6 gap-2 border-b bg-slate-50" onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col">
                  <label className="text-xs text-slate-600">정렬</label>
                  <select value={detailSort} onChange={(e) => setDetailSort(e.target.value as any)} className="rounded border px-3 py-2">
                    <option value="date">거래날짜 최신</option>
                    <option value="price">{mode==='lease' ? '보증금 높은 순' : '가격 높은 순'}</option>
                    <option value="area">면적 큰 순</option>
                    <option value="floor">층수 높은 순</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-slate-600">최소 면적(㎡)</label>
                  <input value={minArea} onChange={(e) => setMinArea(e.target.value)} className="rounded border px-3 py-2" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-slate-600">최대 면적(㎡)</label>
                  <input value={maxArea} onChange={(e) => setMaxArea(e.target.value)} className="rounded border px-3 py-2" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-slate-600">{mode==='lease' ? '최소 보증금(만원)' : '최소 가격(만원)'} </label>
                  <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="rounded border px-3 py-2" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-slate-600">{mode==='lease' ? '최대 보증금(만원)' : '최대 가격(만원)'} </label>
                  <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="rounded border px-3 py-2" />
                </div>
              </form>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">단지명</th>
                    <th className="px-3 py-2 text-right">층수</th>
                    <th className="px-3 py-2 text-right">전용면적(㎡)</th>
                    {mode==='lease' ? (
                      <>
                        <th className="px-3 py-2 text-right">보증금</th>
                        <th className="px-3 py-2 text-right">월세</th>
                      </>
                    ) : (
                      <th className="px-3 py-2 text-right">실거래가</th>
                    )}
                    <th className="px-3 py-2 text-right">거래날짜</th>
                    <th className="px-3 py-2 text-right">건축년도</th>
                    <th className="px-3 py-2 text-left">도로명주소</th>
                    <th className="px-3 py-2 text-left">지번주소</th>
                    <th className="px-3 py-2 text-left">지도</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.list.map((t, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{t.aptName || '-'}</td>
                      <td className="px-3 py-2 text-right">{t.floor ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{t.area ? Math.round(t.area).toLocaleString() : '-'}</td>
                      {mode==='lease' ? (
                        <>
                          <td className="px-3 py-2 text-right">{(t as any).deposit ? formatPriceEok((t as any).deposit) : '-'}</td>
                          <td className="px-3 py-2 text-right">{(t as any).monthlyRent ? `${Math.round((t as any).monthlyRent).toLocaleString()}만` : '-'}</td>
                        </>
                      ) : (
                        <td className="px-3 py-2 text-right" title={`${Math.round(t.price).toLocaleString()} 만원`}>{formatPriceEok(t.price)}</td>
                      )}
                      <td className="px-3 py-2 text-right">{t.date}</td>
                      <td className="px-3 py-2 text-right">{t.buildYear ?? '-'}</td>
                      <td className="px-3 py-2">{(t as any).roadAddress ?? '-'}</td>
                      <td className="px-3 py-2">{t.jibun ?? ''}</td>
                      <td className="px-3 py-2 text-left">
                        <a href={naverMapUrl((t as any).roadAddress || `${t.name} ${t.jibun || ''}`)} target="_blank" rel="noopener noreferrer" className="inline-block text-brand-600 hover:underline mr-2">네이버</a>
                        <a href={kakaoMapUrl((t as any).roadAddress || `${t.name} ${t.jibun || ''}`)} target="_blank" rel="noopener noreferrer" className="inline-block text-slate-700 hover:underline">카카오</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function toYYYYMM(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

function toMonthInputValue(yyyymm: string) {
  if (/^\d{6}$/.test(yyyymm)) return `${yyyymm.slice(0, 4)}-${yyyymm.slice(4)}`;
  return "";
}

function fromMonthInputValue(v: string) {
  if (/^\d{4}-\d{2}$/.test(v)) return v.replace("-", "");
  return v;
}

function lastMonths(baseYYYYMM: string, n: number): string[] {
  const y = Number(baseYYYYMM.slice(0,4));
  const m = Number(baseYYYYMM.slice(4));
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(y, m - 1 - i, 1);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    out.push(`${yy}${mm}`);
  }
  return out;
}

function momentumLabel(score: number) {
  if (score >= 80) return '매우 강함';
  if (score >= 60) return '강함';
  if (score >= 40) return '중립';
  if (score >= 20) return '약함';
  return '매우 약함';
}

function formatPriceEok(manyon: number) {
  const won = Math.round(manyon) * 10000;
  const eok = Math.floor(won / 100_000_000);
  const rem = Math.round((won % 100_000_000) / 10000); // 만원 단위
  if (eok > 0) {
    return rem > 0 ? `${eok}억 ${rem.toLocaleString()}만` : `${eok}억`;
  }
  return `${rem.toLocaleString()}만`;
}

function momentumClass(score: number) {
  if (score >= 80) return 'inline-block rounded px-2 py-0.5 bg-emerald-50 text-emerald-700';
  if (score >= 60) return 'inline-block rounded px-2 py-0.5 bg-green-50 text-green-700';
  if (score >= 40) return 'inline-block rounded px-2 py-0.5 bg-slate-100 text-slate-700';
  if (score >= 20) return 'inline-block rounded px-2 py-0.5 bg-amber-50 text-amber-700';
  return 'inline-block rounded px-2 py-0.5 bg-rose-50 text-rose-700';
}

function naverMapUrl(q: string) {
  return `https://map.naver.com/p/search/${encodeURIComponent(q.trim())}`;
}

function kakaoMapUrl(q: string) {
  return `https://map.kakao.com/?q=${encodeURIComponent(q.trim())}`;
}

function exportCsv(rows: Tx[]) {
  if (!rows.length) return;
  const header = ['단지명','층수','전용면적(㎡)','실거래가(만원)','거래날짜','건축년도','도로명주소','지번주소'];
  const body = rows.map((t) => [
    (t.aptName || ''),
    (t.floor ?? ''),
    (t.area ? Math.round(t.area) : ''),
    Math.round(t.price),
    t.date,
    (t.buildYear ?? ''),
    ((t as any).roadAddress ?? ''),
    (t.jibun ?? ''),
  ]);
  const csv = [header, ...body]
    .map((r) => r.map((v) => String(v).includes(',') ? `"${String(v).replace(/"/g,'""')}"` : String(v)).join(','))
    .join('\n');
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rankings_detail_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
