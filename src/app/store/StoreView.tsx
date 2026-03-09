"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface Variant {
  id: string;
  label: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string | null;
  variants: Variant[];
}

interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export default function StoreView() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [address, setAddress] = useState({ line1: "", line2: "", city: "", state: "", zip: "" });
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/store/products");
      const data = await res.json();
      setProducts(data.products);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      setError("Checkout was cancelled. Your cart is still here.");
    }
  }, [searchParams]);

  function addToCart(product: Product) {
    const variantId = selectedVariants[product.id];
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.variantId === variantId);
      if (existing) {
        if (existing.quantity >= variant.stock) return prev;
        return prev.map((item) =>
          item.variantId === variantId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          variantLabel: variant.label,
          price: product.price,
          quantity: 1,
          maxStock: variant.stock,
        },
      ];
    });
    setShowCart(true);
  }

  function updateQuantity(variantId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variantId !== variantId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.maxStock) return item;
          return { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function removeFromCart(variantId: string) {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!cart.length) return;

    setCheckingOut(true);
    setError("");

    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          shippingAddress: address,
          items: cart.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed");
        setCheckingOut(false);
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setError("Something went wrong. Please try again.");
      setCheckingOut(false);
    }
  }

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <p className="text-center text-navy-500">Loading products...</p>
      </section>
    );
  }

  return (
    <>
      {/* Products Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-6">
              {error}
              <button onClick={() => setError("")} className="ml-2 font-bold">&times;</button>
            </div>
          )}

          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-navy-500 text-lg">Coming soon! Check back for Caz Masters merch.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => {
                const selectedVarId = selectedVariants[product.id] || product.variants[0]?.id;
                const selectedVariant = product.variants.find((v) => v.id === selectedVarId);
                const inStock = selectedVariant ? selectedVariant.stock > 0 : false;

                return (
                  <div key={product.id} className="border border-navy-100 rounded-xl overflow-hidden bg-white hover:shadow-lg transition-shadow">
                    {product.imageUrl ? (
                      <div className="aspect-square bg-navy-50 overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-navy-50 flex items-center justify-center">
                        <span className="text-navy-300 text-4xl font-black">CM</span>
                      </div>
                    )}
                    <div className="p-5">
                      {product.category && (
                        <p className="text-xs font-bold text-gold-500 uppercase tracking-wider mb-1">
                          {product.category}
                        </p>
                      )}
                      <h3 className="font-bold text-navy-900 text-lg">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-navy-500 mt-1">{product.description}</p>
                      )}
                      <p className="text-xl font-bold text-navy-900 mt-2">
                        ${(product.price / 100).toFixed(2)}
                      </p>

                      {/* Variant selector */}
                      {product.variants.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {product.variants.map((variant) => (
                            <button
                              key={variant.id}
                              onClick={() => setSelectedVariants((prev) => ({ ...prev, [product.id]: variant.id }))}
                              disabled={variant.stock === 0}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                selectedVarId === variant.id
                                  ? "border-navy-900 bg-navy-900 text-white"
                                  : variant.stock === 0
                                    ? "border-navy-100 text-navy-300 cursor-not-allowed"
                                    : "border-navy-200 text-navy-700 hover:border-navy-400"
                              }`}
                            >
                              {variant.label}
                              {variant.stock === 0 && " (Out)"}
                            </button>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (!selectedVarId) return;
                          setSelectedVariants((prev) => ({ ...prev, [product.id]: selectedVarId }));
                          addToCart(product);
                        }}
                        disabled={!inStock}
                        className={`mt-4 w-full py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors ${
                          inStock
                            ? "bg-gold-400 hover:bg-gold-300 text-navy-950"
                            : "bg-navy-100 text-navy-400 cursor-not-allowed"
                        }`}
                      >
                        {inStock ? "Add to Cart" : "Out of Stock"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Floating cart button */}
      {cartCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-navy-900 text-white px-6 py-3 rounded-full shadow-lg hover:bg-navy-800 transition-colors font-bold z-40"
        >
          Cart ({cartCount}) &middot; ${(cartTotal / 100).toFixed(2)}
        </button>
      )}

      {/* Cart sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-navy-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-900">Your Cart ({cartCount})</h2>
              <button onClick={() => setShowCart(false)} className="text-navy-400 hover:text-navy-600 text-2xl">
                &times;
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {cart.length === 0 ? (
                <p className="text-navy-500 text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.variantId} className="flex items-center gap-4 py-3 border-b border-navy-50">
                      <div className="flex-1">
                        <p className="font-semibold text-navy-900">{item.productName}</p>
                        <p className="text-sm text-navy-500">{item.variantLabel}</p>
                        <p className="text-sm font-medium text-navy-700">
                          ${(item.price / 100).toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.variantId, -1)}
                          className="w-8 h-8 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-semibold text-navy-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, 1)}
                          className="w-8 h-8 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 flex items-center justify-center"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.variantId)}
                          className="ml-2 text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-navy-200 pt-4">
                    <div className="flex justify-between text-lg font-bold text-navy-900">
                      <span>Total</span>
                      <span>${(cartTotal / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout form */}
                  <form onSubmit={handleCheckout} className="space-y-4 pt-4">
                    <h3 className="font-bold text-navy-900">Contact Info</h3>
                    <input
                      type="text"
                      placeholder="Full Name"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-lg border border-navy-200 px-4 py-3 text-sm focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full rounded-lg border border-navy-200 px-4 py-3 text-sm focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
                    />

                    <h3 className="font-bold text-navy-900 pt-2">Shipping Address</h3>
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      required
                      value={address.line1}
                      onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                      className="w-full rounded-lg border border-navy-200 px-4 py-3 text-sm focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2 (optional)"
                      value={address.line2}
                      onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                      className="w-full rounded-lg border border-navy-200 px-4 py-3 text-sm focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        required
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        className="rounded-lg border border-navy-200 px-4 py-3 text-sm focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        required
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        className="rounded-lg border border-navy-200 px-4 py-3 text-sm focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="ZIP"
                        required
                        value={address.zip}
                        onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                        className="rounded-lg border border-navy-200 px-4 py-3 text-sm focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
                      />
                    </div>

                    {error && (
                      <p className="text-red-600 text-sm">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={checkingOut}
                      className="w-full bg-gold-400 hover:bg-gold-300 text-navy-950 font-black py-3 rounded-lg transition-colors uppercase tracking-wider disabled:opacity-50"
                    >
                      {checkingOut ? "Processing..." : `Checkout - $${(cartTotal / 100).toFixed(2)}`}
                    </button>

                    <p className="text-center text-xs text-navy-400 pt-1">
                      All proceeds donated to Caz Cares
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
