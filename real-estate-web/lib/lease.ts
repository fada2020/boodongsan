export type LeaseRaw = Record<string, any>;
export type LeaseNorm = {
  regionCode: string;
  name: string;
  date: string; // YYYY-MM-DD
  deposit: number; // 만원
  monthlyRent: number; // 만원
  aptName: string;
  area?: number;
  floor?: number;
  buildYear?: number;
  jibun?: string;
  roadAddress?: string;
};

export function normalizeLease(it: LeaseRaw, lawdCd: string): LeaseNorm {
  const sgg = it.sggNm ?? it.sigungu ?? it.sigunguNm ?? it.signguNm ?? "";
  const dong = it.umdNm ?? it.bjdongNm ?? it.dong ?? it.emdNm ?? it.ri ?? "";
  const name = `${sgg} ${dong}`.trim() || String(lawdCd);
  const roadNm = it.roadNm ?? it.roadName ?? "";
  const bon = (it.roadNmBonbun ?? it.mainBuildingNo ?? it.bonbun ?? "").toString();
  const bu = (it.roadNmBubun ?? it.subBuildingNo ?? it.bubun ?? "").toString();
  const bonClean = bon.replace(/^0+/, "");
  const buClean = bu.replace(/^0+/, "");
  const roadAddress = roadNm ? `${sgg ? sgg + " " : ""}${roadNm} ${bonClean}${buClean ? "-" + buClean : ""}`.trim() : undefined;
  // API는 보증금/월세를 보통 '만원' 단위로 제공합니다. 내부 표현도 '만원' 단위로 유지합니다.
  const parseManwon = (v: any) => Number(String(v ?? "0").replace(/[,\s]/g, ""));
  const monthly = parseManwon(it.rentFee ?? it.monthlyRent ?? 0);
  return {
    regionCode: String(lawdCd),
    name,
    date: `${it.dealYear}-${String(it.dealMonth).padStart(2, "0")}-${String(it.dealDay).padStart(2, "0")}`,
    deposit: parseManwon(it.rentGtn ?? it.deposit ?? it.jeonseAmount),
    monthlyRent: monthly,
    aptName: it.apartment ?? it.apartmentName ?? "",
    area: Number(it.excluUseAr ?? it.area ?? it.areaForExclusiveUse ?? 0),
    floor: isFinite(Number(it.floor)) ? Number(it.floor) : undefined,
    buildYear: isFinite(Number(it.buildYear)) ? Number(it.buildYear) : undefined,
    jibun: typeof it.jibun === 'string' ? it.jibun : undefined,
    roadAddress,
  };
}

export type LeaseGroup = { name: string; count: number; median: number; recent: string };

export function groupLeases(list: LeaseNorm[]): LeaseGroup[] {
  const byName = new Map<string, { deposits: number[]; recent: string; count: number }>();
  for (const t of list) {
    const k = (t.name || '').trim();
    const cur = byName.get(k) || { deposits: [], recent: "", count: 0 };
    cur.deposits.push(Number(t.deposit || 0));
    cur.count += 1;
    if (!cur.recent || t.date > cur.recent) cur.recent = t.date;
    byName.set(k, cur);
  }
  const out: LeaseGroup[] = [];
  for (const [name, v] of byName.entries()) {
    const median = calcMedian(v.deposits);
    out.push({ name, count: v.count, median, recent: v.recent });
  }
  return out;
}

function calcMedian(nums: number[]) {
  if (!nums.length) return 0;
  const arr = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}
