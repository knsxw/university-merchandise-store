import React, { useState } from 'react';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Store,
  UserCheck,
} from 'lucide-react';
import { isEntraConfigured } from '../auth/msal';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export type NavigationTab = 'shop' | 'orders' | 'admin';

interface NavbarProps {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenLogin }) => {
  const { user, switchDevRole, logout } = useAuth();
  const { cart, openDrawer } = useCart();
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);

  const selectDevRole = async (role: 'Admin' | 'Staff' | 'Student') => {
    await switchDevRole(role);
    setShowRoleMenu(false);
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <button className="brand" onClick={() => setCurrentTab('shop')} aria-label="Open shop">
          <span>
            <span className="brand-name">Campus Store</span>
            <span className="brand-meta">Official university merchandise</span>
          </span>
        </button>

        <nav className="nav-tabs" aria-label="Primary navigation">
          <button
            className={`nav-link ${currentTab === 'shop' ? 'active' : ''}`}
            onClick={() => setCurrentTab('shop')}
          >
            <Store size={15} /> <span>Shop</span>
          </button>

          {user && (
            <button
              className={`nav-link ${currentTab === 'orders' ? 'active' : ''}`}
              onClick={() => setCurrentTab('orders')}
            >
              <Package size={15} /> <span>Orders</span>
            </button>
          )}

          {(user?.role === 'Admin' || user?.role === 'Staff') && (
            <button
              className={`nav-link ${currentTab === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentTab('admin')}
            >
              <LayoutDashboard size={15} /> <span>Manage</span>
            </button>
          )}
        </nav>

        <div className="navbar-actions">
          <button onClick={openDrawer} className="btn btn-secondary" title="Shopping cart">
            <ShoppingBag size={16} />
            <span className="cart-total">฿{cart?.subtotal ? cart.subtotal.toFixed(0) : '0'}</span>
            {Boolean(cart?.itemCount) && <span className="badge badge-purple">{cart?.itemCount}</span>}
          </button>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-secondary account-trigger"
                onClick={() => setShowRoleMenu((visible) => !visible)}
                aria-expanded={showRoleMenu}
              >
                <span className="account-avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="account-copy">
                  <span className="account-name">{user.name.split(' ')[0]}</span>
                  <span className="account-meta">{user.role}</span>
                </span>
                <ChevronDown size={14} />
              </button>

              {showRoleMenu && (
                <div className="card account-menu">
                  <div className="menu-header">
                    <div className="menu-label">Signed in as</div>
                    <div className="account-name" style={{ marginTop: '4px' }}>{user.name}</div>
                    <div className="account-meta">{user.email}</div>
                  </div>

                  {!isEntraConfigured && (
                    <div className="menu-section">
                      <div className="menu-label">Development roles</div>
                      <button onClick={() => selectDevRole('Student')} className="btn btn-secondary btn-sm menu-action">
                        <UserCheck size={14} /> Student
                      </button>
                      <button onClick={() => selectDevRole('Staff')} className="btn btn-secondary btn-sm menu-action">
                        <UserCheck size={14} /> Staff
                      </button>
                      <button onClick={() => selectDevRole('Admin')} className="btn btn-secondary btn-sm menu-action">
                        <UserCheck size={14} /> Administrator
                      </button>
                    </div>
                  )}

                  <div className="menu-section">
                    <button
                      onClick={() => { logout(); setShowRoleMenu(false); }}
                      className="btn btn-danger btn-sm menu-action"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onOpenLogin} className="btn btn-primary">Sign in</button>
          )}
        </div>
      </div>
    </header>
  );
};
