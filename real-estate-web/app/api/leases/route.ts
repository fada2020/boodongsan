import { NextRequest, NextResponse } from "next/server";
import { normalizeLease } from "@/lib/lease";

// Helpers reused from transactions route style
const DEFAULT_LAWD = "11500"; // Seoul Gangseo-gu

function isFiveDigitNumeric(s: string) {
  return /^[0-9]{5}$/.test(s);
}

function isYYYYMM(s: string) {
  if (!/^\d{6}$/.test(s)) return false;
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(4, 6));
  if (y < 2000 || y > 2100) return false;
  return m >= 1 && m <= 12;
}

function yyyymm(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const warnings: string[] = [];
  const strict = (searchParams.get("strict") || "").toLowerCase() === "1" || (searchParams.get("strict") || "").toLowerCase() === "true";

  // Validate params
  let lawdCd = searchParams.get("lawdCd") || DEFAULT_LAWD;
  if (!isFiveDigitNumeric(lawdCd)) {
    warnings.push("lawdCd-invalid");
    lawdCd = DEFAULT_LAWD;
  }
  let dealYmd = searchParams.get("dealYmd") || yyyymm();
  if (!isYYYYMM(dealYmd)) {
    warnings.push("dealYmd-invalid");
    dealYmd = yyyymm();
  }
  let pageNo = searchParams.get("pageNo") || "1";
  let pageNum = Number(pageNo);
  if (!Number.isFinite(pageNum) || pageNum < 1) {
    warnings.push("pageNo-invalid");
    pageNum = 1;
  }
  pageNo = String(Math.floor(pageNum));

  let rows = searchParams.get("numOfRows") || "200";
  let rowNum = Number(rows);
  if (!Number.isFinite(rowNum)) rowNum = 200;
  if (rowNum < 1) {
    warnings.push("numOfRows-low");
    rowNum = 1;
  }
  if (rowNum > 2000) {
    warnings.push("numOfRows-high");
    rowNum = 2000;
  }
  rows = String(Math.floor(rowNum));

  const key = process.env.MOLIT_API_KEY;
  if (!key) {
    const headers: Record<string, string> = { "x-source": strict ? "none" : "none" };
    if (warnings.length) headers["x-params-warn"] = warnings.join(",");
    return NextResponse.json([], { headers });
  }

  try {
    // 국토부 전월세 실거래 API (아파트)
    // 참고: 서비스 경로는 공식 문서 기준으로 변경될 수 있음
    const endpoint = new URL("https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent");
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

    const normalized = items.map((it: any) => normalizeLease(it, lawdCd));

    const headers: Record<string, string> = { "x-source": "molit" };
    if (warnings.length) headers["x-params-warn"] = warnings.join(",");
    return NextResponse.json(normalized, { headers });
  } catch (e: any) {
    const headers: Record<string, string> = { "x-source": strict ? "none-error" : "none-error" };
    if (warnings.length) headers["x-params-warn"] = warnings.join(",");
    return NextResponse.json([], { headers });
  }
}
