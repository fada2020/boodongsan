import { describe, expect, it } from 'vitest';
import { rankRegions } from '../lib/ranking';

const tx = [
  // Region A: prev month 1 tx, current month 3 tx
  { regionCode: '11500', name: '강서구 마곡동', date: '2024-08-10', price: 800 },
  { regionCode: '11500', name: '강서구 마곡동', date: '2024-09-01', price: 900 },
  { regionCode: '11500', name: '강서구 마곡동', date: '2024-09-05', price: 880 },
  { regionCode: '11500', name: '강서구 마곡동', date: '2024-09-10', price: 920 },
  // Region B: prev month 3 tx, current month 1 tx (decline)
  { regionCode: '11680', name: '강남구 역삼동', date: '2024-08-02', price: 1500 },
  { regionCode: '11680', name: '강남구 역삼동', date: '2024-08-15', price: 1400 },
  { regionCode: '11680', name: '강남구 역삼동', date: '2024-08-28', price: 1600 },
  { regionCode: '11680', name: '강남구 역삼동', date: '2024-09-03', price: 1550 },
] as const;

describe('rankRegions', () => {
  it('aggregates by region and sorts by score', () => {
    const out = rankRegions(tx as any);
    expect(out.length).toBe(2);
    // Region A should rank above Region B due to rising MoM count
    expect(out[0].name).toContain('강서구');
    expect(out[1].name).toContain('강남구');
    // Fields
    expect(out[0]).toHaveProperty('count');
    expect(out[0]).toHaveProperty('avgPrice');
    expect(out[0]).toHaveProperty('score');
  });
});

