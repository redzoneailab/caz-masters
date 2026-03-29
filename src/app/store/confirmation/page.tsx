import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Order Confirmed",
};

export default async function StoreConfirmationPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await searchParams;

  let order = null;
  if (orderId) {
    order = await prisma.storeOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { label: true } },
          },
        },
      },
    });
  }

  return (
    <>
      <section className="bg-navy-950 text-white py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 bg-gold-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-navy-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Order Confirmed!</h1>
          <p className="mt-3 text-navy-300">
            Thanks for supporting Caz Cares. Your merch is on the way.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          {order && (
            <div className="bg-navy-50 rounded-xl p-6">
              <h2 className="font-bold text-navy-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-navy-700">
                      {item.product.name} ({item.variant?.label}) x{item.quantity}
                    </span>
                    <span className="font-semibold text-navy-900">
                      ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-navy-200 pt-3 flex justify-between font-bold text-navy-900">
                  <span>Total</span>
                  <span>${(order.totalAmount / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/store"
              className="inline-block bg-navy-800 hover:bg-navy-900 text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
