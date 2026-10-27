import { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  LogOut,
  User as UserIcon,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'login' | 'signup' | 'dashboard'
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [authLoading, setAuthLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Items and connection states for Dashboard
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [itemError, setItemError] = useState('');
  const [status, setStatus] = useState('Checking connection...');
  const [isConnected, setIsConnected] = useState(false);

  // 1. Auto-login with token on mount / refresh
  const loadMe = useCallback(async (jwtToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData.user || userData);
        setCurrentPage('dashboard');
      } else {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setCurrentPage('home');
      }
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setCurrentPage('home');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadMe(token);
    } else {
      setAuthLoading(false);
    }
  }, [token, loadMe]);

  // 2. Check server and DB status
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/hello`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.database === 'connected' || data.status === 'Connected to server + MongoDB') {
        setStatus('Connected to server + MongoDB');
        setIsConnected(true);
      } else {
        setStatus('Connected to server (MongoDB disconnected)');
        setIsConnected(false);
      }
    } catch {
      setStatus('Cannot reach backend server');
      setIsConnected(false);
    }
  }, []);

  // 3. Fetch items for dashboard
  const fetchItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/items`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      setItemError('');
    } catch (err) {
      setItemError(err.message);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentPage === 'dashboard') {
      checkStatus();
      fetchItems();
    }
  }, [currentPage, checkStatus, fetchItems]);

  // 4. Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setFormError('');
    setCurrentPage('home');
  };

  // 5. Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Signup failed (${res.status})`);
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setName('');
      setEmail('');
      setPassword('');
      setCurrentPage('dashboard');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim() || !password) {
      setFormError('Please enter both email and password');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setEmail('');
      setPassword('');
      setCurrentPage('dashboard');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 7. Handle Add Item
  const handleAddItem = async (e) => {
    e.preventDefault();
    const trimmed = itemName.trim();
    if (!trimmed) return;

    setItemSubmitting(true);
    setItemError('');
    try {
      const res = await fetch(`${API_BASE}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const newItem = await res.json();
      setItems((prev) => [newItem, ...prev]);
      setItemName('');
    } catch (err) {
      setItemError(`Failed to add item: ${err.message}`);
    } finally {
      setItemSubmitting(false);
    }
  };

  // 8. Handle Delete Item
  const handleDeleteItem = async (id) => {
    setDeletingId(id);
    setItemError('');
    try {
      const res = await fetch(`${API_BASE}/api/items/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setItemError(`Failed to delete item: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        <Loader2 size={36} className="spin text-primary" />
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Navbar */}
      <header className="navbar">
        <div className="nav-container">
          <div
            className="brand-logo"
            onClick={() => setCurrentPage(user ? 'dashboard' : 'home')}
            style={{ cursor: 'pointer' }}
          >
            <Database className="brand-icon" size={24} />
            <span className="brand-title">CA-03 Project</span>
          </div>

          <nav className="nav-actions">
            {user ? (
              <div className="user-nav">
                <span className="user-nav-name">
                  <UserIcon size={16} /> {user.name}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  title="Logout"
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="guest-nav">
                <button
                  type="button"
                  onClick={() => {
                    setFormError('');
                    setCurrentPage('login');
                  }}
                  className={`btn ${currentPage === 'login' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormError('');
                    setCurrentPage('signup');
                  }}
                  className={`btn ${currentPage === 'signup' ? 'btn-secondary' : 'btn-primary'}`}
                >
                  Create Account
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Areas */}
      <main className="content-container">
        {/* 1. HOME PAGE */}
        {currentPage === 'home' && (
          <section className="hero-section">
            <div className="hero-badge">
              <Sparkles size={16} /> MERN Full-Stack Authentication
            </div>
            <h1 className="hero-title">
              Secure, Simple & Seamless <br />
              <span className="hero-gradient">Account Management</span>
            </h1>
            <p className="hero-subtitle">
              Connected with Express, Mongoose, and MongoDB. Create an account, log in securely with
              JWT, and manage your stored items in real time.
            </p>
            <div className="hero-cta">
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  setCurrentPage('signup');
                }}
                className="btn btn-primary btn-lg"
              >
                <span>Create Account</span>
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  setCurrentPage('login');
                }}
                className="btn btn-secondary btn-lg"
              >
                <span>Login</span>
              </button>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <ShieldCheck className="feature-icon" size={24} />
                <h3>Bcrypt Security</h3>
                <p>Passwords are securely hashed before storing in the database.</p>
              </div>
              <div className="feature-card">
                <Database className="feature-icon" size={24} />
                <h3>MongoDB ca03</h3>
                <p>Data persisted directly into your local MongoDB community instance.</p>
              </div>
              <div className="feature-card">
                <Sparkles className="feature-icon" size={24} />
                <h3>JWT Sessions</h3>
                <p>Instant auto-login using Bearer tokens verified via /api/auth/me.</p>
              </div>
            </div>
          </section>
        )}

        {/* 2. CREATE ACCOUNT PAGE */}
        {currentPage === 'signup' && (
          <div className="auth-card">
            <div className="auth-header">
              <h2>Create Account</h2>
              <p>Sign up to access your personal items dashboard</p>
            </div>

            {formError && (
              <div className="error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="auth-form">
              <div className="form-group">
                <label htmlFor="signup-name">Full Name</label>
                <div className="input-wrap">
                  <UserIcon size={18} className="field-icon" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-email">Email Address</label>
                <div className="input-wrap">
                  <Mail size={18} className="field-icon" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <div className="input-wrap">
                  <Lock size={18} className="field-icon" />
                  <input
                    id="signup-password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <small className="field-hint">Must be at least 6 characters</small>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? <Loader2 size={18} className="spin" /> : null}
                <span>{submitting ? 'Creating account...' : 'Create Account'}</span>
              </button>
            </form>

            <div className="auth-footer">
              Already have an account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setFormError('');
                  setCurrentPage('login');
                }}
              >
                Log In
              </button>
            </div>
          </div>
        )}

        {/* 3. LOGIN PAGE */}
        {currentPage === 'login' && (
          <div className="auth-card">
            <div className="auth-header">
              <h2>Welcome Back</h2>
              <p>Log in with your email and password</p>
            </div>

            {formError && (
              <div className="error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="login-email">Email Address</label>
                <div className="input-wrap">
                  <Mail size={18} className="field-icon" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <div className="input-wrap">
                  <Lock size={18} className="field-icon" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? <Loader2 size={18} className="spin" /> : null}
                <span>{submitting ? 'Logging in...' : 'Log In'}</span>
              </button>
            </form>

            <div className="auth-footer">
              Don't have an account yet?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setFormError('');
                  setCurrentPage('signup');
                }}
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* 4. DASHBOARD PAGE */}
        {currentPage === 'dashboard' && user && (
          <div className="dashboard-container">
            {/* User welcome bar */}
            <div className="dashboard-header-card">
              <div className="user-info-area">
                <div className="avatar-circle">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h2 className="welcome-name">Hello, {user.name}!</h2>
                  <p className="welcome-email">{user.email}</p>
                </div>
              </div>

              <div className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? (
                  <CheckCircle2 size={16} className="status-icon" />
                ) : (
                  <AlertCircle size={16} className="status-icon" />
                )}
                <span className="status-text">{status}</span>
                <button
                  type="button"
                  className="refresh-btn"
                  onClick={() => {
                    checkStatus();
                    fetchItems();
                  }}
                  title="Refresh status & items"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Items Management */}
            <div className="items-card">
              <div className="card-top-title">
                <h3>Items Management</h3>
                <span className="items-badge">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <form onSubmit={handleAddItem} className="add-form">
                <input
                  type="text"
                  className="item-input"
                  placeholder="Enter item name (e.g. Textbook, Calculator)..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  disabled={itemSubmitting}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={itemSubmitting || !itemName.trim()}
                >
                  {itemSubmitting ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                  <span>Add Item</span>
                </button>
              </form>

              {itemError && (
                <div className="error-banner">
                  <AlertCircle size={16} />
                  <span>{itemError}</span>
                </div>
              )}

              <div className="items-list-area">
                {itemsLoading ? (
                  <div className="state-message">
                    <Loader2 size={24} className="spin text-primary" />
                    <span>Loading items from database...</span>
                  </div>
                ) : items.length === 0 ? (
                  <div className="state-message">
                    <p>No items found in database.</p>
                    <small>Add your first item using the field above.</small>
                  </div>
                ) : (
                  <ul className="items-list">
                    {items.map((item) => (
                      <li key={item._id} className="item-row">
                        <span className="item-name">{item.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item._id)}
                          className="btn-delete"
                          disabled={deletingId === item._id}
                          title="Delete item"
                        >
                          {deletingId === item._id ? (
                            <Loader2 size={15} className="spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                          <span>Delete</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
