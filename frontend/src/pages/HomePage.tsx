import React, { useEffect, useState } from 'react';
import { ArrowDownRight, CloudSun, MapPin, Search, ShieldCheck } from 'lucide-react';
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

  const featuredProduct = products[0];
  const featuredImage = featuredProduct?.imageUrl
    || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85';

  return (
    <div className="container home-page">
      <section className="hero-gradient" aria-labelledby="hero-heading">
        <div className="hero-copy-column">
          <div className="eyebrow hero-reveal">The 2026 campus collection</div>
          <h1 id="hero-heading" className="hero-title hero-reveal hero-reveal-delay-1">
            Built for the <em>in-between.</em>
          </h1>
          <p className="hero-copy">
            From the 8 a.m. lecture to the late library run—official pieces made to keep up
            with real campus days.
          </p>
          <div className="hero-actions hero-reveal hero-reveal-delay-2">
            <a className="btn btn-primary hero-cta" href="#catalog">
              Shop the collection <ArrowDownRight size={17} />
            </a>
            <span className="hero-note">
              <ShieldCheck size={16} /> Verified university access
            </span>
          </div>
        </div>

        <div className="hero-visual hero-reveal hero-reveal-delay-2" aria-hidden="true">
          <div className="hero-image-frame">
            <img src={featuredImage} alt="" />
          </div>
          <div className="hero-stamp">
            <span>Official</span>
            <strong>CS</strong>
            <span>Campus issue</span>
          </div>
          <div className="hero-caption">
            <span>01 / Everyday uniform</span>
            <span>{featuredProduct?.category?.name || 'Campus apparel'}</span>
          </div>
        </div>
      </section>

      {weather && (
        <section className="weather-strip" aria-labelledby="weather-heading">
          <div className="weather-summary">
            <div className="weather-icon">
                <CloudSun size={24} />
            </div>
            <div>
              <div className="eyebrow">What to wear now · {weather.source}</div>
              <h2 id="weather-heading">
                {weather.current.temperatureC}° <span>{weather.current.condition}</span>
              </h2>
            </div>
          </div>

          <p className="weather-message">
            {weather.recommendation.message}
          </p>

          <div className="weather-location">
            <MapPin size={14} /> {weather.location.name}
          </div>

          {weather.recommendation.products.length > 0 && (
            <div className="weather-products">
              <span>Today’s picks</span>
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
            <div className="eyebrow">Wear it your way</div>
            <h2 className="section-title">The campus edit</h2>
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
