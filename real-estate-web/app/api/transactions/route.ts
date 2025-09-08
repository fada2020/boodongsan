import { NextRequest, NextResponse } from "next/server";
import mockTx from "@/data/mock-transactions.json";

// Default: Seoul Gangseo-gu (LAWD_CD 11500)
const DEFAULT_LAWD = "11500";

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

  // Validate LAWD_CD
  let lawdCd = searchParams.get("lawdCd") || DEFAULT_LAWD;
  if (!isFiveDigitNumeric(lawdCd)) {
    warnings.push("lawdCd-invalid");
    lawdCd = DEFAULT_LAWD;
  }

  // Validate DEAL_YMD (YYYYMM)
  let dealYmd = searchParams.get("dealYmd") || yyyymm();
  if (!isYYYYMM(dealYmd)) {
    warnings.push("dealYmd-invalid");
    dealYmd = yyyymm();
  }

  // Validate pageNo (>=1)
  let pageNo = searchParams.get("pageNo") || "1";
  let pageNum = Number(pageNo);
  if (!Number.isFinite(pageNum) || pageNum < 1) {
    warnings.push("pageNo-invalid");
    pageNum = 1;
  }
  pageNo = String(Math.floor(pageNum));

  // Validate numOfRows (1..2000)
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
    if (strict) {
      const headers: Record<string, string> = { "x-source": "none" };
      if (warnings.length) headers["x-params-warn"] = warnings.join(",");
      return NextResponse.json([], { headers });
    }
    // Non-strict: fallback to mock data
    const filtered = (mockTx as any[]).filter(t => (t.regionCode as string).startsWith(lawdCd));
    const headers: Record<string, string> = { "x-source": "mock" };
    if (warnings.length) headers["x-params-warn"] = warnings.join(",");
    return NextResponse.json(filtered, { headers });
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
    // Normalize fields with resilient name extraction
    const normalized = items.map((it: any) => {
      const sgg = it.sggNm ?? it.sigungu ?? it.sigunguNm ?? it.signguNm ?? "";
      const dong = it.umdNm ?? it.bjdongNm ?? it.dong ?? it.emdNm ?? it.ri ?? "";
      const name = `${sgg} ${dong}`.trim() || String(lawdCd);
      // Compose road-name address if available
      const roadNm = it.roadNm ?? it.roadName ?? "";
      const bon = (it.roadNmBonbun ?? it.mainBuildingNo ?? it.bonbun ?? "").toString();
      const bu = (it.roadNmBubun ?? it.subBuildingNo ?? it.bubun ?? "").toString();
      const bonClean = bon.replace(/^0+/, "");
      const buClean = bu.replace(/^0+/, "");
      const roadAddress = roadNm
        ? `${sgg ? sgg + " " : ""}${roadNm} ${bonClean}${buClean ? "-" + buClean : ""}`.trim()
        : undefined;
      return {
        regionCode: String(lawdCd),
        name,
        date: `${it.dealYear}-${String(it.dealMonth).padStart(2, "0")}-${String(it.dealDay).padStart(2, "0")}`,
      // dealAmount는 보통 '만원' 단위 문자열입니다. 내부 표현도 '만원' 단위로 유지합니다.
      price: Number(String(it.dealAmount ?? "0").replace(/[,\s]/g, "")),
        aptName: it.apartment ?? it.apartmentName ?? "",
        area: Number(it.excluUseAr ?? it.area ?? it.areaForExclusiveUse ?? 0),
        floor: isFinite(Number(it.floor)) ? Number(it.floor) : undefined,
        buildYear: isFinite(Number(it.buildYear)) ? Number(it.buildYear) : undefined,
        jibun: typeof it.jibun === 'string' ? it.jibun : undefined,
        roadAddress,
      };
    });
    {
      const headers: Record<string, string> = { "x-source": "molit" };
      if (warnings.length) headers["x-params-warn"] = warnings.join(",");
      return NextResponse.json(normalized, { headers });
    }
  } catch (e: any) {
    // Error handling: strict -> empty; non-strict -> mock fallback
    if (strict) {
      const headers: Record<string, string> = { "x-source": "none-error" };
      if (warnings.length) headers["x-params-warn"] = warnings.join(",");
      return NextResponse.json([], { headers });
    }
    const filtered = (mockTx as any[]).filter(t => (t.regionCode as string).startsWith(lawdCd));
    const headers: Record<string, string> = { "x-source": "fallback-mock" };
    if (warnings.length) headers["x-params-warn"] = warnings.join(",");
    return NextResponse.json(filtered, { headers });
  }
}
