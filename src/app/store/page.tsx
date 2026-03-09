import { Suspense } from "react";
import StoreView from "./StoreView";

export const metadata = {
  title: "Store | The Caz Masters",
  description: "Official Caz Masters merch. All proceeds donated to Caz Cares.",
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
          <div className="mt-4 inline-block bg-gold-400/10 border border-gold-400/30 rounded-lg px-5 py-2">
            <p className="text-gold-400 font-bold text-sm uppercase tracking-wider">
              100% of proceeds donated to Caz Cares
            </p>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="text-center text-navy-500 py-16">Loading store...</div>}>
        <StoreView />
      </Suspense>
    </>
  );
}
