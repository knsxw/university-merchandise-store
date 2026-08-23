import React, { useState } from 'react';
import { ShoppingBag, ShieldCheck, UserCheck, LogOut, ChevronDown, Package, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenLogin }) => {
  const { user, switchDevRole, logout } = useAuth();
  const { cart, openDrawer } = useCart();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="navbar">
      <div className="container flex items-center justify-between" style={{ height: '72px' }}>
        {/* Brand Logo */}
        <div
          className="flex items-center gap-3"
          style={{ cursor: 'pointer' }}
          onClick={() => setCurrentTab('shop')}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 10px rgba(29, 78, 216, 0.3)',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
              SMART STORE
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '-3px' }}>
              University Official Merchandise
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2">
          <button
            className={`nav-link ${currentTab === 'shop' ? 'active' : ''}`}
            onClick={() => setCurrentTab('shop')}
          >
            Shop Catalog
          </button>

          {user && (
            <button
              className={`nav-link ${currentTab === 'orders' ? 'active' : ''}`}
              onClick={() => setCurrentTab('orders')}
            >
              <span className="flex items-center gap-1">
                <Package size={16} /> My Orders
              </span>
            </button>
          )}

          {(user?.role === 'Admin' || user?.role === 'Staff') && (
            <button
              className={`nav-link ${currentTab === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentTab('admin')}
              style={{
                color: currentTab === 'admin' ? '#1d4ed8' : '#64748b',
                fontWeight: 700,
              }}
            >
              <span className="flex items-center gap-1">
                <LayoutDashboard size={16} /> Staff & Admin Portal
              </span>
            </button>
          )}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Cart Trigger */}
          <button
            onClick={openDrawer}
            className="btn btn-secondary"
            style={{ position: 'relative', padding: '0.6rem 0.9rem' }}
            title="Shopping Cart"
          >
            <ShoppingBag size={20} color="#1d4ed8" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              ฿{cart?.subtotal ? cart.subtotal.toFixed(0) : '0'}
            </span>
            {cart && cart.itemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                }}
              >
                {cart.itemCount}
              </span>
            )}
          </button>

          {/* User Account / Role Switcher */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.85rem' }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: user.role === 'Admin' ? '#fee2e2' : user.role === 'Staff' ? '#fef3c7' : '#dbeafe',
                    color: user.role === 'Admin' ? '#b91c1c' : user.role === 'Staff' ? '#b45309' : '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  {user.name.charAt(0)}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.name.split(' ')[0]}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{user.role} ({user.department || 'General'})</div>
                </div>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {/* Dropdown Role Menu */}
              {showRoleMenu && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    width: '260px',
                    padding: '0.75rem',
                    zIndex: 50,
                    boxShadow: 'var(--shadow-xl)',
                  }}
                >
                  <div style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                      Active University Account
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '2px' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
                  </div>

                  <div style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Dev Fast-Switch Role
                  </div>

                  <button
                    onClick={() => { switchDevRole('Student'); setShowRoleMenu(false); }}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '0.3rem' }}
                  >
                    <UserCheck size={14} color="#1d4ed8" /> Student (Computer Science)
                  </button>

                  <button
                    onClick={() => { switchDevRole('Staff'); setShowRoleMenu(false); }}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '0.3rem' }}
                  >
                    <UserCheck size={14} color="#d97706" /> Staff (Store Manager)
                  </button>

                  <button
                    onClick={() => { switchDevRole('Admin'); setShowRoleMenu(false); }}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '0.5rem' }}
                  >
                    <UserCheck size={14} color="#dc2626" /> Administrator
                  </button>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                    <button
                      onClick={() => { logout(); setShowRoleMenu(false); }}
                      className="btn btn-danger btn-sm"
                      style={{ width: '100%' }}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onOpenLogin} className="btn btn-primary" style={{ padding: '0.55rem 1rem' }}>
              Sign In (Entra ID)
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
