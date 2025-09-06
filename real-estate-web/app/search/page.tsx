"use client";
import Navbar from "@/components/Navbar";
import SearchBox from "@/components/SearchBox";
import { useState } from "react";
import type { FC } from "react";
import transactions from "@/data/mock-transactions.json";

type Tx = { regionCode: string; name: string; date: string; price: number };

const ResultList: FC<{ code?: string }> = ({ code }) => {
  const list = (transactions as Tx[]).filter(t => !code || t.regionCode.startsWith(code)).slice(0, 10);
  if (!code) return <p className="text-slate-500">지역을 선택하면 최근 거래가 표시됩니다.</p>;
  if (list.length === 0) return <p className="text-slate-500">표시할 거래가 없습니다.</p>;
  return (
    <ul className="mt-4 divide-y rounded-lg border">
      {list.map((t, i) => {
        const q = encodeURIComponent(String(t.name || ''));
        const href = `https://map.naver.com/p/search/${q}`;
        return (
          <li key={i} className="p-0">
            <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 hover:bg-slate-50">
              <span className="text-sm">{t.name} · {t.date}</span>
              <span className="font-medium">{t.price.toLocaleString()} 만원</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default function SearchPage() {
  const [selected, setSelected] = useState<{ code: string; name: string }>();
  return (
    <>
      <Navbar />
      <h2 className="text-xl font-semibold mb-4">지역 검색</h2>
      <SearchBox onSelect={(l) => setSelected(l)} />
      <div className="mt-4 text-sm text-slate-600">선택: {selected?.name ?? '없음'}</div>
      <ResultList code={selected?.code} />
    </>
  );
}
