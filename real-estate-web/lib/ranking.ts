type Tx = { regionCode: string; name: string; date: string; price: number };

function toYYYYMM(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}${m}`;
}

function calcMoM(current: number, previous: number) {
  if (previous <= 0 && current <= 0) return 0;
  if (previous <= 0 && current > 0) return 1;
  return (current - previous) / previous;
}

export function rankRegions(transactions: Tx[]) {
  // Aggregate by region and month
  const monthsByRegion = new Map<string, Map<string, { count: number; sum: number }>>();
  const nameByRegion = new Map<string, string>();
  for (const t of transactions) {
    const m = toYYYYMM(t.date);
    nameByRegion.set(t.regionCode, t.name);
    let byMonth = monthsByRegion.get(t.regionCode);
    if (!byMonth) {
      byMonth = new Map();
      monthsByRegion.set(t.regionCode, byMonth);
    }
    const cur = byMonth.get(m) ?? { count: 0, sum: 0 };
    byMonth.set(m, { count: cur.count + 1, sum: cur.sum + (t.price || 0) });
  }

  // Determine latest and previous month across dataset
  const allMonths = new Set<string>();
  monthsByRegion.forEach((mp) => mp.forEach((_v, m) => allMonths.add(m)));
  const sortedMonths = Array.from(allMonths).sort();
  const curMonth = sortedMonths[sortedMonths.length - 1];
  const prevMonth = sortedMonths[sortedMonths.length - 2];

  const res = Array.from(monthsByRegion.entries()).map(([code, byMonth]) => {
    const name = nameByRegion.get(code) || code;
    const cur = byMonth.get(curMonth) ?? { count: 0, sum: 0 };
    const prev = prevMonth ? (byMonth.get(prevMonth) ?? { count: 0, sum: 0 }) : { count: 0, sum: 0 };
    const avgPrice = cur.count ? cur.sum / cur.count : 0;
    const momCount = calcMoM(cur.count, prev.count);
    const prevAvg = prev.count ? prev.sum / prev.count : 0;
    const momPrice = calcMoM(avgPrice, prevAvg);
    // Simple score: normalize MoM into [-1,1] and map to 0..100
    const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
    const momC = clamp(momCount, -1, 1);
    const momP = clamp(momPrice, -1, 1);
    const score01 = (0.6 * momC + 0.4 * momP + 1) / 2; // 0..1
    const score = Math.round(score01 * 100);
    return { code, name, count: cur.count, avgPrice, momCount, momPrice, score };
  });

  return res.sort((a, b) => b.score - a.score).slice(0, 20);
}
