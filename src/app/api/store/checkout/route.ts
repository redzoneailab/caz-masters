import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  const { customerName, customerEmail, shippingAddress, items } = await req.json();

  if (!customerName || !customerEmail || !shippingAddress || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate address fields
  const { line1, city, state, zip } = shippingAddress;
  if (!line1 || !city || !state || !zip) {
    return NextResponse.json({ error: "Incomplete shipping address" }, { status: 400 });
  }

  // Fetch all products and variants for validation
  const productIds = [...new Set((items as CartItem[]).map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: { variants: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate items and calculate total
  let totalAmount = 0;
  const lineItems: { price_data: { currency: string; product_data: { name: string }; unit_amount: number }; quantity: number }[] = [];
  const orderItemsData: { productId: string; variantId: string; quantity: number; unitPrice: number }[] = [];

  for (const item of items as CartItem[]) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json({ error: `Product not found` }, { status: 400 });
    }

    const variant = product.variants.find((v) => v.id === item.variantId);
    if (!variant) {
      return NextResponse.json({ error: `Variant not found for ${product.name}` }, { status: 400 });
    }

    if (variant.stock < item.quantity) {
      return NextResponse.json(
        { error: `Not enough stock for ${product.name} (${variant.label}). Only ${variant.stock} left.` },
        { status: 400 }
      );
    }

    totalAmount += product.price * item.quantity;
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: `${product.name} - ${variant.label}` },
        unit_amount: product.price,
      },
      quantity: item.quantity,
    });
    orderItemsData.push({
      productId: product.id,
      variantId: variant.id,
      quantity: item.quantity,
      unitPrice: product.price,
    });
  }

  // Create order
  const order = await prisma.storeOrder.create({
    data: {
      customerName,
      customerEmail,
      shippingAddress: JSON.stringify(shippingAddress),
      totalAmount,
      items: {
        create: orderItemsData,
      },
    },
  });

  // Create Stripe session
  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/store/confirmation?orderId=${order.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/store?cancelled=true`,
    customer_email: customerEmail,
    metadata: { storeOrderId: order.id },
  });

  await prisma.storeOrder.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
