"use client";

import { useCart } from "@/components/providers/CartProvider";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const AddToCartButton = ({ product, initialCount = 1 }) => {
  if (!product) return null;

  // Make sure we have valid sizes array and select first valid size
  const validSizes = Array.isArray(product.sizes) ? product.sizes : [];
  const firstValidSize = validSizes.length > 0 ? validSizes[0] : null;

  const [count, setCount] = useState(initialCount);
  const [selectedSize, setSelectedSize] = useState(firstValidSize);
  const { addToCart, cart } = useCart();

  // Calculate actual remaining stock after considering cart
  const getRemainingStock = () => {
    if (!selectedSize) return 0;

    // Get the base stock value
    const stockValue = selectedSize.remainingStock || selectedSize.stock || 0;

    // Calculate how many of this product and size are already in cart by checking sku
    const cartQuantity = cart
      .filter(
        (item) =>
          // Match by SKU if available, otherwise fallback to product_id + size matching
          item.sku === selectedSize.sku ||
          (item.product_id === product.id && (item.size_id === selectedSize.id || item.selected_size === selectedSize.code))
      )
      .reduce((sum, item) => sum + (item.selected_quantity || item.quantity || 0), 0);

    // Return actual remaining stock
    return Math.max(0, stockValue - cartQuantity);
  };

  // Only reset count when size changes, don't depend on selectedSize which might be undefined
  useEffect(() => {
    if (selectedSize) {
      setCount(initialCount);
    }
  }, [selectedSize?.id]);

  // Modified cart effect to avoid potential infinite loops and undefined selectedSize
  useEffect(() => {
    const itemInCart = cart.find((item) => item.id === product.id);
    if (itemInCart && itemInCart.size) {
      // Find matching size from product sizes to ensure we have the complete object
      const matchingSize = product.sizes.find((size) => size.id === itemInCart.size_id || size.code === itemInCart.selected_size);
      if (matchingSize) {
        setCount(itemInCart.selected_quantity || itemInCart.quantity || initialCount);
        setSelectedSize(matchingSize); // Set the complete size object from product.sizes
      }
    }
  }, [cart, product.id]);

  return (
    <div className="inline-flex gap-2 flex-col">
      <p>SKU: {selectedSize?.sku}</p>

      <ul className="flex items-center gap-2">
        {product.sizes.map((size, i) => {
          // Calculate stock for this size considering cart
          const sizeCartQuantity = cart
            .filter(
              (item) =>
                item.sku === size.sku || (item.product_id === product.id && (item.size_id === size.id || item.selected_size === size.code))
            )
            .reduce((sum, item) => sum + (item.selected_quantity || item.quantity || 0), 0);

          const sizeRemainingStock = Math.max(0, (size.remainingStock || size.stock || 0) - sizeCartQuantity);

          return (
            <li key={size?.code}>
              <button
                className={`px-3 py-1 border ${
                  size?.code === selectedSize?.code ? "bg-primary text-secondary" : ""
                } hover:bg-primary hover:text-secondary ${sizeRemainingStock <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => {
                  return setSelectedSize(size);
                }}
                disabled={sizeRemainingStock <= 0}
              >
                {size.code}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-4 border p-1.5">
        <button
          className={`border block min-w-10 ${
            count > 1 && selectedSize ? "hover:bg-primary hover:text-secondary hover:cursor-pointer" : "opacity-50"
          }`}
          onClick={() =>
            setCount((prev) => {
              return prev > 1 ? prev - 1 : 1;
            })
          }
          disabled={count <= 1 || !selectedSize}
        >
          -
        </button>
        <span>{count}</span>
        <button
          className={`border block min-w-10 ${
            selectedSize && count < getRemainingStock() ? "hover:bg-primary hover:text-secondary hover:cursor-pointer" : "opacity-50"
          }`}
          onClick={() => {
            if (!selectedSize) return;

            // Calculate how many more can be added based on cart
            const maxAvailable = getRemainingStock();

            // The maximum count should not exceed the remaining stock considering cart items
            setCount((prev) => {
              return prev < maxAvailable ? prev + 1 : maxAvailable;
            });
          }}
          disabled={!selectedSize || count >= getRemainingStock()}
        >
          +
        </button>
      </div>
      <button
        className={`border px-6 py-1.5 bg-primary text-secondary ${
          !selectedSize || count > getRemainingStock() ? "opacity-50 cursor-not-allowed" : "hover:cursor-pointer"
        } w-1/2 md:w-auto`}
        onClick={() => {
          // Guard against missing selectedSize
          if (!selectedSize) {
            toast.error("Please select a size");
            return;
          }

          // Check if this specific product and size is already in cart based on SKU or product/size combo
          const sameItemInCart = cart.find(
            (item) =>
              item.sku === selectedSize.sku ||
              (item.product_id === product.id && (item.size_id === selectedSize.id || item.selected_size === selectedSize.code))
          );

          const cartQuantity = sameItemInCart ? sameItemInCart.selected_quantity || sameItemInCart.quantity || 0 : 0;
          const totalStock = selectedSize.remainingStock || selectedSize.stock || 0;
          const remainingStock = getRemainingStock();

          // Check if adding would exceed available stock
          if (count > remainingStock) {
            toast.error(`Cannot add ${count} more items`, {
              description: `You already have ${cartQuantity} in your cart. Only ${totalStock} total available.`,
            });
            return;
          }

          addToCart({
            product_id: product.id,
            size_id: selectedSize.id,
            sku: selectedSize.sku,
            name: product.name,
            image: product.images[0],
            brand_name: product.brand_name,
            original_price: product.original_price,
            discounted_price: product.discounted_price,
            discount: product.discount,
            type_name: product.type_name,
            selected_size: selectedSize.code,
            selected_quantity: count,
            available_stock: selectedSize.stock,
          });

          setCount(1); // Reset count after adding to cart
          toast.success(`${product.name} added to cart!`, {
            description: `You have added ${count} ${product.brand} - ${product.name} (${selectedSize.code}) to your cart.`,
          });
        }}
        disabled={!selectedSize}
      >
        Add to Cart
      </button>
      {selectedSize && (
        <>
          {/* Show cart quantity if any */}
          {cart.some(
            (item) =>
              item.sku === selectedSize.sku ||
              (item.product_id === product.id && (item.size_id === selectedSize.id || item.selected_size === selectedSize.code))
          ) && (
            <p className="text-sm text-muted-foreground">
              {cart
                .filter(
                  (item) =>
                    item.sku === selectedSize.sku ||
                    (item.product_id === product.id && (item.size_id === selectedSize.id || item.selected_size === selectedSize.code))
                )
                .reduce((sum, item) => sum + (item.selected_quantity || item.quantity || 0), 0)}{" "}
              already in cart
            </p>
          )}
          <h3 className="animate-pulse text-destructive">Only {getRemainingStock()} remaining in stock!</h3>
        </>
      )}
    </div>
  );
};

export default AddToCartButton;
