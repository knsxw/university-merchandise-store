import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface CartDrawerProps {
  onOrderSuccess: (order: any) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOrderSuccess }) => {
  const { cart, isDrawerOpen, closeDrawer, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isDrawerOpen) return null;

  // Calculate estimated department discounts
  const hasDepartmentDiscount = cart?.items.some(
    (item) =>
      item.product.discountPct &&
      item.product.discountPct > 0 &&
      item.product.department &&
      user?.department?.toLowerCase() === item.product.department.toLowerCase()
  );

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;

    setIsCheckingOut(true);
    try {
      const res = await api.post('/orders/checkout');
      await clearCart();
      closeDrawer();
      onOrderSuccess(res.data.order);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeDrawer}>
      <div className="drawer-right" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <ShoppingBag size={22} color="#1d4ed8" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Your Shopping Cart ({cart?.itemCount || 0})
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Peer API Student Discount Banner */}
        {hasDepartmentDiscount && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: '#ecfdf5',
              borderBottom: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.825rem',
              color: '#065f46',
            }}
          >
            <ShieldCheck size={18} color="#059669" />
            <div>
              <strong>Peer EduCore Verification Active:</strong> Enrolled in {user?.department}, department discount will be applied!
            </div>
          </div>
        )}

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {!cart || cart.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p style={{ fontWeight: 600, fontSize: '1.05rem', color: '#334155' }}>Your cart is empty</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Explore the university catalog and add gear to your bag!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cart.items.map((item) => {
                const isItemEligible =
                  item.product.discountPct &&
                  item.product.discountPct > 0 &&
                  item.product.department &&
                  user?.department?.toLowerCase() === item.product.department.toLowerCase();

                const itemPrice = isItemEligible
                  ? Number(item.product.price) * (1 - (item.product.discountPct || 0) / 100)
                  : Number(item.product.price);

                return (
                  <div
                    key={item.id}
                    className="flex gap-3"
                    style={{
                      paddingBottom: '1rem',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    {/* Item Thumbnail */}
                    <img
                      src={item.product.imageUrl || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=200&q=80'}
                      alt={item.product.name}
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        backgroundColor: '#f1f5f9',
                      }}
                    />

                    {/* Item Details */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div className="flex justify-between items-start">
                        <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {isItemEligible && (
                        <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                          <Tag size={10} style={{ display: 'inline', marginRight: '3px' }} />
                          {item.product.department} discount (-{item.product.discountPct}%)
                        </div>
                      )}

                      <div className="flex items-center justify-between" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                        {/* Quantity Controls */}
                        <div className="flex items-center" style={{ border: '1px solid var(--border)', borderRadius: '6px' }}>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            style={{
                              padding: '0.2rem 0.5rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#64748b',
                            }}
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            style={{
                              padding: '0.2rem 0.5rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#64748b',
                            }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        {/* Price */}
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1d4ed8' }}>
                            ฿{(itemPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Checkout Summary */}
        {cart && cart.items.length > 0 && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid var(--border)',
              backgroundColor: '#f8fafc',
            }}
          >
            <div className="flex justify-between" style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600 }}>฿{cart.subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between" style={{ marginBottom: '1rem', fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
              <span>Order Total</span>
              <span style={{ color: '#1d4ed8' }}>฿{cart.subtotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
            >
              {isCheckingOut ? (
                'Verifying & Processing Order...'
              ) : (
                <>
                  Complete Purchase <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
