import React, { useState } from 'react';
import { ArrowRight, LockKeyhole, UserRound, X } from 'lucide-react';
import { isEntraConfigured } from '../auth/msal';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onClose, onSuccess }) => {
  const { loginWithMicrosoft, loginWithMockProfile, switchDevRole, loading } = useAuth();
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [customDepartment, setCustomDepartment] = useState<string>('Computer Science');

  const finishLogin = () => {
    onSuccess?.();
    onClose?.();
  };

  const handleMicrosoftSso = async () => {
    await loginWithMicrosoft();
    finishLogin();
  };

  const handleDevIdentityLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loginWithMockProfile({
      email: customEmail || 'khine.k@student.university.edu',
      name: customName || 'Khine Khant',
      department: customDepartment,
      microsoftId: `ms-student-${Date.now()}`,
    });
    finishLogin();
  };

  const handleQuickRole = async (role: 'Admin' | 'Staff' | 'Student') => {
    await switchDevRole(role);
    finishLogin();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card animate-fade-in login-dialog"
        style={{ width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}
        onClick={(event) => event.stopPropagation()}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="icon-button"
            aria-label="Close sign-in dialog"
            style={{ position: 'absolute', top: '16px', right: '16px' }}
          >
            <X size={16} />
          </button>
        )}

        <div style={{ marginBottom: '24px', paddingRight: '44px' }}>
          <div className="brand-mark" style={{ marginBottom: '14px' }}><LockKeyhole size={17} /></div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.025em' }}>Sign in to Campus Store</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '5px' }}>
            Use your university identity to access orders and student pricing.
          </p>
        </div>

        {isEntraConfigured ? (
          <button onClick={handleMicrosoftSso} disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
            <svg width="16" height="16" viewBox="0 0 23 23" aria-hidden="true">
              <path fill="#f25022" d="M0 0h11v11H0z" />
              <path fill="#7fba00" d="M12 0h11v11H12z" />
              <path fill="#00a4ef" d="M0 12h11v11H0z" />
              <path fill="#ffb900" d="M12 12h11v11H12z" />
            </svg>
            Continue with Microsoft
          </button>
        ) : (
          <div className="badge badge-amber" style={{ width: '100%', justifyContent: 'center', padding: '8px 10px' }}>
            Development sign-in is active
          </div>
        )}

        {!isEntraConfigured && (
          <>
            <div style={{ margin: '22px 0 10px' }} className="menu-label">Demo accounts</div>
            <div className="flex flex-col gap-2">
              {([
                ['Student', 'Browse and place orders'],
                ['Staff', 'Manage products and orders'],
                ['Admin', 'Full store administration'],
              ] as const).map(([role, description]) => (
                <button
                  key={role}
                  onClick={() => handleQuickRole(role)}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'space-between', textAlign: 'left' }}
                >
                  <span className="flex items-center gap-2">
                    <UserRound size={15} />
                    <span>
                      <span style={{ display: 'block', fontWeight: 600 }}>{role}</span>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>{description}</span>
                    </span>
                  </span>
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '22px 0' }}>
              <span style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
              <span className="menu-label">Custom profile</span>
              <span style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
            </div>

            <form onSubmit={handleDevIdentityLogin} className="flex flex-col gap-3">
              <label style={{ fontSize: '13px', fontWeight: 500 }}>
                Email
                <input
                  type="email"
                  value={customEmail}
                  onChange={(event) => setCustomEmail(event.target.value)}
                  placeholder="student@university.edu"
                  className="form-input"
                  style={{ marginTop: '5px' }}
                />
              </label>
              <label style={{ fontSize: '13px', fontWeight: 500 }}>
                Full name
                <input
                  type="text"
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder="Student name"
                  className="form-input"
                  style={{ marginTop: '5px' }}
                />
              </label>
              <label style={{ fontSize: '13px', fontWeight: 500 }}>
                Department
                <input
                  type="text"
                  value={customDepartment}
                  onChange={(event) => setCustomDepartment(event.target.value)}
                  className="form-input"
                  style={{ marginTop: '5px' }}
                />
              </label>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '4px' }}>
                Continue
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
