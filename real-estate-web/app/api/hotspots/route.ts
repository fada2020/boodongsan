import { NextRequest, NextResponse } from "next/server";
import spots from "@/data/gangseo-spots.json";
import mockTx from "@/data/mock-transactions.json";
import { Tx, calcMoM, clamp, clampRange, median, prevYYYYMM, toYYYYMM } from "@/lib/stats";

type Spot = { name: string; regionCode: string; lat: number; lng: number; img?: string };

async function fetchMolit(lawdCd: string, yyyymm: string) {
  const key = process.env.MOLIT_API_KEY;
  if (!key) return null;
  const endpoint = new URL("https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev");
  endpoint.searchParams.set("serviceKey", key);
  endpoint.searchParams.set("LAWD_CD", lawdCd);
  endpoint.searchParams.set("DEAL_YMD", yyyymm);
  endpoint.searchParams.set("pageNo", "1");
  endpoint.searchParams.set("numOfRows", "2000");
  endpoint.searchParams.set("_type", "json");
  const res = await fetch(endpoint.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  const items = data?.response?.body?.items?.item ?? [];
  const normalized: Tx[] = items.map((it: any) => ({
    regionCode: String(lawdCd),
    name: `${it.sggNm ?? ""} ${it.dong ?? ""}`.trim(),
    date: `${it.dealYear}-${String(it.dealMonth).padStart(2, "0")}-${String(it.dealDay).padStart(2, "0")}`,
    price: Number(String(it.dealAmount ?? "0").replace(/[\,\s]/g, "")) / 10000,
  }));
  return normalized;
}

function filterByMonth(list: Tx[], yyyymm: string) {
  return list.filter((t) => toYYYYMM(t.date) === yyyymm);
}

function buildFromMock(lawdCd: string, cur: string, prev: string) {
  const all = (mockTx as Tx[]).filter((t) => (t.regionCode.startsWith(lawdCd) || t.name.includes("강서")));
  return {
    cur: filterByMonth(all, cur),
    prev: filterByMonth(all, prev),
    source: "mock" as const,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lawdCd = searchParams.get("lawdCd") || "11500"; // Gangseo-gu
  const cur = searchParams.get("yyyymm") || toYYYYMM(new Date());
  const prev = prevYYYYMM(cur);
  // weights and clamps
  const wCnt = Number(searchParams.get("wCnt") ?? 0.6);
  const wMed = Number(searchParams.get("wMed") ?? 0.4);
  const sumW = (isFinite(wCnt) ? wCnt : 0) + (isFinite(wMed) ? wMed : 0);
  const Wc = sumW > 0 ? (wCnt / sumW) : 0.6;
  const Wm = sumW > 0 ? (wMed / sumW) : 0.4;
  const clampLow = Number(searchParams.get("clampLow") ?? -1);
  const clampHigh = Number(searchParams.get("clampHigh") ?? 1);
  const minScore = Number(searchParams.get("minScore") ?? 0);
  const minCount = Number(searchParams.get("minCount") ?? 0);

  // Try real API twice (current and previous); fallback to mock when missing
  const [realCur, realPrev] = await Promise.all([
    fetchMolit(lawdCd, cur),
    fetchMolit(lawdCd, prev),
  ]);

  const { cur: mockCur, prev: mockPrev, source } = buildFromMock(lawdCd, cur, prev);
  const listCur = (realCur ?? mockCur) as Tx[];
  const listPrev = (realPrev ?? mockPrev) as Tx[];

  const norm = (s: string) => s.replace(/\s/g, "");
  const hs = (spots as Spot[]).map((s) => {
    const match = (t: Tx) => norm(t.name).includes(norm(s.name));
    const curList = listCur.filter(match);
    const prevList = listPrev.filter(match);
    const curCnt = curList.length;
    const prevCnt = prevList.length;
    const curMed = median(curList.map((t) => t.price));
    const prevMed = median(prevList.map((t) => t.price));
    let momCnt = calcMoM(curCnt, prevCnt);
    let momMed = calcMoM(curMed, prevMed);
    // winsorize with configurable clamps
    momCnt = clampRange(momCnt, clampLow, clampHigh);
    momMed = clampRange(momMed, clampLow, clampHigh);
    const scoreRaw = Wc * momCnt + Wm * momMed; // in [clampLow, clampHigh]
    const normScore = (scoreRaw - clampLow) / Math.max(1e-9, (clampHigh - clampLow));
    const score = Math.round(clamp(normScore, 0, 1) * 100); // 0..100
    return {
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      img: s.img,
      regionCode: s.regionCode,
      currentCount: curCnt,
      previousCount: prevCnt,
      currentMedianPrice: Math.round(curMed),
      previousMedianPrice: Math.round(prevMed),
      momCount: Number(momCnt.toFixed(2)),
      momMedianPrice: Number(momMed.toFixed(2)),
      score,
    };
  }).filter(h => h.score >= (isFinite(minScore) ? minScore : 0) && h.currentCount >= (isFinite(minCount) ? minCount : 0));

  return NextResponse.json({ yyyymm: cur, previous: prev, lawdCd, source: realCur ? (realPrev ? "molit" : "partial-molit") : source, weights: { count: Wc, median: Wm }, clamp: { low: clampLow, high: clampHigh }, hotspots: hs });
}
