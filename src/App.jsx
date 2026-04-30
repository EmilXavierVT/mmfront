import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { getStoredUser, logout } from './api/client.js';
import { productApi } from './api/products.js';
import { AuthModal } from './components/AuthModal.jsx';
import { About } from './components/About.jsx';
import { Admin } from './components/Admin.jsx';
import { BigCTA } from './components/BigCTA.jsx';
import { Booking } from './components/Booking.jsx';
import { Catering } from './components/Catering.jsx';
import { Cleaning } from './components/Cleaning.jsx';
import { FAQ } from './components/FAQ.jsx';
import { Footer } from './components/Footer.jsx';
import { Hero } from './components/Hero.jsx';
import { Menu } from './components/Menu.jsx';
import { Profile } from './components/Profile.jsx';
import { SplitService } from './components/SplitService.jsx';
import { Steps } from './components/Steps.jsx';
import { Testimonials } from './components/Testimonials.jsx';
import { Topbar } from './components/Topbar.jsx';
import { Trust } from './components/Trust.jsx';
import { TweaksUI } from './components/TweaksUI.jsx';
import { CLEANING_PRODUCT_TYPE, normalizeProduct } from './lib/products.js';
import { TWEAK_DEFAULTS } from './lib/tweaks.js';
import { useTweaks } from './use-tweaks.js';

export default function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [active, setActive] = useState('home');
  const [cart, setCart] = useState({});
  const [toast, setToast] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authInitialEmail, setAuthInitialEmail] = useState('');
  const [authInitialMode, setAuthInitialMode] = useState('login');
  const [user, setUser] = useState(() => getStoredUser());
  const cateringProducts = useMemo(
    () => products.filter((product) => Number(product.type) !== CLEANING_PRODUCT_TYPE),
    [products],
  );
  const cleaningProducts = useMemo(
    () => products.filter((product) => Number(product.type) === CLEANING_PRODUCT_TYPE),
    [products],
  );
  const isAdmin = user?.role === 'ADMIN';

  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError('');
    try {
      const data = await productApi.getAll();
      setProducts((Array.isArray(data) ? data : []).map(normalizeProduct));
    } catch (err) {
      setProductsError(err.message || 'Could not load products.');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function loadInitialProducts() {
      try {
        const data = await productApi.getAll();
        if (!ignore) {
          setProducts((Array.isArray(data) ? data : []).map(normalizeProduct));
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

    loadInitialProducts();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--pink', tweaks.accentPink);
    document.documentElement.style.setProperty('--blue', tweaks.accentBlue);
    document.documentElement.style.setProperty('--pink-soft', tweaks.accentPink + '8c');
  }, [tweaks.accentPink, tweaks.accentBlue]);

  const addToCart = (d) => {
    setCart(c => ({...c, [d.id]: (c[d.id]||0) + 1}));
    setToast(`${d.name} added`);
    setTimeout(()=>setToast(null), 1800);
  };
  const clearCart = () => setCart({});

  const navigateTo = (page) => {
    setActive(page);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    navigateTo('home');
    setToast('Logged out');
    setTimeout(()=>setToast(null), 1800);
  };

  const openAuth = (initialEmail = '', initialMode = 'login') => {
    setAuthInitialEmail(initialEmail);
    setAuthInitialMode(initialMode);
    setAuthOpen(true);
  };

  const scrollToBook = (page = 'home') => {
    setActive(page);
    window.setTimeout(() => {
      const nextEl = document.getElementById('book');
      if (nextEl) window.scrollTo({ top: nextEl.offsetTop - 80, behavior: 'smooth' });
    }, 0);
  };

  return (
    <>
      <Topbar
        active={active}
        onNav={navigateTo}
        user={user}
        isAdmin={isAdmin}
        onAccount={() => openAuth()}
      />
      {active === 'admin' && isAdmin ? (
        <div className="page">
          <Admin
            user={user}
            products={products}
            productsLoading={productsLoading}
            productsError={productsError}
            onLogout={handleLogout}
            onProductsChanged={loadProducts}
          />
        </div>
      ) : active === 'profile' && user ? (
        <div className="page">
          <Profile user={user} onBook={scrollToBook} onLogout={handleLogout} />
        </div>
      ) : active === 'about' ? (
        <div className="page">
          <About onBook={scrollToBook} />
        </div>
      ) : active === 'catering' ? (
        <div className="page">
          <Catering
            cart={cart}
            dishes={cateringProducts}
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
        </div>
      ) : active === 'cleaning' ? (
        <div className="page">
          <Cleaning
            products={cleaningProducts}
            loading={productsLoading}
            error={productsError}
            user={user}
            onRetry={loadProducts}
            onClearCart={clearCart}
            onBook={() => scrollToBook('cleaning')}
            onRequireAuth={(email) => openAuth(email)}
          />
        </div>
      ) : (
        <div className="page">
          <Hero tweaks={tweaks} onBook={(service)=>scrollToBook(service === 'cleaning' ? 'cleaning' : service === 'catering' ? 'catering' : 'home')} />
          {tweaks.showTrust && <Trust/>}
          <SplitService onBook={(service)=>scrollToBook(service === 'cleaning' ? 'cleaning' : 'catering')}/>
          <Steps/>
          <Menu
            cart={cart}
            products={cateringProducts}
            loading={productsLoading}
            error={productsError}
            onAdd={addToCart}
            onRetry={loadProducts}
          />
          <Booking
            cart={cart}
            dishes={cateringProducts}
            user={user}
            onClearCart={clearCart}
            onRequireAuth={(email) => openAuth(email)}
          />
          <Testimonials/>
          <FAQ/>
          <BigCTA onBook={()=>scrollToBook()}/>
        </div>
      )}
      <Footer onNav={navigateTo}/>
      <TweaksUI tweaks={tweaks} setTweak={setTweak}/>
      {authOpen && (
        <AuthModal
          initialEmail={authInitialEmail}
          initialMode={authInitialMode}
          onClose={() => setAuthOpen(false)}
          onAuthenticated={(nextUser) => {
            setUser(nextUser);
            setActive(nextUser?.role === 'ADMIN' ? 'admin' : 'profile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setToast('Logged in');
            setTimeout(()=>setToast(null), 1800);
          }}
        />
      )}
      <div className={`toast ${toast?'show':''}`}>{toast}</div>
    </>
  );
}
