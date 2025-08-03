"use client";

import { useCart } from "@/components/providers/CartProvider";
import CartQuantityModifier from "@/components/ui/factory/cart/CartQuantityModifier";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import path from "path";
import { generateThumbnailURL } from "@/lib/utils";

const page = () => {
  const { cart, clearCart, removeFromCart } = useCart();

  return (
    <div>
      {cart.length > 0 ? (
        <div className="px-6 py-12 max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
          <ul className="space-y-3">
            {cart.map((item, index) => {
              const discount = item?.discount > 0 && (item?.discount / 100) * item?.original_price;
              const discountedPrice = parseInt(discount && item?.original_price - discount);

              return (
                <li key={index} className="flex items-center gap-4 pe-6 hover:bg-secondary">
                  <Image
                    src={generateThumbnailURL(item.images[0].key)}
                    width={100}
                    height={100}
                    alt={`${item.brand} - ${item.name} - ${item.collection} - ${item.sku}`}
                    priority
                  />
                  <div>
                    <h2 className="text-lg font-bold">
                      {item.name} - {item.brand_name}
                    </h2>
                    <p className="space-x-2">
                      {discountedPrice ? (
                        <>
                          <span className="line-through text-destructive">Rs. {item.original_price?.toLocaleString()}</span>
                          <span>Rs. {discountedPrice?.toLocaleString()}</span>
                        </>
                      ) : (
                        <span>Rs. {item.original_price?.toLocaleString()}</span>
                      )}
                    </p>
                    <p className="text-sm">{item.collection}</p>
                    <p className="text-sm">SKU: {item.sku}</p>
                    <button className="flex items-center gap-1 text-sm " onClick={() => removeFromCart(item.id)}>
                      <Trash2Icon className="size-4" /> Remove from Cart
                    </button>
                  </div>
                  <div className="ms-auto flex flex-col items-center gap-2">
                    <CartQuantityModifier product={item} initialCount={item.quantity} />
                    <span className="text-3xl font-semibold">
                      <span className="text-base me-1 text-primary/50">Rs.</span>
                      {discountedPrice
                        ? (discountedPrice * item.quantity)?.toLocaleString()
                        : (item.original_price * item.quantity)?.toLocaleString()}
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
          <h2 className="text-xl font-bold">
            Total: Rs.{" "}
            {cart
              .reduce((total, item) => {
                const discountedPrice =
                  item.discount !== 0 && Math.round(item.original_price - (item.discount * item.original_price) / 100);
                return total + discountedPrice * item.quantity;
              }, 0)
              .toLocaleString()}
          </h2>
          <button className="mt-4 px-6 py-2 bg-primary text-secondary hover:bg-secondary hover:text-primary rounded">
            ADD CONTINUE SHOPPING BEFORE THIS BUTTON Proceed to Checkout
          </button>
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
