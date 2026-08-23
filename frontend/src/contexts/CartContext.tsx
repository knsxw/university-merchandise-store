import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { Cart } from '../types';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  isDrawerOpen: boolean;
  loading: boolean;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  openDrawer: () => void;
  closeDrawer: () => void;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCart = async () => {
    if (!user) {
      setCart(null);
      return;
    }

    try {
      const res = await api.get('/cart');
      setCart(res.data.cart);
    } catch {
      setCart(null);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId: number, quantity: number = 1) => {
    if (!user) {
      alert('Please log in with your University account to add items to cart.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/cart/add', { productId, quantity });
      await fetchCart();
      setIsDrawerOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    setLoading(true);
    try {
      await api.put(`/cart/items/${itemId}`, { quantity });
      await fetchCart();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    setLoading(true);
    try {
      await api.delete(`/cart/items/${itemId}`);
      await fetchCart();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove item');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      await api.delete('/cart/clear');
      await fetchCart();
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isDrawerOpen,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
