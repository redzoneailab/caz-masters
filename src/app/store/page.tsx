import { Suspense } from "react";
import StoreView from "./StoreView";

export const metadata = {
  title: "Store",
  description: "Official Caz Masters merch.",
};

export default function StorePage() {
  return (
    <>
      <section className="bg-navy-950 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight">Caz Masters Store</h1>
          <p className="mt-3 text-navy-300 max-w-2xl mx-auto">
            Rep the tournament. Support the cause.
          </p>
        </div>
      </section>

      <Suspense fallback={<div className="text-center text-navy-500 py-16">Loading store...</div>}>
        <StoreView />
      </Suspense>
    </>
  );
}
