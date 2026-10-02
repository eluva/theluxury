import { useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { Toaster } from './components/Toast';
import { tg } from './lib/telegram';
import { Cart } from './pages/Cart';
import { Catalog } from './pages/Catalog';
import { Favorites } from './pages/Favorites';
import { Home } from './pages/Home';
import { ProductPage } from './pages/ProductPage';
import { Success } from './pages/Success';
import { useShop } from './store/shop';

const ROOTS = ['/', '/catalog', '/favorites', '/cart'];

/** Shows Telegram's native Back button on nested screens. */
function useTelegramBackButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!tg) return;
    const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));
    if (ROOTS.includes(pathname)) {
      tg.BackButton.hide();
      return;
    }
    tg.BackButton.show();
    tg.BackButton.onClick(back);
    return () => tg!.BackButton.offClick(back);
  }, [pathname, navigate]);
}

export function App() {
  const { pathname } = useLocation();
  const lang = useShop((s) => s.lang);
  useTelegramBackButton();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (!pathname.startsWith('/product')) window.scrollTo(0, 0);
  }, [pathname]);

  const isProduct = pathname.startsWith('/product');

  return (
    <div className={`app${isProduct ? ' app--product' : ''}`}>
      {pathname !== '/' && !isProduct && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/success/:id" element={<Success />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!isProduct && !pathname.startsWith('/success') && <TabBar />}
      <Toaster />
    </div>
  );
}
