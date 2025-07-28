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
      const alreadyInCart = prevCart.find((cartItem) => cartItem.id === item.id);
      if (alreadyInCart) {
        const updatedCart = prevCart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + item.quantity } : cartItem
        );
        localStorage.setItem("cart", JSON.stringify(updatedCart));
        return updatedCart;
      }
      const updatedCart = [...prevCart, item];
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter((item) => item.id !== itemId);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const updateQuantity = (itemId, quantity) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) => (item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item));
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
