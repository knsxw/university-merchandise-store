import React, { useState, useEffect } from 'react';
import { Package, Calendar, Clock, CheckCircle, XCircle, Tag, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { Order } from '../types';

export const OrdersPage: React.FC<{ onBackToShop: () => void }> = ({ onBackToShop }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data.orders);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-green"><CheckCircle size={12} /> Completed</span>;
      case 'PROCESSING':
        return <span className="badge badge-blue"><Clock size={12} /> Processing</span>;
      case 'CANCELLED':
        return <span className="badge badge-amber"><XCircle size={12} /> Cancelled</span>;
      default:
        return <span className="badge badge-purple"><Clock size={12} /> Pending</span>;
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem', paddingTop: '1.5rem' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>My Order History</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Track and view official university merchandise orders and discount receipts
          </p>
        </div>

        <button onClick={onBackToShop} className="btn btn-secondary">
          Continue Shopping <ArrowRight size={16} />
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
          Loading your order history...
        </div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
          <Package size={52} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <h3>No orders placed yet</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Check out the store catalog to purchase university merchandise!
          </p>
          <button onClick={onBackToShop} className="btn btn-primary btn-sm" style={{ marginTop: '1.25rem' }}>
            Browse Merchandise
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-fade-in">
          {orders.map((order) => (
            <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
              {/* Order Header */}
              <div
                className="flex items-center justify-between"
                style={{
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--border)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                      Order #{order.id}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-3" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} /> {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {order.discountApplied > 0 && (
                      <span className="flex items-center gap-1" style={{ color: '#059669', fontWeight: 700 }}>
                        <Tag size={13} /> Saved ฿{Number(order.discountApplied).toFixed(2)} with Peer Department Discount
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Paid</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1d4ed8' }}>
                    ฿{Number(order.totalPrice).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Order Item List */}
              <div className="flex flex-col gap-3" style={{ paddingTop: '1rem' }}>
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product?.imageUrl || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=150&q=80'}
                        alt={item.product?.name}
                        style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#0f172a' }}>
                          {item.product?.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Qty: {item.quantity} × ฿{Number(item.price).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      ฿{(Number(item.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
