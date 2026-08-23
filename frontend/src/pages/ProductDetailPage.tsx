import React, { useState } from 'react';
import { X, ShoppingBag, Tag, Sparkles, ShieldCheck, Check, Truck, RotateCcw } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface ProductDetailPageProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product, onClose }) => {
  const { addToCart, loading } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!product) return null;

  const isEligibleForDiscount = Boolean(
    product.discountPct &&
    product.discountPct > 0 &&
    product.department &&
    user?.department?.toLowerCase() === product.department.toLowerCase()
  );

  const discountedPrice =
    isEligibleForDiscount && product.discountPct
      ? Number(product.price) * (1 - product.discountPct / 100)
      : Number(product.price);

  const handleAddToCart = async () => {
    await addToCart(product.id, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 0,
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {/* Image Column */}
          <div style={{ position: 'relative', backgroundColor: '#f8fafc' }}>
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '380px',
                objectFit: 'cover',
              }}
            />
            {product.discountPct && product.discountPct > 0 && product.department && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  color: '#fbbf24',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Tag size={14} /> {product.department} Department Special
              </div>
            )}
          </div>

          {/* Details Column */}
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {product.category?.name || 'Official Merchandise'}
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25, marginBottom: '0.75rem' }}>
              {product.name}
            </h2>

            {/* Pricing Details */}
            <div style={{ marginBottom: '1.5rem' }}>
              {isEligibleForDiscount ? (
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a' }}>
                    ฿{discountedPrice.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '1.1rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                    ฿{Number(product.price).toFixed(2)}
                  </span>
                  <span className="badge badge-green">
                    -{product.discountPct}% Student Discount
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1d4ed8' }}>
                    ฿{Number(product.price).toFixed(2)}
                  </span>
                  {product.discountPct && product.discountPct > 0 && product.department && (
                    <span className="badge badge-amber">
                      {product.discountPct}% off for {product.department} Students
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* AI Generated Description Callout */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '1.15rem',
                marginBottom: '1.5rem',
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                <Sparkles size={16} color="#d97706" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                  AI-Curated Product Story
                </span>
              </div>
              <p style={{ fontSize: '0.925rem', color: '#334155', lineHeight: 1.6 }}>
                {product.description}
              </p>
            </div>

            {/* Stock Availability */}
            <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: product.stock > 0 ? '#10b981' : '#ef4444',
                }}
              />
              <span style={{ fontWeight: 600 }}>
                {product.stock > 0 ? `In Stock (${product.stock} items ready)` : 'Currently Out of Stock'}
              </span>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="flex items-center gap-3" style={{ marginTop: 'auto', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '0.6rem 0.9rem', border: 'none', background: '#f8fafc', cursor: 'pointer', fontWeight: 700 }}
                >
                  -
                </button>
                <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  style={{ padding: '0.6rem 0.9rem', border: 'none', background: '#f8fafc', cursor: 'pointer', fontWeight: 700 }}
                >
                  +
                </button>
              </div>

              <button
                className="btn btn-primary"
                disabled={product.stock <= 0 || loading}
                onClick={handleAddToCart}
                style={{ flex: 1, padding: '0.75rem 1.25rem', fontSize: '1rem' }}
              >
                {addedSuccess ? (
                  <>
                    <Check size={18} /> Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Add to Cart (฿{(discountedPrice * quantity).toFixed(2)})
                  </>
                )}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
              <span className="flex items-center gap-1"><Truck size={14} /> Campus Pickup / Delivery</span>
              <span className="flex items-center gap-1"><ShieldCheck size={14} /> Official Licensing</span>
              <span className="flex items-center gap-1"><RotateCcw size={14} /> Easy Exchanges</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
