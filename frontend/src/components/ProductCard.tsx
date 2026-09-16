import React from 'react';
import { Plus, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
}

const fallbackImage = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80';

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct }) => {
  const { addToCart, loading } = useCart();
  const { user } = useAuth();

  const isEligibleForDiscount = Boolean(
    product.discountPct &&
    product.discountPct > 0 &&
    product.department &&
    user?.department?.toLowerCase() === product.department.toLowerCase()
  );

  const discountedPrice = isEligibleForDiscount && product.discountPct
    ? Number(product.price) * (1 - product.discountPct / 100)
    : Number(product.price);

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    addToCart(product.id, 1);
  };

  return (
    <article className="card product-card" onClick={() => onSelectProduct(product)}>
      <div className="product-media">
        <img src={product.imageUrl || fallbackImage} alt={product.name} className="product-image" />

        {Boolean(product.discountPct && product.department) && (
          <span className="badge badge-amber" style={{ position: 'absolute', top: '10px', left: '10px' }}>
            <Tag size={11} /> {product.discountPct}% department pricing
          </span>
        )}

        <span className={`product-stock ${product.stock <= 0 ? 'out' : ''}`}>
          {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
        </span>
      </div>

      <div className="product-content">
        <div className="product-category">{product.category?.name || 'Merchandise'}</div>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>

        <div className="product-footer">
          <div>
            {isEligibleForDiscount && (
              <div className="product-price-old">฿{Number(product.price).toFixed(2)}</div>
            )}
            <div className={`product-price ${isEligibleForDiscount ? 'product-price-discount' : ''}`}>
              ฿{discountedPrice.toFixed(2)}
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            disabled={product.stock <= 0 || loading}
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
    </article>
  );
};
