import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconBack, IconHeart } from '../components/Icons';
import { Img } from '../components/Img';
import { ProductCard } from '../components/ProductCard';
import { toast } from '../components/Toast';
import { useCatalog } from '../lib/api';
import { formatPrice } from '../lib/format';
import { useT } from '../lib/i18n';
import { haptic, isTelegram } from '../lib/telegram';
import { useShop } from '../store/shop';

export function ProductPage() {
  const { id } = useParams();
  const t = useT();
  const navigate = useNavigate();
  const catalog = useCatalog();
  const lang = useShop((s) => s.lang);
  const addToCart = useShop((s) => s.addToCart);
  const isFav = useShop((s) => s.favorites.includes(id ?? ''));
  const toggleFavorite = useShop((s) => s.toggleFavorite);
  const inCart = useShop((s) => s.cart.some((i) => i.productId === id));

  const [size, setSize] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [shake, setShake] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSize(null);
    setSlide(0);
    galleryRef.current?.scrollTo({ left: 0 });
    window.scrollTo(0, 0);
  }, [id]);

  if (!catalog) return <div className="page"><div className="skeleton-hero" /></div>;
  const product = catalog.products.find((p) => p.id === id);
  if (!product) return <div className="page"><p className="empty__text">{t('nothingFound')}</p></div>;

  const category = catalog.categories.find((c) => c.id === product.category);
  const selected = product.sizes.find((s) => s.size === size);
  const inStock = product.sizes.some((s) => s.qty > 0);
  const similar = catalog.products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 8);

  const onAdd = () => {
    if (inCart && !size) return navigate('/cart');
    if (!size) {
      haptic.error();
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    haptic.success();
    addToCart(product.id, size);
    toast(t('added'));
  };

  return (
    <div className="page page--product">
      <div className="gallery">
        <div
          className="gallery__track"
          ref={galleryRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setSlide(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {product.images.map((src, i) => (
            <Img key={i} src={src} alt={product.name} width={900} className="gallery__img" />
          ))}
        </div>
        {product.images.length > 1 && (
          <div className="dots">
            {product.images.map((_, i) => (
              <i key={i} className={i === slide ? 'is-active' : ''} />
            ))}
          </div>
        )}
        {!isTelegram && (
          <button className="back-btn" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} aria-label="back">
            <IconBack />
          </button>
        )}
        <button
          className={`fav fav--lg${isFav ? ' is-active' : ''}`}
          onClick={() => {
            haptic.tap();
            toggleFavorite(product.id);
          }}
          aria-label={t('favorites')}
        >
          <IconHeart filled={isFav} />
        </button>
      </div>

      <div className="pdp">
        <p className="eyebrow">
          {category?.name[lang]}
          {product.collection && ` · ${product.collection}`}
        </p>
        <h1 className="pdp__title">{product.name}</h1>
        <div className="pdp__price">
          <span>{formatPrice(product.price, lang)}</span>
          {product.oldPrice && <s>{formatPrice(product.oldPrice, lang)}</s>}
        </div>

        <div className={`sizes${shake ? ' is-shake' : ''}`}>
          <div className="sizes__head">
            <span>{size ? `${t('size')}: ${size}` : t('chooseSize')}</span>
            {selected?.qty === 1 && <span className="gold">{t('lastPair')}</span>}
          </div>
          <div className="sizes__grid">
            {product.sizes.map((s) => (
              <button
                key={s.size}
                disabled={s.qty === 0}
                className={`size${size === s.size ? ' is-active' : ''}`}
                onClick={() => {
                  haptic.select();
                  setSize(s.size);
                }}
              >
                {s.size}
              </button>
            ))}
          </div>
        </div>

        <dl className="specs">
          {product.color && (
            <>
              <dt>{t('color')}</dt>
              <dd>{product.color}</dd>
            </>
          )}
          {product.material && (
            <>
              <dt>{t('material')}</dt>
              <dd>{product.material}</dd>
            </>
          )}
          {product.sku && (
            <>
              <dt>{t('article')}</dt>
              <dd>{product.sku}</dd>
            </>
          )}
        </dl>

        {product.description && (
          <div className="pdp__desc">
            <h3 className="h3">{t('description')}</h3>
            <p>{product.description}</p>
          </div>
        )}
      </div>

      {similar.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2 className="h2">{category?.name[lang]}</h2>
          </div>
          <div className="rail">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <div className="sticky-cta">
        <button className="btn btn--gold btn--block" disabled={!inStock} onClick={onAdd}>
          {!inStock ? t('outOfStock') : inCart && !size ? t('inCart') : `${t('addToCart')} · ${formatPrice(product.price, lang)}`}
        </button>
      </div>
    </div>
  );
}
