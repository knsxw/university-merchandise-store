import React, { useState } from 'react';
import { X, ShoppingBag, Tag, Check } from 'lucide-react';
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
        className="card animate-fade-in product-dialog"
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
          className="icon-button"
          aria-label="Close product details"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
          }}
        >
          <X size={20} />
        </button>

        <div className="product-dialog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {/* Image Column */}
          <div className="product-dialog-media" style={{ position: 'relative', backgroundColor: 'var(--primary-light)' }}>
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
                  background: 'rgba(255, 255, 255, 0.92)',
                  color: '#3f3f46',
                  padding: '0.4rem 0.8rem',
                  border: '1px solid var(--border)',
                  borderRadius: '7px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Tag size={14} /> {product.department} pricing
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="product-dialog-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
              {product.category?.name || 'Official Merchandise'}
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 650, color: 'var(--text-main)', lineHeight: 1.25, marginBottom: '0.75rem' }}>
              {product.name}
            </h2>

            {/* Pricing Details */}
            <div style={{ marginBottom: '1.5rem' }}>
              {isEligibleForDiscount ? (
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.75rem', fontWeight: 650, color: 'var(--success)' }}>
                    ฿{discountedPrice.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    ฿{Number(product.price).toFixed(2)}
                  </span>
                  <span className="badge badge-green">
                    -{product.discountPct}% Student Discount
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.75rem', fontWeight: 650, color: 'var(--text-main)' }}>
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

            {/* Product description */}
            <div
              style={{
                backgroundColor: 'var(--primary-light)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '1.15rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#52525b' }}>
                  Description
                </span>
              </div>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
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
            <div className="flex items-center gap-3 product-dialog-actions" style={{ marginTop: 'auto', marginBottom: '1.5rem' }}>
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
                    <Check size={18} /> Added
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Add to cart · ฿{(discountedPrice * quantity).toFixed(2)}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
