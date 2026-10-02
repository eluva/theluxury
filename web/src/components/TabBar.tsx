import { NavLink } from 'react-router-dom';
import { useT } from '../lib/i18n';
import { haptic } from '../lib/telegram';
import { cartCount, useShop } from '../store/shop';
import { IconBag, IconGrid, IconHeart, IconHome } from './Icons';

export function TabBar() {
  const t = useT();
  const count = useShop((s) => cartCount(s.cart));
  const favs = useShop((s) => s.favorites.length);

  const tabs = [
    { to: '/', label: t('home'), icon: <IconHome />, end: true },
    { to: '/catalog', label: t('catalog'), icon: <IconGrid /> },
    { to: '/favorites', label: t('favorites'), icon: <IconHeart />, badge: favs },
    { to: '/cart', label: t('cart'), icon: <IconBag />, badge: count },
  ];

  return (
    <nav className="tabbar">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className="tabbar__item" onClick={haptic.select}>
          <span className="tabbar__icon">
            {tab.icon}
            {!!tab.badge && <span className="badge">{tab.badge}</span>}
          </span>
          <span className="tabbar__label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
