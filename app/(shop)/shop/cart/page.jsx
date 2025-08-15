"use client";

import { useCart } from "@/components/providers/CartProvider";
import CartQuantityModifier from "@/components/ui/factory/cart/CartQuantityModifier";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { generateThumbnailURL, generate500x500URL } from "@/lib/utils";
import Link from "next/link";

const page = () => {
  const { cart, clearCart, removeFromCart, totalPrice } = useCart();
  console.log(cart);
  return (
    <div>
      {cart.length > 0 ? (
        <div className="px-6 py-12 max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
          <ul className="space-y-3">
            {cart.map((item, index) => {
              return (
                <li key={index} className="flex items-center gap-4 pe-6 hover:bg-secondary">
                  <Image
                    src={generate500x500URL(item?.image?.key)}
                    width={100}
                    height={100}
                    alt={`${item.brand} - ${item.name} - ${item.collection} - ${item.sku}`}
                    priority
                  />
                  <div>
                    <h2 className="text-lg font-bold">
                      {item.name} - {item.brand_name} - {item.selected_size}
                    </h2>
                    <p className="space-x-2">
                      {item.discount === 0 ? (
                        <span>Rs. {item.original_price?.toLocaleString()}</span>
                      ) : (
                        <>
                          <span className="line-through text-destructive">Rs. {item.original_price?.toLocaleString()}</span>
                          <span>Rs. {item.discounted_price?.toLocaleString()}</span>
                        </>
                      )}
                    </p>
                    <p className="text-sm">{item.collection}</p>
                    <p className="text-sm">SKU: {item.sku}</p>
                    <button className="flex items-center gap-1 text-sm mt-2 hover:text-destructive" onClick={() => removeFromCart(item.id)}>
                      <Trash2Icon className="size-4" /> Remove from Cart
                    </button>
                  </div>
                  <div className="ms-auto flex flex-col items-center gap-2">
                    <CartQuantityModifier product={item} initialCount={item.quantity} />
                    <span className="text-3xl font-semibold">
                      <span className="text-base me-1 text-primary/50">Rs.</span>
                      {item.discount === 0
                        ? (item.original_price * item.selected_quantity)?.toLocaleString()
                        : (item.discounted_price * item.selected_quantity)?.toLocaleString()}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <button
            className="mt-4 px-6 py-2 bg-primary text-secondary hover:bg-secondary hover:text-primary rounded"
            onClick={() => clearCart()}
          >
            Clear Cart
          </button>
          <h2 className="text-xl font-bold mb-4">Total: Rs. {totalPrice?.toLocaleString() || "0"}</h2>
          <Link
            className="mt-4 px-6 py-2 bg-primary text-secondary hover:bg-secondary hover:text-primary rounded"
            href="/shop/cart/checkout"
          >
            Proceed to Checkout
          </Link>
        </div>
      ) : (
        <div className="px-6 py-12 max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-bold">Your Cart is Empty</h1>
          <p className="mt-4">Add items to your cart to see them here.</p>
        </div>
      )}
    </div>
  );
};

export default page;
