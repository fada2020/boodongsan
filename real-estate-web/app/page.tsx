import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

export default function Page() {
  return (
    <>
      <Navbar />
      <Hero />
      <section className="mt-8 grid md:grid-cols-3 gap-6">
        {[{
          title: '빠른 검색', desc: '동/구/시 자동완성으로 원하는 지역을 즉시 탐색.', href: '/search'
        }, {
          title: '거래 활발 순위', desc: '최근 거래량과 모멘텀으로 산출한 순위.', href: '/rankings'
        }, {
          title: '정책 뉴스', desc: '국토부 및 주요 포털의 정책 뉴스 모아보기.', href: '/news'
        }].map((c) => (
          <a key={c.title} href={c.href} className="group relative overflow-hidden rounded-2xl border p-5 hover:shadow-lg transition">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-50/60 to-transparent" />
            <h3 className="relative font-semibold text-lg">{c.title}</h3>
            <p className="relative mt-2 text-slate-600 dark:text-slate-300">{c.desc}</p>
            <span className="relative mt-4 inline-block text-brand-600">바로가기 →</span>
          </a>
        ))}
      </section>
    </>
  );
}
