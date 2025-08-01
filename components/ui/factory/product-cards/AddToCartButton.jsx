"use client";

import { useCart } from "@/components/providers/CartProvider";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const AddToCartButton = ({ product, initialCount = 1 }) => {
  if (!product) return null;

  const [count, setCount] = useState(initialCount);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const { addToCart } = useCart();

  useEffect(() => {
    setCount(initialCount);
  }, [selectedSize]);

  return (
    <div className="inline-flex gap-2 flex-col">
      <ul className="flex items-center gap-2">
        {product.sizes.map((size, i) => {
          return (
            <li key={size.code}>
              <button
                className={`px-3 py-1 border ${
                  size.code === selectedSize.code ? "bg-primary text-secondary" : ""
                } hover:bg-primary hover:text-secondary`}
                onClick={() => {
                  return setSelectedSize(size);
                }}
                disabled={size.remainingStock <= 0}
              >
                {size.code}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-4 border p-1.5">
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
            // The maximum count should not exceed the remaining stock of the selected size
            setCount((prev) => {
              return prev < selectedSize.stock ? prev + 1 : selectedSize.stock;
            })
          }
        >
          +
        </button>
      </div>
      <button
        className="border px-6 py-1.5 bg-primary text-secondary hover:cursor-pointer w-1/2 md:w-auto"
        onClick={() => {
          if (count > selectedSize.remainingStock) {
            toast.error("This item is out of stock");
            return;
          }
          addToCart({ ...product, quantity: count, size: selectedSize });
          setCount(1); // Reset count after adding to cart
          toast.success(`${product.name} added to cart!`, {
            description: `You have added ${count} ${product.brand} - ${product.name} (${selectedSize.code}) to your cart.`,
          });
        }}
      >
        Add to Cart
      </button>
      <h3 className="animate-pulse text-destructive">Only {selectedSize.stock} remaining in stock!</h3>
    </div>
  );
};

export default AddToCartButton;
