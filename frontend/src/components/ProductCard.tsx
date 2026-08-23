import React from 'react';
import { ShoppingCart, Tag, Sparkles, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct }) => {
  const { addToCart, loading } = useCart();
  const { user } = useAuth();

  const isEligibleForDiscount =
    Boolean(product.discountPct && product.discountPct > 0 &&
    product.department &&
    user?.department?.toLowerCase() === product.department.toLowerCase());

  const discountedPrice =
    isEligibleForDiscount && product.discountPct
      ? Number(product.price) * (1 - product.discountPct / 100)
      : Number(product.price);

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={() => onSelectProduct(product)}
    >
      {/* Product Image Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '80%',
          backgroundColor: '#f1f5f9',
          overflow: 'hidden',
        }}
      >
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'}
          alt={product.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
        />

        {/* Department Discount Badge */}
        {product.discountPct && product.discountPct > 0 && product.department && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(6px)',
              color: '#fbbf24',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <Tag size={12} /> {product.department} -{product.discountPct}%
          </div>
        )}

        {/* Stock Status Indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            backgroundColor: product.stock > 0 ? 'rgba(255, 255, 255, 0.92)' : 'rgba(239, 68, 68, 0.92)',
            color: product.stock > 0 ? '#0f172a' : 'white',
            padding: '0.2rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700,
            backdropFilter: 'blur(4px)',
          }}
        >
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Category */}
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          {product.category?.name || 'Official Merchandise'}
        </div>

        {/* Product Name */}
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1.35,
            marginBottom: '0.5rem',
            minHeight: '2.7rem',
          }}
        >
          {product.name}
        </h3>

        {/* AI Description preview snippet */}
        <p
          style={{
            fontSize: '0.825rem',
            color: '#64748b',
            lineHeight: 1.45,
            marginBottom: '1rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.description}
        </p>

        {/* Pricing & Add to Cart Button */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            {isEligibleForDiscount ? (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                  ฿{Number(product.price).toFixed(2)}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>
                  ฿{discountedPrice.toFixed(2)}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1d4ed8' }}>
                ฿{Number(product.price).toFixed(2)}
              </div>
            )}
          </div>

          <button
            className="btn btn-primary btn-sm"
            disabled={product.stock <= 0 || loading}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product.id, 1);
            }}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              opacity: product.stock <= 0 ? 0.6 : 1,
            }}
          >
            <ShoppingCart size={15} /> Add
          </button>
        </div>
      </div>
    </div>
  );
};
