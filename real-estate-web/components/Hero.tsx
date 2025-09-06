import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-transparent dark:from-slate-900" />
      <div className="relative grid md:grid-cols-2">
        <div className="p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            부동산 시장을 한 눈에.
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            지역 검색, 거래 활발 순위, 핫스팟과 정책 뉴스를 모던한 UI로 제공합니다.
          </p>
          <div className="mt-6 flex gap-3">
            <a href="/search" className="px-4 py-2 rounded-lg bg-brand-600 text-white">검색하기</a>
            <a href="/rankings" className="px-4 py-2 rounded-lg border">랭킹 보기</a>
          </div>
        </div>
        <div className="relative h-64 md:h-full">
          <Image src="https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?q=80&w=1200&auto=format&fit=crop" alt="city" fill className="object-cover" />
        </div>
      </div>
    </section>
  );
}

