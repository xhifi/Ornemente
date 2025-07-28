"use client";

import { useCart } from "@/components/providers/CartProvider";
import { ShoppingCartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ProductCardCartButton = ({ product }) => {
  const { addToCart } = useCart();
  const router = useRouter();

  return (
    <button
      className="absolute bottom-3 right-3 p-3 rounded-full bg-primary text-foreground size-12 hidden group-hover:block transition-all duration-300 ease-in-out z-10 cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        addToCart({ ...product, quantity: 1 });
        return toast.success("Product added to cart!", {
          description: `You have successfully added ${product.name} - ${product.brand} to your cart.`,
          action: {
            label: "View Cart",
            onClick: () => {
              router.push("/cart");
            },
          },
        });
      }}
    >
      <ShoppingCartIcon />
    </button>
  );
};

export default ProductCardCartButton;
