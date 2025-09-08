export type Location = { code: string; name: string; level: "si" | "gu" | "dong" };

function norm(s: string) {
  return s.replace(/\s/g, "").toLowerCase();
}

// Simple router from keyword to local chunk files
async function loadChunksFor(term: string): Promise<Location[]> {
  const t = norm(term);
  const chunks: Location[][] = [];
  try {
    if (/서울|seoul|강남|서초|마포|종로|용산/.test(term)) {
      const m = await import("@/data/locations/seoul.json");
      chunks.push(m.default as Location[]);
    }
    if (/부산|busan|해운대|수영|동래/.test(term)) {
      const m = await import("@/data/locations/busan.json");
      chunks.push(m.default as Location[]);
    }
    if (/경기|gyeonggi|수원|성남|용인|부천|안양|일산|의정부/.test(term)) {
      const m = await import("@/data/locations/gyeonggi.json");
      chunks.push(m.default as Location[]);
    }
    if (/인천|incheon|연수|남동|부평|계양|서구/.test(term)) {
      const m = await import("@/data/locations/incheon.json");
      chunks.push(m.default as Location[]);
    }
    if (/대구|daegu|수성|달서|동구|북구|남구|중구/.test(term)) {
      const m = await import("@/data/locations/daegu.json");
      chunks.push(m.default as Location[]);
    }
    if (/대전|daejeon|유성|서구|중구|동구/.test(term)) {
      const m = await import("@/data/locations/daejeon.json");
      chunks.push(m.default as Location[]);
    }
    if (/광주|gwangju|서구|북구|남구|동구|광산/.test(term)) {
      const m = await import("@/data/locations/gwangju.json");
      chunks.push(m.default as Location[]);
    }
    if (/울산|ulsan|남구|동구|북구|중구|울주/.test(term)) {
      const m = await import("@/data/locations/ulsan.json");
      chunks.push(m.default as Location[]);
    }
    if (/제주|jeju|서귀포/.test(term)) {
      const m = await import("@/data/locations/jeju.json");
      chunks.push(m.default as Location[]);
    }
  } catch {
    // ignore missing chunk
  }
  // Fallback: small bundled list (legacy)
  try {
    if (chunks.length === 0) {
      const base = await import("@/data/locations.json");
      chunks.push(base.default as Location[]);
    }
  } catch {
    // ignore
  }
  return chunks.flat();
}

export async function searchLocations(keyword: string, limit = 20): Promise<Location[]> {
  const k = keyword.trim();
  if (!k) return [];
  const pool = await loadChunksFor(k);
  const lk = norm(k);
  const res = pool
    .filter((l) => norm(l.name).includes(lk))
    .slice(0, limit);
  return res;
}
