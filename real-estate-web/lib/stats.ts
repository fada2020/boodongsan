export type Tx = { regionCode: string; name: string; date: string; price: number };

export function toYYYYMM(d: Date | string) {
  const dt = typeof d === 'string' ? new Date(d) : d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  return `${y}${m}`;
}

export function prevYYYYMM(yyyymm: string) {
  const y = Number(yyyymm.slice(0, 4));
  const m = Number(yyyymm.slice(4));
  const d = new Date(y, m - 2, 1);
  return toYYYYMM(d);
}

export function median(nums: number[]) {
  if (!nums.length) return 0;
  const arr = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function clampRange(n: number, low: number, high: number) {
  if (low > high) [low, high] = [high, low];
  return Math.max(low, Math.min(high, n));
}

export function monthOf(dateStr: string) {
  const d = new Date(dateStr);
  return toYYYYMM(d);
}

export function calcMoM(cur: number, prev: number) {
  if (prev <= 0 && cur <= 0) return 0;
  if (prev <= 0) return 1; // surge from zero
  return (cur - prev) / prev;
}
