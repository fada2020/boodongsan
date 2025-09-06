import { NextRequest, NextResponse } from "next/server";
import mockTx from "@/data/mock-transactions.json";

// Default: Seoul Gangseo-gu (LAWD_CD 11500)
const DEFAULT_LAWD = "11500";

function yyyymm(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lawdCd = searchParams.get("lawdCd") || DEFAULT_LAWD;
  const dealYmd = searchParams.get("dealYmd") || yyyymm();
  const pageNo = searchParams.get("pageNo") || "1";
  const rows = searchParams.get("numOfRows") || "200";

  const key = process.env.MOLIT_API_KEY;
  if (!key) {
    // Fallback to mock data if no API key
    const filtered = (mockTx as any[]).filter(t => (t.regionCode as string).startsWith(lawdCd));
    return NextResponse.json(filtered, { headers: { "x-source": "mock" } });
  }

  try {
    const endpoint = new URL("https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev");
    endpoint.searchParams.set("serviceKey", key);
    endpoint.searchParams.set("LAWD_CD", lawdCd);
    endpoint.searchParams.set("DEAL_YMD", dealYmd);
    endpoint.searchParams.set("pageNo", pageNo);
    endpoint.searchParams.set("numOfRows", rows);
    endpoint.searchParams.set("_type", "json");

    const res = await fetch(endpoint.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`MOLIT ${res.status}`);
    const data = await res.json();
    const items = data?.response?.body?.items?.item ?? [];
    // Normalize fields
    const normalized = items.map((it: any) => ({
      regionCode: String(lawdCd),
      name: `${it.sggNm ?? ""} ${it.dong ?? ""}`.trim(),
      date: `${it.dealYear}-${String(it.dealMonth).padStart(2, "0")}-${String(it.dealDay).padStart(2, "0")}`,
      price: Number(String(it.dealAmount ?? "0").replace(/[,\s]/g, "")) / 10000, // to 만원
      aptName: it.apartment ?? it.apartmentName ?? "",
      area: Number(it.excluUseAr ?? it.area ?? 0),
    }));
    return NextResponse.json(normalized, { headers: { "x-source": "molit" } });
  } catch (e: any) {
    // Graceful fallback
    const filtered = (mockTx as any[]).filter(t => (t.regionCode as string).startsWith(lawdCd));
    return NextResponse.json(filtered, { headers: { "x-source": "fallback-mock" } });
  }
}
