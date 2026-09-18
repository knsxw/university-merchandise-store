import React, { useEffect, useState } from 'react';
import { CloudSun, MapPin, Search, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { Category, Product, WeatherRecommendation } from '../types';
import { ProductCard } from '../components/ProductCard';

interface HomePageProps {
  onSelectProduct: (product: Product) => void;
}

const loadCatalog = async (categoryId: number | null, search: string): Promise<Product[]> => {
  const params: Record<string, string | number> = {};
  if (categoryId !== null) params.categoryId = categoryId;
  if (search) params.search = search;
  const response = await api.get('/products', { params });
  return response.data.products;
};

export const HomePage: React.FC<HomePageProps> = ({ onSelectProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [weather, setWeather] = useState<WeatherRecommendation | null>(null);

  useEffect(() => {
    let ignore = false;

    Promise.allSettled([
      api.get('/products/categories'),
      api.get<WeatherRecommendation>('/weather/recommendations'),
    ]).then(([categoriesResult, weatherResult]) => {
      if (ignore) return;

      if (categoriesResult.status === 'fulfilled') {
        setCategories(categoriesResult.value.data.categories);
      } else {
        console.error('Failed to load product categories:', categoriesResult.reason);
      }

      if (weatherResult.status === 'fulfilled') {
        setWeather(weatherResult.value.data);
      } else {
        console.error('Failed to load weather recommendations:', weatherResult.reason);
      }
    });

    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    loadCatalog(selectedCategoryId, appliedSearchQuery)
      .then((nextProducts) => {
        if (!ignore) setProducts(nextProducts);
      })
      .catch((error) => console.error('Failed to load products:', error))
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => { ignore = true; };
  }, [selectedCategoryId, appliedSearchQuery]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedSearchQuery(searchQuery.trim());
  };

  const resetFilters = () => {
    setSelectedCategoryId(null);
    setSearchQuery('');
    setAppliedSearchQuery('');
  };

  return (
    <div className="container" style={{ paddingBottom: '64px' }}>
      <section className="hero-gradient animate-fade-in">
        <div>
          <div className="eyebrow">2026 collection</div>
          <h1 className="hero-title">Official campus essentials.</h1>
          <p className="hero-copy">
            Apparel, accessories, and study gear from the university store. Sign in with your
            university account for order history and eligible department pricing.
          </p>
        </div>
        <div className="hero-note">
          <ShieldCheck size={16} /> Verified university access
        </div>
      </section>

      {weather && (
        <section className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }} aria-labelledby="weather-heading">
          <div className="flex items-center justify-between" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#1d4ed8',
                  backgroundColor: '#eff6ff',
                }}
              >
                <CloudSun size={24} />
              </div>
              <div>
                <div className="eyebrow">Live campus weather · {weather.source}</div>
                <h2 id="weather-heading" style={{ fontSize: '1.15rem', marginTop: '2px' }}>
                  {weather.current.temperatureC}°C · {weather.current.condition}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2" style={{ color: '#64748b', fontSize: '0.8rem' }}>
              <MapPin size={14} /> {weather.location.name}
            </div>
          </div>

          <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: '0.85rem' }}>
            {weather.recommendation.message}
          </p>

          {weather.recommendation.products.length > 0 && (
            <div className="flex items-center gap-2" style={{ marginTop: '0.85rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 700 }}>Recommended:</span>
              {weather.recommendation.products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onSelectProduct(product)}
                >
                  {product.name}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <section id="catalog">
        <div className="section-header">
          <div>
            <h2 className="section-title">Catalog</h2>
            <p className="section-copy">{loading ? 'Loading products…' : `${products.length} products available`}</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="search-field" role="search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search products"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="form-input"
              aria-label="Search products"
            />
          </form>
        </div>

        <div className="catalog-toolbar">
          <div className="category-tabs" aria-label="Product categories">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`category-tab ${selectedCategoryId === null ? 'active' : ''}`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`category-tab ${selectedCategoryId === category.id ? 'active' : ''}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading catalog…</div>
        ) : products.length === 0 ? (
          <div className="card empty-state">
            <h3 style={{ color: 'var(--text-main)', fontSize: '16px' }}>No products found</h3>
            <p style={{ marginTop: '6px', fontSize: '13px' }}>Try another search or category.</p>
            <button onClick={resetFilters} className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid-products animate-fade-in">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onSelectProduct={onSelectProduct} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
