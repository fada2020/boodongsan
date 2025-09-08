import Navbar from "@/components/Navbar";
import RankingsView from "@/components/RankingsView";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function RankingsPage() {
  return (
    <Suspense fallback={<div />}> 
      <Navbar />
      <h2 className="text-xl font-semibold mb-4">거래 활발 지역 순위</h2>
      <RankingsView />
    </Suspense>
  );
}
