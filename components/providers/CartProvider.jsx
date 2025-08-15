"use client";

import { createContext, useState, useEffect, useContext } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  const addToCart = (item) => {
    setCart((prevCart) => {
      const alreadyInCart = prevCart.find((cartItem) => cartItem.sku === item.sku);
      if (alreadyInCart) {
        const updatedCart = prevCart.map((cartItem) =>
          cartItem.sku === item.sku ? { ...cartItem, selected_quantity: cartItem.selected_quantity + item.selected_quantity } : cartItem
        );
        localStorage.setItem("cart", JSON.stringify(updatedCart));
        return updatedCart;
      }
      const updatedCart = [...prevCart, item];
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const removeFromCart = (sku) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter((item) => item.sku !== sku);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  const totalPrice = cart.reduce((total, item) => {
    const discountedPrice =
      item.discount === 0 ? Math.round(item.original_price - (item.discount * item.original_price) / 100) : item.original_price;
    return total + discountedPrice * item.selected_quantity;
  }, 0);

  const updateQuantity = (sku, quantity) => {
    console.log(sku);
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) => (item.sku === sku ? { ...item, selected_quantity: Math.max(1, quantity) } : item));
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalPrice, updateQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
