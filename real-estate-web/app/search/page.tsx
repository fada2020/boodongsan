import Navbar from "@/components/Navbar";
import { Suspense } from "react";
import SearchView from "@/components/SearchView";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <Suspense fallback={<div />}> 
      <Navbar />
      <h2 className="text-xl font-semibold mb-4">지역 검색</h2>
      <SearchView />
    </Suspense>
  );
}

