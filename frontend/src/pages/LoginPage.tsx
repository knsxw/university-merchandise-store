import React, { useState } from 'react';
import { ShieldCheck, UserCheck, ArrowRight, Sparkles, Lock, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onClose, onSuccess }) => {
  const { loginWithMicrosoft, switchDevRole, loading } = useAuth();
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customDepartment, setCustomDepartment] = useState('Computer Science');

  const handleEntraIdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithMicrosoft({
      email: customEmail || 'khine.k@student.university.edu',
      name: customName || 'Khine Khant',
      department: customDepartment,
      microsoftId: `ms-student-${Date.now()}`,
    });
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  const handleQuickRole = async (role: 'Admin' | 'Staff' | 'Student') => {
    await switchDevRole(role);
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '2rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <X size={20} />
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              margin: '0 auto 1rem',
              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.3)',
            }}
          >
            <ShieldCheck size={28} />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
            University Single Sign-On
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Secured by Microsoft Entra ID (Active Directory)
          </p>
        </div>

        {/* Quick Demo Fast-Login Buttons */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            Instant Dev Profiles
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleQuickRole('Student')}
              disabled={loading}
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '0.65rem 1rem' }}
            >
              <div className="flex items-center gap-2">
                <UserCheck size={16} color="#1d4ed8" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Student Account</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Computer Science Department (CSX4110)</div>
                </div>
              </div>
              <ArrowRight size={14} color="#94a3b8" />
            </button>

            <button
              onClick={() => handleQuickRole('Staff')}
              disabled={loading}
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '0.65rem 1rem' }}
            >
              <div className="flex items-center gap-2">
                <UserCheck size={16} color="#d97706" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Store Staff Member</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Product CRUD & Stock Management</div>
                </div>
              </div>
              <ArrowRight size={14} color="#94a3b8" />
            </button>

            <button
              onClick={() => handleQuickRole('Admin')}
              disabled={loading}
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '0.65rem 1rem' }}
            >
              <div className="flex items-center gap-2">
                <UserCheck size={16} color="#dc2626" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Administrator</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Full RBAC & Sales Reports</div>
                </div>
              </div>
              <ArrowRight size={14} color="#94a3b8" />
            </button>
          </div>
        </div>

        {/* Microsoft Entra ID Custom Form */}
        <div style={{ position: 'relative', textAlign: 'center', margin: '1.5rem 0' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              padding: '0 0.75rem',
              fontSize: '0.75rem',
              color: '#94a3b8',
              fontWeight: 700,
            }}
          >
            OR SIGN IN WITH CUSTOM IDENTITY
          </span>
        </div>

        <form onSubmit={handleEntraIdLogin} className="flex flex-col gap-3">
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
              University Email
            </label>
            <input
              type="email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              placeholder="e.g. siva.p@student.university.edu"
              className="form-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
              Full Name
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Siva Paoren"
              className="form-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
              Department
            </label>
            <input
              type="text"
              value={customDepartment}
              onChange={(e) => setCustomDepartment(e.target.value)}
              placeholder="e.g. Computer Science"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            <Lock size={16} /> Authenticate via Entra ID
          </button>
        </form>
      </div>
    </div>
  );
};
