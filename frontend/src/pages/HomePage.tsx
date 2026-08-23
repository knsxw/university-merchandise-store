import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Shield, Cpu, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';

interface HomePageProps {
  onSelectProduct: (product: Product) => void;
  onOpenAdmin: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectProduct, onOpenAdmin }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategoryId) params.categoryId = selectedCategoryId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params }),
        api.get('/products/categories'),
      ]);

      setProducts(prodRes.data.products);
      setCategories(catRes.data.categories);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategoryId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section className="hero-gradient animate-fade-in">
        <div style={{ maxWidth: '680px', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              padding: '0.4rem 0.9rem',
              borderRadius: '999px',
              fontSize: '0.825rem',
              fontWeight: 700,
              marginBottom: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <Sparkles size={15} color="#fbbf24" /> Official 2026 University Merchandise
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem' }}>
            Wear Your Pride. Built with Modern Smart Tech.
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Seamless Microsoft Entra ID single sign-on, AI-generated product descriptions, and automated peer student department discounts.
          </p>

          <div className="flex items-center gap-3">
            <a
              href="#catalog"
              className="btn btn-primary"
              style={{
                backgroundColor: '#ffffff',
                color: '#1d4ed8',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              }}
            >
              Browse Catalog <ArrowRight size={18} />
            </a>

            <div
              className="flex items-center gap-2"
              style={{
                fontSize: '0.85rem',
                color: '#93c5fd',
                fontWeight: 600,
                marginLeft: '0.5rem',
              }}
            >
              <Shield size={16} /> Entra ID Protected
            </div>
          </div>
        </div>

        {/* Feature Highlights on Hero */}
        <div
          style={{
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <div className="flex items-center gap-2">
            <Cpu size={20} color="#93c5fd" />
            <div style={{ fontSize: '0.85rem' }}>
              <strong>AI Descriptions</strong>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>OpenAI GPT-4 powered</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Shield size={20} color="#93c5fd" />
            <div style={{ fontSize: '0.85rem' }}>
              <strong>Peer API Integration</strong>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>EduCore student sync</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sparkles size={20} color="#93c5fd" />
            <div style={{ fontSize: '0.85rem' }}>
              <strong>Cloud & Docker Ready</strong>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Azure Key Vault + MySQL</div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Search & Filter Controls */}
      <section id="catalog" style={{ marginBottom: '2rem' }}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              Merchandise Collection
            </h2>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} style={{ minWidth: '280px', maxWidth: '400px', flex: 1 }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search hoodie, jacket, bottle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </form>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`btn btn-sm ${selectedCategoryId === null ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '999px', whiteSpace: 'nowrap' }}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`btn btn-sm ${selectedCategoryId === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '999px', whiteSpace: 'nowrap' }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
          <div style={{ fontWeight: 600 }}>Loading merchandise catalog...</div>
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <h3>No merchandise found</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Try adjusting your search keywords or clear category filters.
          </p>
          <button
            onClick={() => { setSelectedCategoryId(null); setSearchQuery(''); fetchProducts(); }}
            className="btn btn-outline-primary btn-sm"
            style={{ marginTop: '1rem' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid-products animate-fade-in">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};
