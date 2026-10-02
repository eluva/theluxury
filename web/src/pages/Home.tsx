import { Link } from 'react-router-dom';
import { IconArrow, IconClock, IconPin, IconSend } from '../components/Icons';
import { Img } from '../components/Img';
import { Logo } from '../components/Logo';
import { ProductCard } from '../components/ProductCard';
import { useCatalog } from '../lib/api';
import { useT } from '../lib/i18n';
import { openExternal, openTelegram } from '../lib/telegram';
import { useShop } from '../store/shop';
import type { Product } from '../types';
import { BRAND } from '../brand';

function Rail({ title, to, products }: { title: string; to: string; products: Product[] }) {
  const t = useT();
  if (!products.length) return null;
  return (
    <section className="section">
      <div className="section__head">
        <h2 className="h2">{title}</h2>
        <Link to={to} className="link-more">
          {t('seeAll')} <IconArrow width={16} height={16} />
        </Link>
      </div>
      <div className="rail">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export function Home() {
  const t = useT();
  const lang = useShop((s) => s.lang);
  const catalog = useCatalog();
  const products = catalog?.products ?? [];

  return (
    <div className="page page--home">
      <section className="hero">
        <Img src={BRAND.heroImage} alt="" width={1200} className="hero__bg" />
        <div className="hero__shade" />
        <div className="hero__top">
          <Logo />
        </div>
        <div className="hero__content">
          <p className="eyebrow">{t('tagline')}</p>
          <h1 className="hero__title">{t('heroTitle')}</h1>
          <p className="hero__text">{t('heroText')}</p>
          <Link to="/catalog" className="btn btn--gold">
            {t('shopNow')}
          </Link>
        </div>
      </section>

      <div className="perks">
        <span>{t('perks1')}</span>
        <i />
        <span>{t('perks2')}</span>
        <i />
        <span>{t('perks3')}</span>
      </div>

      <section className="section">
        <div className="section__head">
          <h2 className="h2">{t('categories')}</h2>
        </div>
        <div className="cats">
          {catalog?.categories.map((c) => {
            const n = products.filter((p) => p.category === c.id).length;
            return (
              <Link key={c.id} to={`/catalog?cat=${c.id}`} className="cat">
                <Img src={c.image} alt={c.name[lang]} width={500} />
                <div className="cat__shade" />
                <div className="cat__label">
                  <span>{c.name[lang]}</span>
                  <small>
                    {n} {t('models')}
                  </small>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <Rail title={t('newArrivals')} to="/catalog?sort=new" products={products.filter((p) => p.isNew)} />

      <section className="banner">
        <Img src={BRAND.bannerImage} alt="" width={1000} className="banner__bg" />
        <div className="banner__shade" />
        <div className="banner__content">
          <p className="eyebrow">Premium collection</p>
          <h2 className="banner__title">
            Premium
            <br />
            <em>leather</em>
          </h2>
          <Link to="/catalog?col=premium" className="btn btn--light">
            {t('shopNow')}
          </Link>
        </div>
      </section>

      <Rail title={t('premium')} to="/catalog?col=premium" products={products.filter((p) => p.collection === 'premium')} />
      <Rail title={t('sale')} to="/catalog?sale=1" products={products.filter((p) => p.oldPrice)} />

      <section className="section boutique">
        <p className="eyebrow">{t('about')}</p>
        <h2 className="h2">LUXURY Uzbekistan</h2>
        <ul className="boutique__list">
          <li>
            <IconPin />
            <span>{t('address1')}</span>
          </li>
          <li>
            <IconClock />
            <span>{t('hours')}</span>
          </li>
        </ul>
        <div className="boutique__actions">
          <button className="btn btn--gold" onClick={() => openTelegram(BRAND.telegram)}>
            <IconSend width={18} height={18} /> {t('writeUs')}
          </button>
          <button className="btn btn--outline" onClick={() => openExternal(BRAND.mapUrl)}>
            {t('onMap')}
          </button>
        </div>
        <a className="boutique__ig" href={BRAND.instagram} target="_blank" rel="noreferrer">
          @theluxuryuzbekistan
        </a>
      </section>
    </div>
  );
}
