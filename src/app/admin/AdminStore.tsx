"use client";

import { useState, useEffect, useCallback } from "react";

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
  active: boolean;
  sortOrder: number;
  variants: Variant[];
  _count: { orderItems: number };
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: { name: string };
  variant: { label: string } | null;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  totalAmount: number;
  status: string;
  items: OrderItem[];
  createdAt: string;
}

interface Stats {
  totalOrders: number;
  paidOrders: number;
  fulfilledOrders: number;
  totalRevenue: number;
}

export default function AdminStore({ password }: { password: string }) {
  const [view, setView] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, paidOrders: 0, fulfilledOrders: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "", imageUrl: "", category: "" });
  const [newVariants, setNewVariants] = useState([{ label: "S", stock: "0" }, { label: "M", stock: "0" }, { label: "L", stock: "0" }, { label: "XL", stock: "0" }]);
  const [addingVariant, setAddingVariant] = useState<string | null>(null);
  const [newVariantLabel, setNewVariantLabel] = useState("");
  const [newVariantStock, setNewVariantStock] = useState("0");

  const headers = { Authorization: `Bearer ${password}`, "Content-Type": "application/json" };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/store/products", { headers: { Authorization: `Bearer ${password}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(data.products);
    } catch {
      setError("Failed to load products");
    }
  }, [password]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/store/orders", { headers: { Authorization: `Bearer ${password}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.orders);
      setStats(data.stats);
    } catch {
      setError("Failed to load orders");
    }
  }, [password]);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchOrders()]).finally(() => setLoading(false));
  }, [fetchProducts, fetchOrders]);

  async function createProduct() {
    if (!newProduct.name || !newProduct.price) return;
    try {
      await fetch("/api/admin/store/products", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          variants: newVariants.filter((v) => v.label).map((v) => ({ label: v.label, stock: parseInt(v.stock) || 0 })),
        }),
      });
      setShowAddProduct(false);
      setNewProduct({ name: "", description: "", price: "", imageUrl: "", category: "" });
      setNewVariants([{ label: "S", stock: "0" }, { label: "M", stock: "0" }, { label: "L", stock: "0" }, { label: "XL", stock: "0" }]);
      await fetchProducts();
    } catch {
      setError("Failed to create product");
    }
  }

  async function toggleActive(productId: string, active: boolean) {
    await fetch(`/api/admin/store/products/${productId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ active }),
    });
    await fetchProducts();
  }

  async function deleteProduct(productId: string) {
    await fetch(`/api/admin/store/products/${productId}`, { method: "DELETE", headers });
    await fetchProducts();
  }

  async function updateStock(variantId: string, stock: number) {
    await fetch(`/api/admin/store/variants/${variantId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ stock }),
    });
    await fetchProducts();
  }

  async function addVariant(productId: string) {
    if (!newVariantLabel) return;
    await fetch("/api/admin/store/variants", {
      method: "POST",
      headers,
      body: JSON.stringify({ productId, label: newVariantLabel, stock: parseInt(newVariantStock) || 0 }),
    });
    setAddingVariant(null);
    setNewVariantLabel("");
    setNewVariantStock("0");
    await fetchProducts();
  }

  async function deleteVariant(variantId: string) {
    await fetch(`/api/admin/store/variants/${variantId}`, { method: "DELETE", headers });
    await fetchProducts();
  }

  async function updateOrderStatus(orderId: string, status: string) {
    await fetch(`/api/admin/store/orders/${orderId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });
    await fetchOrders();
  }

  function parseAddress(json: string) {
    try {
      const a = JSON.parse(json);
      return `${a.line1}${a.line2 ? ", " + a.line2 : ""}, ${a.city}, ${a.state} ${a.zip}`;
    } catch {
      return json;
    }
  }

  if (loading) return <p className="text-navy-500 py-8 text-center">Loading store data...</p>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-2 font-bold">&times;</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-900">Store</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView("products")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${view === "products" ? "bg-navy-900 text-white" : "bg-white border border-navy-200 text-navy-600 hover:bg-navy-50"}`}
          >
            Products
          </button>
          <button
            onClick={() => setView("orders")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${view === "orders" ? "bg-navy-900 text-white" : "bg-white border border-navy-200 text-navy-600 hover:bg-navy-50"}`}
          >
            Orders
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-navy-500">Products</p>
          <p className="text-3xl font-bold text-navy-900">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-navy-500">Orders</p>
          <p className="text-3xl font-bold text-navy-900">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-navy-500">Revenue</p>
          <p className="text-3xl font-bold text-navy-900">${(stats.totalRevenue / 100).toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-navy-100">
          <p className="text-sm text-navy-500">Unfulfilled</p>
          <p className="text-3xl font-bold text-navy-900">{stats.paidOrders - stats.fulfilledOrders}</p>
        </div>
      </div>

      {/* Products View */}
      {view === "products" && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddProduct(!showAddProduct)}
              className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {showAddProduct ? "Cancel" : "Add Product"}
            </button>
          </div>

          {showAddProduct && (
            <div className="bg-white rounded-xl border border-navy-100 p-6 space-y-4">
              <h3 className="font-bold text-navy-900">New Product</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  placeholder="Product name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="rounded-lg border border-navy-200 px-4 py-2.5 text-sm focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
                />
                <input
                  placeholder="Price (dollars)"
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="rounded-lg border border-navy-200 px-4 py-2.5 text-sm focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
                />
                <input
                  placeholder="Category (e.g. Apparel)"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="rounded-lg border border-navy-200 px-4 py-2.5 text-sm focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
                />
                <input
                  placeholder="Image URL"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  className="rounded-lg border border-navy-200 px-4 py-2.5 text-sm focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
                />
              </div>
              <input
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full rounded-lg border border-navy-200 px-4 py-2.5 text-sm focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
              />

              <div>
                <p className="text-sm font-semibold text-navy-700 mb-2">Sizes / Variants</p>
                <div className="flex flex-wrap gap-2">
                  {newVariants.map((v, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <input
                        placeholder="Label"
                        value={v.label}
                        onChange={(e) => {
                          const updated = [...newVariants];
                          updated[i].label = e.target.value;
                          setNewVariants(updated);
                        }}
                        className="w-16 rounded-lg border border-navy-200 px-2 py-1.5 text-sm text-center"
                      />
                      <input
                        placeholder="Qty"
                        type="number"
                        value={v.stock}
                        onChange={(e) => {
                          const updated = [...newVariants];
                          updated[i].stock = e.target.value;
                          setNewVariants(updated);
                        }}
                        className="w-16 rounded-lg border border-navy-200 px-2 py-1.5 text-sm text-center"
                      />
                      <button
                        onClick={() => setNewVariants(newVariants.filter((_, idx) => idx !== i))}
                        className="text-red-500 hover:text-red-700 text-sm px-1"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setNewVariants([...newVariants, { label: "", stock: "0" }])}
                    className="text-sm text-navy-500 hover:text-navy-700 border border-dashed border-navy-300 px-3 py-1.5 rounded-lg"
                  >
                    + Add Size
                  </button>
                </div>
              </div>

              <button
                onClick={createProduct}
                className="bg-navy-800 hover:bg-navy-900 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                Create Product
              </button>
            </div>
          )}

          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-navy-100 overflow-hidden">
                <div
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-navy-50/50"
                  onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                >
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-navy-100 flex items-center justify-center text-navy-400 text-xs font-bold">CM</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-navy-900 truncate">{product.name}</p>
                    <p className="text-sm text-navy-500">
                      ${(product.price / 100).toFixed(2)} &middot; {product.variants.reduce((s, v) => s + v.stock, 0)} in stock &middot; {product._count.orderItems} sold
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.active ? "bg-navy-100 text-navy-700" : "bg-red-100 text-red-700"}`}>
                    {product.active ? "Active" : "Hidden"}
                  </span>
                </div>

                {expandedProduct === product.id && (
                  <div className="border-t border-navy-100 px-4 py-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleActive(product.id, !product.active)}
                        className="text-xs bg-navy-50 text-navy-600 hover:bg-navy-100 px-3 py-1.5 rounded-lg font-medium"
                      >
                        {product.active ? "Hide" : "Show"}
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium"
                      >
                        Delete
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-navy-700">Inventory</p>
                    <div className="space-y-2">
                      {product.variants.map((variant) => (
                        <div key={variant.id} className="flex items-center gap-3 text-sm">
                          <span className="w-16 font-medium text-navy-700">{variant.label}</span>
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateStock(variant.id, parseInt(e.target.value) || 0)}
                            className="w-20 rounded-lg border border-navy-200 px-2 py-1.5 text-sm text-center"
                          />
                          <span className="text-navy-400">in stock</span>
                          <button
                            onClick={() => deleteVariant(variant.id)}
                            className="text-red-500 hover:text-red-700 text-xs ml-auto"
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      {addingVariant === product.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            placeholder="Label"
                            value={newVariantLabel}
                            onChange={(e) => setNewVariantLabel(e.target.value)}
                            className="w-20 rounded-lg border border-navy-200 px-2 py-1.5 text-sm"
                          />
                          <input
                            placeholder="Stock"
                            type="number"
                            value={newVariantStock}
                            onChange={(e) => setNewVariantStock(e.target.value)}
                            className="w-20 rounded-lg border border-navy-200 px-2 py-1.5 text-sm"
                          />
                          <button onClick={() => addVariant(product.id)} className="text-xs bg-navy-800 text-white px-3 py-1.5 rounded-lg font-medium">
                            Add
                          </button>
                          <button onClick={() => setAddingVariant(null)} className="text-xs text-navy-500">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingVariant(product.id)}
                          className="text-xs text-navy-500 hover:text-navy-700 border border-dashed border-navy-300 px-3 py-1.5 rounded-lg"
                        >
                          + Add Variant
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {products.length === 0 && (
              <p className="text-navy-400 text-center py-8">No products yet. Add your first product above.</p>
            )}
          </div>
        </>
      )}

      {/* Orders View */}
      {view === "orders" && (
        <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-50 border-b border-navy-100">
                  <th className="text-left px-4 py-3 font-semibold text-navy-700">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy-700">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy-700 hidden sm:table-cell">Items</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy-700">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-navy-400">No orders yet.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <>
                      <tr
                        key={order.id}
                        className="border-b border-navy-50 hover:bg-navy-50/50 cursor-pointer"
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      >
                        <td className="px-4 py-3 text-navy-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-navy-800">{order.customerName}</p>
                          <p className="text-xs text-navy-400">{order.customerEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-navy-600 hidden sm:table-cell">
                          {order.items.map((i) => `${i.product.name}${i.variant ? ` (${i.variant.label})` : ""} x${i.quantity}`).join(", ")}
                        </td>
                        <td className="px-4 py-3 font-semibold text-navy-900">
                          ${(order.totalAmount / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            order.status === "fulfilled" ? "bg-navy-100 text-navy-700"
                              : order.status === "paid" ? "bg-blue-100 text-blue-700"
                                : "bg-gold-50 text-gold-600"
                          }`}>
                            {order.status === "fulfilled" ? "Fulfilled" : order.status === "paid" ? "Paid" : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {order.status === "paid" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, "fulfilled"); }}
                              className="text-xs bg-navy-800 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-navy-900"
                            >
                              Mark Fulfilled
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedOrder === order.id && (
                        <tr key={`${order.id}-details`}>
                          <td colSpan={6} className="px-4 py-3 bg-navy-50/50">
                            <p className="text-sm text-navy-700">
                              <span className="font-semibold">Ship to:</span> {parseAddress(order.shippingAddress)}
                            </p>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
