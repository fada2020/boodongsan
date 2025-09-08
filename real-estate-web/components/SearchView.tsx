"use client";
import SearchBox from "@/components/SearchBox";
import { useEffect, useMemo, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { prevYYYYMM } from "@/lib/stats";
import locations from "@/data/locations.json";

type Tx = { regionCode: string; name: string; date: string; price?: number; deposit?: number; monthlyRent?: number; aptName?: string; area?: number; floor?: number; buildYear?: number; jibun?: string; roadAddress?: string };

type Group = { name: string; count: number; median: number; recent: string };

export default function SearchView() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const lawdCd = sp.get("lawdCd") || "";
  const selectedName = sp.get("name") || "";
  const dealYmd = sp.get("dealYmd") || toYYYYMM(new Date());
  const sort = (sp.get("sort") || "recent") as "recent" | "count" | "median";
  const mode = (sp.get("mode") || "sale") as "sale" | "lease";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tx, setTx] = useState<Tx[]>([]);

  const updateQuery = (next: { lawdCd?: string; name?: string; dealYmd?: string; sort?: string; mode?: string }) => {
    const params = new URLSearchParams(sp.toString());
    if (next.lawdCd !== undefined) { const v = next.lawdCd.trim(); if (v) params.set("lawdCd", v); else params.delete("lawdCd"); }
    if (next.name !== undefined) { const v = next.name.trim(); if (v) params.set("name", v); else params.delete("name"); }
    if (next.dealYmd !== undefined) { const v = next.dealYmd.trim(); if (v) params.set("dealYmd", v); else params.delete("dealYmd"); }
    if (next.sort !== undefined) { const v = next.sort.trim(); if (v && v !== "recent") params.set("sort", v); else params.delete("sort"); }
    if (next.mode !== undefined) { const v = next.mode.trim(); if (v && v !== "sale") params.set("mode", v); else params.delete("mode"); }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  useEffect(() => {
    if (!lawdCd) { setTx([]); return; }
    const ctrl = new AbortController();
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const url = mode === 'lease'
          ? `/api/leases?lawdCd=${encodeURIComponent(lawdCd)}&dealYmd=${dealYmd}&strict=1`
          : `/api/transactions?lawdCd=${encodeURIComponent(lawdCd)}&dealYmd=${dealYmd}&strict=1`;
        const r = await fetch(url, { signal: ctrl.signal });
        if (!r.ok) throw new Error("fetch-failed");
        const data = await r.json();
        setTx(data);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message || "failed");
      } finally { setLoading(false); }
    }
    run();
    return () => ctrl.abort();
  }, [lawdCd, dealYmd, mode]);

  const groups = useMemo(() => mode === 'lease' ? groupLeases(tx) : groupTransactions(tx), [tx, mode]);
  const sorted = useMemo(() => sortGroups(groups, sort), [groups, sort]);

  const [detailSort, setDetailSort] = useState<'date' | 'price' | 'area' | 'floor'>('date');
  const [minArea, setMinArea] = useState<string>('');
  const [maxArea, setMaxArea] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const detailed = useMemo(() => {
    const toNum = (s: string) => { const n = Number((s || '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : undefined; };
    const minA = toNum(minArea); const maxA = toNum(maxArea);
    const minP = toNum(minPrice); const maxP = toNum(maxPrice);
    let arr = tx.filter((t) => {
      const a = t.area as number | undefined;
      const p = mode==='lease' ? (t.deposit ?? 0) : (t.price ?? 0);
      if (minA !== undefined && a !== undefined && a < minA) return false;
      if (maxA !== undefined && a !== undefined && a > maxA) return false;
      if (minP !== undefined && p < minP) return false;
      if (maxP !== undefined && p > maxP) return false;
      return true;
    });
    arr.sort((a, b) => {
      if (detailSort === 'price') {
        const pa = mode==='lease' ? (a.deposit ?? 0) : (a.price ?? 0);
        const pb = mode==='lease' ? (b.deposit ?? 0) : (b.price ?? 0);
        return Math.round(pb - pa);
      }
      if (detailSort === 'area') return Math.round((b.area || 0) - (a.area || 0));
      if (detailSort === 'floor') return Math.round((b.floor || 0) - (a.floor || 0));
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });
    return arr.slice(0, 50);
  }, [tx, detailSort, minArea, maxArea, minPrice, maxPrice, mode]);

  return (
    <>
      <div className="mb-4">
        <SearchBox onSelect={(l) => updateQuery({ lawdCd: l.code, name: l.name })} />
        <div className="mt-2 text-sm text-slate-600">선택: {selectedName || '없음'} {lawdCd ? `(법정동 ${lawdCd})` : ''}</div>
      </div>

      {!lawdCd && <PreGuide onPick={(eg) => updateQuery({ lawdCd: eg.code, name: eg.name })} />}

      <form className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={(e) => e.preventDefault()}>
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
            <option value="recent">최근거래일</option>
            <option value="count">거래량</option>
            <option value="median">{mode==='lease' ? '중위 보증금(만원)' : '중위가(만원)'} </option>
          </select>
        </div>
        <div className="flex items-end text-sm text-slate-500">총 {sorted.length}개 동</div>
      </form>

      {error ? (<div className="rounded border border-rose-200 bg-rose-50 text-rose-800 px-3 py-2 text-sm">데이터를 불러오지 못했습니다.</div>) : null}
      {loading ? (<div className="rounded border px-3 py-2 text-sm">불러오는 중…</div>) : null}

      {lawdCd && !loading && sorted.length === 0 ? (
        <EmptyState selectedName={selectedName} onPrev={() => updateQuery({ dealYmd: prevYYYYMM(dealYmd) })} />
      ) : null}

      {sorted.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">순위</th>
                <th className="px-3 py-2 text-left">동</th>
                <th className="px-3 py-2 text-right">거래량</th>
                <th className="px-3 py-2 text-right">{mode==='lease' ? '중위 보증금(만원)' : '중위가(만원)'} </th>
                <th className="px-3 py-2 text-right">최근거래일</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((g, i) => (
                <tr key={g.name} className="border-t">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">
                    <a className="text-brand-600 hover:underline" href={`https://map.naver.com/p/search/${encodeURIComponent(String(g.name || ''))}`} target="_blank" rel="noopener noreferrer">{g.name}</a>
                  </td>
                  <td className="px-3 py-2 text-right">{g.count}</td>
                  <td className="px-3 py-2 text-right">{Math.round(g.median).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{g.recent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {lawdCd && detailed.length > 0 ? (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">상세 거래 (최근 50건)</h3>
            <button onClick={() => exportCsv(detailed, mode)} className="px-2 py-1 rounded border text-xs hover:bg-slate-50">CSV 내보내기</button>
          </div>
          <form className="mb-3 grid grid-cols-2 md:grid-cols-6 gap-2" onSubmit={(e) => e.preventDefault()}>
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
              <input value={minArea} onChange={(e) => setMinArea(e.target.value)} placeholder="예: 59" className="rounded border px-3 py-2" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-600">최대 면적(㎡)</label>
              <input value={maxArea} onChange={(e) => setMaxArea(e.target.value)} placeholder="예: 84" className="rounded border px-3 py-2" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-600">{mode==='lease' ? '최소 보증금(만원)' : '최소 가격(만원)'} </label>
              <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder={mode==='lease' ? '예: 50000' : '예: 90000'} className="rounded border px-3 py-2" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-600">{mode==='lease' ? '최대 보증금(만원)' : '최대 가격(만원)'} </label>
              <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={mode==='lease' ? '예: 100000' : '예: 150000'} className="rounded border px-3 py-2" />
            </div>
          </form>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">단지명</th>
                  <th className="px-3 py-2 text-right">층수</th>
                  <th className="px-3 py-2 text-right">전용면적(㎡)</th>
                  {mode==='lease' ? (<><th className="px-3 py-2 text-right">보증금</th><th className="px-3 py-2 text-right">월세</th></>) : (<th className="px-3 py-2 text-right">실거래가</th>)}
                  <th className="px-3 py-2 text-right">거래날짜</th>
                  <th className="px-3 py-2 text-right">건축년도</th>
                  <th className="px-3 py-2 text-left">도로명주소</th>
                  <th className="px-3 py-2 text-left">지번주소</th>
                  <th className="px-3 py-2 text-left">지도</th>
                </tr>
              </thead>
              <tbody>
                {detailed.map((t, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{t.aptName || '-'}</td>
                    <td className="px-3 py-2 text-right">{t.floor ?? '-'}</td>
                    <td className="px-3 py-2 text-right">{t.area ? Math.round(t.area).toLocaleString() : '-'}</td>
                    {mode==='lease' ? (<><td className="px-3 py-2 text-right">{t.deposit ? formatPriceEok(t.deposit) : '-'}</td><td className="px-3 py-2 text-right">{t.monthlyRent ? `${Math.round(t.monthlyRent).toLocaleString()}만` : '-'}</td></>) : (<td className="px-3 py-2 text-right" title={`${Math.round(t.price || 0).toLocaleString()} 만원`}>{formatPriceEok(t.price || 0)}</td>)}
                    <td className="px-3 py-2 text-right">{t.date}</td>
                    <td className="px-3 py-2 text-right">{t.buildYear ?? '-'}</td>
                    <td className="px-3 py-2">{t.roadAddress ?? '-'}</td>
                    <td className="px-3 py-2">{selectedName ? `${selectedName} ` : ''}{t.jibun ?? ''}</td>
                    <td className="px-3 py-2 text-left">
                      <a href={naverMapUrl(t.roadAddress || `${selectedName || ''} ${t.jibun || ''}`)} target="_blank" rel="noopener noreferrer" className="inline-block text-brand-600 hover:underline mr-2">네이버</a>
                      <a href={kakaoMapUrl(t.roadAddress || `${selectedName || ''} ${t.jibun || ''}`)} target="_blank" rel="noopener noreferrer" className="inline-block text-slate-700 hover:underline">카카오</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </>
  );
}

function toYYYYMM(d: Date) { const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0"); return `${y}${m}`; }
function toMonthInputValue(yyyymm: string) { if (/^\d{6}$/.test(yyyymm)) return `${yyyymm.slice(0, 4)}-${yyyymm.slice(4)}`; return ""; }
function fromMonthInputValue(v: string) { if (/^\d{4}-\d{2}$/.test(v)) return v.replace("-", ""); return v; }

function groupTransactions(list: Tx[]): Group[] {
  const byName = new Map<string, { prices: number[]; recent: string; count: number }>();
  for (const t of list) {
    const k = (t.name || '').trim();
    const cur = byName.get(k) || { prices: [], recent: "", count: 0 };
    cur.prices.push(Number(t.price || 0));
    cur.count += 1;
    if (!cur.recent || t.date > cur.recent) cur.recent = t.date;
    byName.set(k, cur);
  }
  const out: Group[] = [];
  for (const [name, v] of byName.entries()) {
    const median = calcMedian(v.prices);
    out.push({ name, count: v.count, median, recent: v.recent });
  }
  return out;
}

function groupLeases(list: Tx[]): Group[] {
  const byName = new Map<string, { deposits: number[]; recent: string; count: number }>();
  for (const t of list) {
    const k = (t.name || '').trim();
    const cur = byName.get(k) || { deposits: [], recent: "", count: 0 };
    cur.deposits.push(Number(t.deposit || 0));
    cur.count += 1;
    if (!cur.recent || t.date > cur.recent) cur.recent = t.date;
    byName.set(k, cur);
  }
  const out: Group[] = [];
  for (const [name, v] of byName.entries()) {
    const median = calcMedian(v.deposits);
    out.push({ name, count: v.count, median, recent: v.recent });
  }
  return out;
}

function sortGroups(groups: Group[], sort: "recent" | "count" | "median") {
  const arr = [...groups];
  if (sort === "count") return arr.sort((a, b) => b.count - a.count);
  if (sort === "median") return arr.sort((a, b) => b.median - a.median);
  return arr.sort((a, b) => (a.recent < b.recent ? 1 : a.recent > b.recent ? -1 : 0));
}

function calcMedian(nums: number[]) { if (!nums.length) return 0; const arr = [...nums].sort((a, b) => a - b); const mid = Math.floor(arr.length / 2); return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2; }

function PreGuide({ onPick }: { onPick: (eg: { code: string; name: string }) => void }) {
  return (
    <div className="mb-6 rounded-lg border p-4 bg-slate-50">
      <div className="text-sm text-slate-700 mb-2">빠르게 시작하려면 아래 예시 지역을 눌러보세요.</div>
      <div className="flex flex-wrap gap-2">
        {exampleRegions().map((eg) => (
          <button key={eg.code} onClick={() => onPick(eg)} className="px-3 py-1.5 rounded-full border bg-white hover:bg-slate-100 text-sm" aria-label={`${eg.name}로 검색`}>{eg.name}</button>
        ))}
      </div>
      <div className="mt-3 text-xs text-slate-500">Tip: 시/구/동 이름으로 검색하면 자동완성 목록이 뜹니다.</div>
    </div>
  );
}

function EmptyState({ selectedName, onPrev }: { selectedName?: string; onPrev: () => void }) {
  return (
    <div className="rounded border px-3 py-4 text-sm text-slate-700 bg-slate-50">
      <div className="mb-2">결과가 없습니다.</div>
      <ul className="list-disc pl-5 space-y-1 text-slate-600">
        <li>다른 월을 선택해 보세요. (전월로 이동)</li>
        <li>보다 큰 범위(구 단위)를 선택하면 데이터가 더 많습니다.</li>
        <li>지도에서 해당 지역의 최근 동향을 확인해 보세요.</li>
      </ul>
      <div className="mt-3 flex gap-2">
        <button onClick={onPrev} className="px-3 py-1.5 rounded border bg-white hover:bg-slate-100">전월 보기</button>
        {selectedName ? (
          <a href={`https://map.naver.com/p/search/${encodeURIComponent(selectedName)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded border bg-white hover:bg-slate-100">네이버맵에서 "{selectedName}" 보기</a>
        ) : null}
      </div>
    </div>
  );
}

function exampleRegions() {
  const wanted = new Set(["11680", "11110", "11200", "26290"]);
  const list = (locations as Array<{ code: string; name: string; level: string }>);
  const candidates = list.filter((l) => l.level === 'gu' && (wanted.has(l.code) || l.name.includes('강남') || l.name.includes('해운대')));
  return candidates.slice(0, 6).map((l) => ({ code: l.code.slice(0, 5), name: l.name }));
}

function formatPriceEok(manyon: number) {
  const won = Math.round(manyon) * 10000;
  const eok = Math.floor(won / 100_000_000);
  const rem = Math.round((won % 100_000_000) / 10000);
  if (eok > 0) return rem > 0 ? `${eok}억 ${rem.toLocaleString()}만` : `${eok}억`;
  return `${rem.toLocaleString()}만`;
}

function naverMapUrl(q: string) { return `https://map.naver.com/p/search/${encodeURIComponent(q.trim())}`; }
function kakaoMapUrl(q: string) { return `https://map.kakao.com/?q=${encodeURIComponent(q.trim())}`; }

function exportCsv(rows: Tx[], mode: 'sale' | 'lease') {
  if (!rows.length) return;
  const headerSale = ['단지명','층수','전용면적(㎡)','실거래가(만원)','거래날짜','건축년도','도로명주소','지번주소'];
  const headerLease = ['단지명','층수','전용면적(㎡)','보증금(만원)','월세(만원)','거래날짜','건축년도','도로명주소','지번주소'];
  const header = mode==='lease' ? headerLease : headerSale;
  const body = rows.map((t) => mode==='lease'
    ? [t.aptName || '', t.floor ?? '', t.area ? Math.round(t.area) : '', Math.round(t.deposit || 0), Math.round(t.monthlyRent || 0), t.date, t.buildYear ?? '', t.roadAddress ?? '', t.jibun ?? '']
    : [t.aptName || '', t.floor ?? '', t.area ? Math.round(t.area) : '', Math.round(t.price || 0), t.date, t.buildYear ?? '', t.roadAddress ?? '', t.jibun ?? '']
  );
  const csv = [header, ...body].map((r) => r.map((v) => String(v).includes(',') ? `"${String(v).replace(/"/g,'""')}"` : String(v)).join(',')).join('\n');
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `search_detail_${mode}_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
}

