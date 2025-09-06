import Navbar from "@/components/Navbar";
import transactions from "@/data/mock-transactions.json";
import { rankRegions } from "@/lib/ranking";

export default function RankingsPage() {
  const ranks = rankRegions(transactions as any);
  return (
    <>
      <Navbar />
      <h2 className="text-xl font-semibold mb-4">거래 활발 지역 순위 (샘플)</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">순위</th>
              <th className="px-3 py-2 text-left">지역</th>
              <th className="px-3 py-2 text-right">거래건수</th>
              <th className="px-3 py-2 text-right">평균가(만원)</th>
              <th className="px-3 py-2 text-right">MoM 거래수</th>
              <th className="px-3 py-2 text-right">MoM 중위가</th>
              <th className="px-3 py-2 text-right">지수</th>
            </tr>
          </thead>
          <tbody>
            {ranks.map((r, i) => (
              <tr key={r.code} className="border-t">
                <td className="px-3 py-2">{i + 1}</td>
                <td className="px-3 py-2">
                  <a
                    className="text-brand-600 hover:underline"
                    href={`https://map.naver.com/p/search/${encodeURIComponent(String(r.name || ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {r.name}
                  </a>
                </td>
                <td className="px-3 py-2 text-right">{r.count}</td>
                <td className="px-3 py-2 text-right">{Math.round(r.avgPrice).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{Math.round((r.momCount ?? 0) * 100)}%</td>
                <td className="px-3 py-2 text-right">{Math.round((r.momPrice ?? 0) * 100)}%</td>
                <td className="px-3 py-2 text-right"><span className="inline-block min-w-[2ch] tabular-nums">{r.score}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
