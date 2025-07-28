"use client";

import { useCart } from "@/components/providers/CartProvider";
import { useState } from "react";
import { toast } from "sonner";

const AddToCartButton = ({ product, initialCount = 1 }) => {
  if (!product) return null;

  const [count, setCount] = useState(initialCount);
  const { addToCart } = useCart();

  return (
    <div className="inline-flex flex-nowrap gap-2">
      <div className="flex items-center gap-4 border p-1.5 w-1/2 md:w-auto">
        <button
          className="border block min-w-10 hover:bg-primary hover:text-secondary hover:cursor-pointer"
          onClick={() =>
            setCount((prev) => {
              return prev > 1 ? prev - 1 : 1;
            })
          }
        >
          -
        </button>
        <span>{count}</span>
        <button
          className="border block min-w-10 hover:bg-primary hover:text-secondary hover:cursor-pointer"
          onClick={() =>
            setCount((prev) => {
              return prev + 1;
            })
          }
        >
          +
        </button>
      </div>
      <button
        className="border px-6 py-1.5 bg-primary text-secondary hover:cursor-pointer w-1/2 md:w-auto"
        onClick={() => {
          if (count > product.remainingStock) {
            toast.error("This item is out of stock");
            return;
          }
          addToCart({ ...product, quantity: count });
          setCount(1); // Reset count after adding to cart
          toast.success(`${product.name} added to cart!`, {
            description: `You have added ${count} ${product.brand} - ${product.name} to your cart.`,
          });
        }}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default AddToCartButton;
