import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { getStoredUser, logout, setStoredUser } from './api/client.js';
import { productApi } from './api/products.js';
import { AuthModal } from './components/Auth/AuthModal.jsx';
import { Employee } from './components/Employee/Employee.jsx';
import { About } from './components/Marketing/About.jsx';
import { Admin } from './components/Admin/Admin.jsx';
import { BigCTA } from './components/Marketing/BigCTA.jsx';
import { Booking } from './components/Booking/Booking.jsx';
import { Catering } from './components/Services/Catering.jsx';
import { Cleaning } from './components/Services/Cleaning.jsx';
import { FAQ } from './components/Marketing/FAQ.jsx';
import { Footer } from './components/Layout/Footer.jsx';
import { Hero } from './components/Marketing/Hero.jsx';
import { Menu } from './components/Services/Menu.jsx';
import { Profile } from './components/Profile/Profile.jsx';
import { SEO } from './components/Layout/SEO.jsx';
import { SplitService } from './components/Services/SplitService.jsx';
import { Steps } from './components/Marketing/Steps.jsx';
import { Testimonials } from './components/Marketing/Testimonials.jsx';
import { Topbar } from './components/Layout/Topbar.jsx';
import { Trust } from './components/Marketing/Trust.jsx';
import { TweaksUI } from './components/TweaksUI/TweaksUI.jsx';
import { CLEANING_PRODUCT_TYPE, normalizeProduct } from './lib/products.js';
import { TWEAK_DEFAULTS } from './lib/tweaks.js';
import { useTweaks } from './use-tweaks.js';

const ROUTES = {
  '/': 'home',
  '/catering': 'catering',
  '/cleaning': 'cleaning',
  '/about': 'about',
  '/profile': 'profile',
  '/employee': 'employee',
  '/admin': 'admin',
};

const PAGE_PATHS = {
  home: '/',
  catering: '/catering',
  cleaning: '/cleaning',
  about: '/about',
  profile: '/profile',
  employee: '/employee',
  admin: '/admin',
};

function isEmployeeRole(role) {
  return role === 'EMPLOYEE' || role === 'CLEANING_STAFF';
}

function getUserRoles(user) {
  const values = Array.isArray(user?.roles) && user.roles.length
    ? user.roles
    : user?.role
      ? [user.role]
      : [];

  return values
    .flatMap(value => String(value || '').split(','))
    .map(value => value.trim().replace(/^ROLE_/i, '').toUpperCase())
    .filter(Boolean);
}

function hasUserRole(user, expectedRole) {
  return getUserRoles(user).includes(expectedRole);
}

function getUserHomePage(user) {
  if (hasUserRole(user, 'ADMIN')) return 'admin';
  if (getUserRoles(user).some(isEmployeeRole)) return 'employee';
  return 'profile';
}

function Page({ children }) {
  return <div className="page">{children}</div>;
}

function AdminPage({
  isAdmin,
  user,
  products,
  productsLoading,
  productsError,
  onLogout,
  onProductsChanged,
}) {
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Page>
      <Admin
        user={user}
        products={products}
        productsLoading={productsLoading}
        productsError={productsError}
        onLogout={onLogout}
        onProductsChanged={onProductsChanged}
      />
    </Page>
  );
}

function ProfilePage({ user, onBook, onLogout, onUserUpdated }) {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Page>
      <Profile user={user} onBook={onBook} onLogout={onLogout} onUserUpdated={onUserUpdated} />
    </Page>
  );
}

function EmployeePage({ user, onLogout, onUserUpdated }) {
  if (!user || !getUserRoles(user).some(isEmployeeRole)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Page>
      <Employee user={user} onLogout={onLogout} onUserUpdated={onUserUpdated} />
    </Page>
  );
}

function AboutPage({ onBook }) {
  return (
    <Page>
      <About onBook={onBook} />
    </Page>
  );
}

function CateringPage({
  cart,
  products,
  loading,
  error,
  user,
  onAdd,
  onRetry,
  onClearCart,
  onBook,
  onRequireAuth,
}) {
  return (
    <Page>
      <Catering
        cart={cart}
        dishes={products}
        products={products}
        loading={loading}
        error={error}
        user={user}
        onAdd={onAdd}
        onRetry={onRetry}
        onClearCart={onClearCart}
        onBook={onBook}
        onRequireAuth={onRequireAuth}
      />
    </Page>
  );
}

function CleaningPage({
  products,
  loading,
  error,
  user,
  onRetry,
  onClearCart,
  onBook,
  onRequireAuth,
}) {
  return (
    <Page>
      <Cleaning
        products={products}
        loading={loading}
        error={error}
        user={user}
        onRetry={onRetry}
        onClearCart={onClearCart}
        onBook={onBook}
        onRequireAuth={onRequireAuth}
      />
    </Page>
  );
}

function HomePage({
  tweaks,
  cart,
  products,
  loading,
  error,
  user,
  onAdd,
  onRetry,
  onClearCart,
  onBook,
  onRequireAuth,
}) {
  return (
    <Page>
      <Hero tweaks={tweaks} onBook={onBook} />
      {tweaks.showTrust && <Trust />}
      <SplitService onBook={onBook} />
      <Steps />
      <Menu
        cart={cart}
        products={products}
        loading={loading}
        error={error}
        onAdd={onAdd}
        onRetry={onRetry}
      />
      <Booking
        cart={cart}
        dishes={products}
        user={user}
        onClearCart={onClearCart}
        onRequireAuth={onRequireAuth}
      />
      <Testimonials />
      <FAQ />
      <BigCTA onBook={() => onBook()} />
    </Page>
  );
}

function getPageFromPath(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  return ROUTES[normalizedPath] || 'home';
}

function normalizeProductsResponse(data) {
  return (Array.isArray(data) ? data : []).map(normalizeProduct);
}

export default function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const location = useLocation();
  const routerNavigate = useNavigate();
  const active = getPageFromPath(location.pathname);
  const [cart, setCart] = useState({});
  const [toast, setToast] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authInitialEmail, setAuthInitialEmail] = useState('');
  const [authInitialMode, setAuthInitialMode] = useState('login');
  const [user, setUser] = useState(() => getStoredUser());
  const toastTimeoutRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const cateringProducts = useMemo(
    () => products.filter((product) => Number(product.type) !== CLEANING_PRODUCT_TYPE),
    [products],
  );
  const cleaningProducts = useMemo(
    () => products.filter((product) => Number(product.type) === CLEANING_PRODUCT_TYPE),
    [products],
  );
  const isAdmin = hasUserRole(user, 'ADMIN');
  const accountPage = getUserHomePage(user);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError('');
    try {
      const data = await productApi.getAll();
      setProducts(normalizeProductsResponse(data));
    } catch (err) {
      setProductsError(err.message || 'Could not load products.');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function initializeProducts() {
      setProductsLoading(true);
      setProductsError('');
      try {
        const data = await productApi.getAll();
        if (!ignore) {
          setProducts(normalizeProductsResponse(data));
        }
      } catch (err) {
        if (!ignore) {
          setProductsError(err.message || 'Could not load products.');
        }
      } finally {
        if (!ignore) {
          setProductsLoading(false);
        }
      }
    }

    initializeProducts();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--pink', tweaks.accentPink);
    document.documentElement.style.setProperty('--blue', tweaks.accentBlue);
    document.documentElement.style.setProperty('--pink-soft', tweaks.accentPink + '8c');
  }, [tweaks.accentPink, tweaks.accentBlue]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 1800);
  }, []);

  const addToCart = (d) => {
    setCart((c) => ({ ...c, [d.id]: (c[d.id] || 0) + 1 }));
    showToast(`${d.name} added`);
  };
  const clearCart = () => setCart({});

  const navigateTo = (page, { replace = false } = {}) => {
    const path = PAGE_PATHS[page] || PAGE_PATHS.home;

    if (location.pathname !== path) {
      routerNavigate(path, { replace });
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    navigateTo('home');
    showToast('Logged out');
  };

  const openAuth = (initialEmail = '', initialMode = 'login') => {
    setAuthInitialEmail(initialEmail);
    setAuthInitialMode(initialMode);
    setAuthOpen(true);
  };

  const handleUserUpdated = useCallback((nextUser) => {
    setUser(nextUser);
    setStoredUser(nextUser);
  }, []);

  const scrollToBook = (page = 'home') => {
    const path = PAGE_PATHS[page] || PAGE_PATHS.home;

    if (location.pathname !== path) {
      routerNavigate(path);
    }

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      const nextEl = document.getElementById('book');
      if (nextEl) window.scrollTo({ top: nextEl.offsetTop - 80, behavior: 'smooth' });
      scrollTimeoutRef.current = null;
    }, 0);
  };

  return (
    <>
      <SEO active={active} />
      <Topbar
        user={user}
        isAdmin={isAdmin}
        accountPath={PAGE_PATHS[accountPage] || PAGE_PATHS.profile}
        onAccount={() => openAuth()}
      />
      <Routes>
        <Route
          path="/admin"
          element={(
            <AdminPage
              isAdmin={isAdmin}
              user={user}
              products={products}
              productsLoading={productsLoading}
              productsError={productsError}
              onLogout={handleLogout}
              onProductsChanged={loadProducts}
            />
          )}
        />
        <Route
          path="/profile"
          element={<ProfilePage user={user} onBook={scrollToBook} onLogout={handleLogout} onUserUpdated={handleUserUpdated} />}
        />
        <Route
          path="/employee"
          element={<EmployeePage user={user} onLogout={handleLogout} onUserUpdated={handleUserUpdated} />}
        />
        <Route
          path="/about"
          element={<AboutPage onBook={scrollToBook} />}
        />
        <Route
          path="/catering"
          element={(
            <CateringPage
              cart={cart}
              products={cateringProducts}
              loading={productsLoading}
              error={productsError}
              user={user}
              onAdd={addToCart}
              onRetry={loadProducts}
              onClearCart={clearCart}
              onBook={() => scrollToBook('catering')}
              onRequireAuth={(email) => openAuth(email)}
            />
          )}
        />
        <Route
          path="/cleaning"
          element={(
            <CleaningPage
              products={cleaningProducts}
              loading={productsLoading}
              error={productsError}
              user={user}
              onRetry={loadProducts}
              onClearCart={clearCart}
              onBook={() => scrollToBook('cleaning')}
              onRequireAuth={(email) => openAuth(email)}
            />
          )}
        />
        <Route
          path="/"
          element={(
            <HomePage
              tweaks={tweaks}
              cart={cart}
              products={cateringProducts}
              loading={productsLoading}
              error={productsError}
              user={user}
              onAdd={addToCart}
              onRetry={loadProducts}
              onClearCart={clearCart}
              onBook={(service) =>
                scrollToBook(
                  service === 'cleaning'
                    ? 'cleaning'
                    : service === 'catering'
                      ? 'catering'
                      : 'home',
                )
              }
              onRequireAuth={(email) => openAuth(email)}
            />
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer onNav={navigateTo} />
      <TweaksUI tweaks={tweaks} setTweak={setTweak} />
      {authOpen && (
        <AuthModal
          initialEmail={authInitialEmail}
          initialMode={authInitialMode}
          onClose={() => setAuthOpen(false)}
          onAuthenticated={(nextUser) => {
            setUser(nextUser);
            navigateTo(getUserHomePage(nextUser));
            window.scrollTo({ top: 0, behavior: 'smooth' });
            showToast('Logged in');
          }}
        />
      )}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  );
}
