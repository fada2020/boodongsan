"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "홈" },
  { href: "/search", label: "검색" },
  { href: "/rankings", label: "랭킹" },
  { href: "/news", label: "정책 뉴스" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 mb-6">
      <div className="container-page py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-brand-600">부동산 인사이트</Link>
        <div className="flex gap-4 text-sm">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? "text-brand-600 font-medium" : "text-slate-600 dark:text-slate-300"}>{l.label}</Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

