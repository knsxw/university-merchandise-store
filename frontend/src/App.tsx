import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartDrawer } from './components/CartDrawer';
import { OrdersPage } from './pages/OrdersPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { Product } from './types';
import { ShieldCheck, Heart, Github } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'shop' | 'orders' | 'admin'>('shop');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [orderNotification, setOrderNotification] = useState<string | null>(null);

  const handleOrderSuccess = (order: any) => {
    setOrderNotification(`🎉 Order #${order.id} confirmed successfully!`);
    setCurrentTab('orders');
    setTimeout(() => setOrderNotification(null), 5000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => setCurrentTab(tab as any)}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* Top Notification Banner if Order Placed */}
      {orderNotification && (
        <div
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            textAlign: 'center',
            padding: '0.75rem',
            fontWeight: 700,
            fontSize: '0.925rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {orderNotification}
        </div>
      )}

      {/* Main View Router */}
      <main style={{ flex: 1 }}>
        {currentTab === 'shop' && (
          <HomePage
            onSelectProduct={(p) => setSelectedProduct(p)}
            onOpenAdmin={() => setCurrentTab('admin')}
          />
        )}

        {currentTab === 'orders' && (
          <OrdersPage onBackToShop={() => setCurrentTab('shop')} />
        )}

        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Modals and Drawers */}
      <ProductDetailPage
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartDrawer onOrderSuccess={handleOrderSuccess} />

      {showLoginModal && (
        <LoginPage
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowLoginModal(false)}
        />
      )}

      {/* University Official Footer */}
      <footer
        style={{
          backgroundColor: '#0f172a',
          color: '#94a3b8',
          borderTop: '1px solid #1e293b',
          padding: '2.5rem 0',
          marginTop: 'auto',
          fontSize: '0.85rem',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px solid #1e293b',
            }}
          >
            <div>
              <div className="flex items-center gap-2" style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.4rem' }}>
                <ShieldCheck size={20} color="#3b82f6" /> Smart University Merchandise Store
              </div>
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                CSX4110 Backend Application Development • Section 541 (1/2026)
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'white', fontWeight: 700, marginBottom: '0.2rem' }}>Project Team</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Khine Khant (6611718) • Siva Paoren (6630064) • Thant Zin Oo (6722060)</div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '1.5rem',
              fontSize: '0.75rem',
              color: '#64748b',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              Powered by Microsoft Entra ID • Azure Key Vault • OpenAI API • EduCore Peer Integration • Docker Compose
            </div>
            <div>
              © 2026 Smart University Merchandise Store. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
