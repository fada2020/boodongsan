"use client";
import { useEffect, useMemo, useState } from "react";
import locations from "@/data/locations.json";
import useDebounce from "@/lib/useDebounce";

type Location = { code: string; name: string; level: "si"|"gu"|"dong" };

export default function SearchBox({ onSelect }: { onSelect?: (loc: Location) => void }) {
  const [q, setQ] = useState("");
  const debounced = useDebounce(q, 250);
  const results = useMemo(() => {
    if (!debounced.trim()) return [] as Location[];
    const k = debounced.trim().toLowerCase();
    return (locations as Location[])
      .filter(l => l.name.toLowerCase().includes(k))
      .slice(0, 8);
  }, [debounced]);

  useEffect(() => { /* side-effects if needed */ }, [debounced]);

  return (
    <div className="w-full max-w-xl">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results.length > 0) {
            onSelect?.(results[0]);
          }
        }}
        placeholder="지역명(시/구/동)으로 검색"
        className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600"
      />
      {results.length > 0 && (
        <div className="mt-2 rounded-lg border bg-white shadow">
          {results.map(r => (
            <button key={r.code} onClick={() => onSelect?.(r)} className="block w-full text-left px-3 py-2 hover:bg-slate-50">
              {r.name}
            </button>
          ))}
        </div>
      )}
      {q.trim() && (
        <div className="mt-3">
          <a
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border text-sm hover:bg-slate-50"
            href={`https://map.naver.com/p/search/${encodeURIComponent(q.trim())}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            네이버맵에서 "{q.trim()}" 검색
          </a>
        </div>
      )}
    </div>
  );
}
