import { Empty } from '../components/Empty';
import { IconHeart } from '../components/Icons';
import { ProductCard } from '../components/ProductCard';
import { useCatalog } from '../lib/api';
import { useT } from '../lib/i18n';
import { useShop } from '../store/shop';

export function Favorites() {
  const t = useT();
  const catalog = useCatalog();
  const favorites = useShop((s) => s.favorites);
  const list = catalog?.products.filter((p) => favorites.includes(p.id)) ?? [];

  if (catalog && !list.length) {
    return <Empty icon={<IconHeart width={32} height={32} />} title={t('emptyFav')} text={t('emptyFavText')} action={t('goCatalog')} />;
  }

  return (
    <div className="page">
      <div className="page__head">
        <h1 className="h1">{t('favorites')}</h1>
        <span className="muted">{list.length}</span>
      </div>
      <div className="grid">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
