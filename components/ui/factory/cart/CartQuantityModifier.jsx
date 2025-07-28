"use client";

import { useCart } from "@/components/providers/CartProvider";
import { Trash2Icon } from "lucide-react";

const CartQuantityModifier = ({ product }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center gap-3 border p-1.5 w-1/2 md:w-auto">
      {product.quantity > 1 ? (
        <button
          className="border block min-w-10 hover:bg-primary hover:text-secondary hover:cursor-pointer"
          onClick={() => updateQuantity(product.id, product.quantity - 1)}
        >
          -
        </button>
      ) : (
        <button
          className="border block min-w-10 hover:text-secondary hover:cursor-pointer px-3 py-1 hover:bg-destructive text-primary"
          onClick={() => removeFromCart(product.id)}
        >
          <Trash2Icon className="size-4 mx-auto" />
        </button>
      )}
      <span>{product.quantity}</span>
      <button
        className="border block min-w-10 hover:bg-primary hover:text-secondary hover:cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        disabled={product.quantity >= product.remainingStock}
        onClick={() => {
          if (product.quantity < product.remainingStock) {
            return updateQuantity(product.id, product.quantity + 1);
          }
        }}
      >
        +
      </button>
    </div>
  );
};

export default CartQuantityModifier;
