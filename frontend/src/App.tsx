import { useState } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { msalInstance } from './auth/msal';
import { Navbar, NavigationTab } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartDrawer } from './components/CartDrawer';
import { OrdersPage } from './pages/OrdersPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { Order, Product } from './types';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('shop');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [orderNotification, setOrderNotification] = useState<string | null>(null);

  const handleOrderSuccess = (order: Order) => {
    setOrderNotification(`Order #${order.id} was placed successfully.`);
    setCurrentTab('orders');
    setTimeout(() => setOrderNotification(null), 5000);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* Top Notification Banner if Order Placed */}
      {orderNotification && (
        <div className="app-notification">{orderNotification}</div>
      )}

      {/* Main View Router */}
      <main id="main-content" className="app-main">
        {currentTab === 'shop' && (
          <HomePage
            onSelectProduct={(p) => setSelectedProduct(p)}
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

      <footer className="app-footer">
        <div className="container footer-inner">
          <div>
            <span className="footer-mark">CS</span>
            <span>Campus Store · CSX4110</span>
          </div>
          <span>Made for campus life · © 2026</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </MsalProvider>
  );
}
