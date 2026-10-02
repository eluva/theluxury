import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/format';
import { useT } from '../lib/i18n';
import { haptic } from '../lib/telegram';
import { useShop } from '../store/shop';
import type { Product } from '../types';
import { IconHeart } from './Icons';
import { Img } from './Img';

export function ProductCard({ product }: { product: Product }) {
  const t = useT();
  const lang = useShop((s) => s.lang);
  const isFav = useShop((s) => s.favorites.includes(product.id));
  const toggleFavorite = useShop((s) => s.toggleFavorite);
  const inStock = product.sizes.some((s) => s.qty > 0);
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  return (
    <Link to={`/product/${product.id}`} className={`card${inStock ? '' : ' is-out'}`}>
      <div className="card__media">
        <Img src={product.images[0]} alt={product.name} width={400} />
        <div className="card__tags">
          {product.isNew && <span className="tag">{t('new')}</span>}
          {discount > 0 && <span className="tag tag--gold">−{discount}%</span>}
        </div>
        <button
          className={`fav${isFav ? ' is-active' : ''}`}
          aria-label={t('favorites')}
          onClick={(e) => {
            e.preventDefault();
            haptic.tap();
            toggleFavorite(product.id);
          }}
        >
          <IconHeart filled={isFav} width={18} height={18} />
        </button>
      </div>
      <div className="card__body">
        {product.collection && <div className="card__collection">{product.collection}</div>}
        <div className="card__name">{product.name}</div>
        <div className="card__price">
          <span>{formatPrice(product.price, lang)}</span>
          {product.oldPrice && <s>{formatPrice(product.oldPrice, lang)}</s>}
        </div>
        {!inStock && <div className="card__out">{t('outOfStock')}</div>}
      </div>
    </Link>
  );
}
