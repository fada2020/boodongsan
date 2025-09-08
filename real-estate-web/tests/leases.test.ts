import { describe, it, expect } from 'vitest';
import { normalizeLease, groupLeases } from '../lib/lease';

describe('normalizeLease', () => {
  it('maps common fields and composes road address', () => {
    const raw = {
      sggNm: '서울 강남구',
      umdNm: '역삼동',
      dealYear: 2024,
      dealMonth: 9,
      dealDay: 2,
      rentGtn: '50,000',
      rentFee: '150',
      apartment: '역삼자이',
      excluUseAr: '84.97',
      floor: '12',
      buildYear: '2015',
      jibun: '123-45',
      roadNm: '테헤란로',
      roadNmBonbun: '0123',
      roadNmBubun: '0006',
    };
    const out = normalizeLease(raw as any, '11680');
    expect(out.name).toContain('강남');
    expect(out.name).toContain('역삼');
    expect(out.date).toBe('2024-09-02');
    expect(Math.round(out.deposit)).toBe(50000); // 5억 => 50000만원(만원 단위)
    expect(out.monthlyRent).toBe(150);
    expect(out.aptName).toBe('역삼자이');
    expect(Math.round(out.area || 0)).toBe(85);
    expect(out.floor).toBe(12);
    expect(out.buildYear).toBe(2015);
    expect(out.jibun).toBe('123-45');
    expect(out.roadAddress).toContain('테헤란로 123-6');
  });
});

describe('groupLeases', () => {
  it('groups by name and computes median deposit', () => {
    const list = [
      { name: '강남구 역삼동', deposit: 30000, date: '2024-09-01' },
      { name: '강남구 역삼동', deposit: 50000, date: '2024-09-05' },
      { name: '강남구 역삼동', deposit: 70000, date: '2024-09-03' },
    ] as any;
    const groups = groupLeases(list);
    expect(groups.length).toBe(1);
    expect(groups[0].name).toBe('강남구 역삼동');
    expect(groups[0].count).toBe(3);
    expect(groups[0].median).toBe(50000);
    expect(groups[0].recent).toBe('2024-09-05');
  });
});
