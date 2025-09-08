type Tx = { regionCode: string; name: string; date: string; price: number };
import locations from "../data/locations.json";

function codeToName(code: string): string {
  try {
    const list = locations as Array<{ code: string; name: string }>;
    const found = list.find((l) => l.code === code);
    return found?.name || code;
  } catch {
    return code;
  }
}

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
    // Use a granular grouping key: prefer detailed regionCode (with suffix) otherwise fallback to name
    const key = t.regionCode && /-/.test(t.regionCode) ? t.regionCode : (t.name || t.regionCode);
    nameByRegion.set(key, t.name || codeToName(t.regionCode));
    let byMonth = monthsByRegion.get(key);
    if (!byMonth) {
      byMonth = new Map();
      monthsByRegion.set(key, byMonth);
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
    const name = nameByRegion.get(code) || codeToName(code);
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

// Explicit-month variant to keep counts aligned with selected month
export function rankRegionsForMonth(transactions: Tx[], currentYYYYMM: string, previousYYYYMM?: string) {
  const monthsByRegion = new Map<string, Map<string, { count: number; sum: number }>>();
  const nameByRegion = new Map<string, string>();
  const groupKeyOf = (t: Tx) => (t.regionCode && /-/.test(t.regionCode)) ? t.regionCode : (t.name || t.regionCode);

  for (const t of transactions) {
    const m = toYYYYMM(t.date);
    const key = groupKeyOf(t);
    nameByRegion.set(key, t.name || codeToName(t.regionCode));
    let byMonth = monthsByRegion.get(key);
    if (!byMonth) {
      byMonth = new Map();
      monthsByRegion.set(key, byMonth);
    }
    const cur = byMonth.get(m) ?? { count: 0, sum: 0 };
    byMonth.set(m, { count: cur.count + 1, sum: cur.sum + (t.price || 0) });
  }

  const curMonth = currentYYYYMM;
  const prevMonth = previousYYYYMM ?? (() => {
    const y = Number(curMonth.slice(0, 4));
    const m = Number(curMonth.slice(4));
    const d = new Date(y, m - 2, 1);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yy}${mm}`;
  })();

  const res = Array.from(monthsByRegion.entries()).map(([code, byMonth]) => {
    const name = nameByRegion.get(code) || codeToName(code);
    const cur = byMonth.get(curMonth) ?? { count: 0, sum: 0 };
    const prev = byMonth.get(prevMonth) ?? { count: 0, sum: 0 };
    const avgPrice = cur.count ? cur.sum / cur.count : 0;
    const momCount = calcMoM(cur.count, prev.count);
    const prevAvg = prev.count ? prev.sum / prev.count : 0;
    const momPrice = calcMoM(avgPrice, prevAvg);
    const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
    const momC = clamp(momCount, -1, 1);
    const momP = clamp(momPrice, -1, 1);
    const score01 = (0.6 * momC + 0.4 * momP + 1) / 2;
    const score = Math.round(score01 * 100);
    return { code, name, count: cur.count, avgPrice, momCount, momPrice, score };
  });

  return res.sort((a, b) => b.score - a.score).slice(0, 20);
}
