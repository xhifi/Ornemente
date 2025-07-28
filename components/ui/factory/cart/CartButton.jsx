"use client";
import { useCart } from "@/components/providers/CartProvider";
import { ShoppingCartIcon } from "lucide-react";
import Link from "next/link";

const CartButton = () => {
  const { cart } = useCart();

  return (
    <Link href="/cart" className="relative">
      <ShoppingCartIcon className="size-7" />
      {cart?.length > 0 && (
        <span className="absolute -top-1 -right-1 aspect-square bg-red-500 text-white text-xs rounded-full px-1">
          {cart.reduce((total, item) => total + item.quantity, 0)}
        </span>
      )}
    </Link>
  );
};

export default CartButton;
