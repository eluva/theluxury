import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IconClose, IconSearch } from '../components/Icons';
import { ProductCard } from '../components/ProductCard';
import { useCatalog } from '../lib/api';
import { useT, type TKey } from '../lib/i18n';
import { haptic } from '../lib/telegram';
import { useShop } from '../store/shop';

const SORTS: { id: string; label: TKey }[] = [
  { id: 'popular', label: 'sortPopular' },
  { id: 'new', label: 'sortNew' },
  { id: 'cheap', label: 'sortCheap' },
  { id: 'expensive', label: 'sortExpensive' },
];

export function Catalog() {
  const t = useT();
  const lang = useShop((s) => s.lang);
  const catalog = useCatalog();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');

  const cat = params.get('cat') ?? '';
  const col = params.get('col') ?? '';
  const sale = params.get('sale') === '1';
  const size = params.get('size') ?? '';
  const sort = params.get('sort') ?? 'popular';

  const update = (key: string, value: string) => {
    haptic.select();
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const allSizes = useMemo(() => {
    const set = new Set<string>();
    catalog?.products.forEach((p) => p.sizes.forEach((s) => set.add(s.size)));
    return [...set].sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [catalog]);

  const list = useMemo(() => {
    if (!catalog) return [];
    const q = query.trim().toLowerCase();
    const res = catalog.products.filter(
      (p) =>
        (!cat || p.category === cat) &&
        (!col || p.collection === col) &&
        (!sale || p.oldPrice) &&
        (!size || p.sizes.some((s) => s.size === size && s.qty > 0)) &&
        (!q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)),
    );
    const inStock = (p: (typeof res)[number]) => (p.sizes.some((s) => s.qty > 0) ? 0 : 1);
    return res.sort((a, b) => {
      const stock = inStock(a) - inStock(b);
      if (stock) return stock;
      if (sort === 'cheap') return a.price - b.price;
      if (sort === 'expensive') return b.price - a.price;
      if (sort === 'new') return Number(!!b.isNew) - Number(!!a.isNew);
      return 0;
    });
  }, [catalog, cat, col, sale, size, sort, query]);

  const hasFilters = cat || col || sale || size || query;

  return (
    <div className="page">
      <div className="page__head">
        <h1 className="h1">{t('catalog')}</h1>
        <span className="muted">
          {list.length} {t('models')}
        </span>
      </div>

      <label className="search">
        <IconSearch width={18} height={18} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('search')} enterKeyHint="search" />
        {query && (
          <button onClick={() => setQuery('')} aria-label="clear">
            <IconClose width={16} height={16} />
          </button>
        )}
      </label>

      <div className="chips">
        <button className={`chip${!cat && !col && !sale ? ' is-active' : ''}`} onClick={() => setParams({}, { replace: true })}>
          {t('all')}
        </button>
        {catalog?.categories.map((c) => (
          <button key={c.id} className={`chip${cat === c.id ? ' is-active' : ''}`} onClick={() => update('cat', cat === c.id ? '' : c.id)}>
            {c.name[lang]}
          </button>
        ))}
        <button className={`chip${col === 'premium' ? ' is-active' : ''}`} onClick={() => update('col', col ? '' : 'premium')}>
          Premium
        </button>
        <button className={`chip chip--gold${sale ? ' is-active' : ''}`} onClick={() => update('sale', sale ? '' : '1')}>
          {t('sale')}
        </button>
      </div>

      <div className="toolbar">
        <div className="sizes-filter">
          <span className="muted">{t('size')}:</span>
          {allSizes.map((s) => (
            <button key={s} className={`size-mini${size === s ? ' is-active' : ''}`} onClick={() => update('size', size === s ? '' : s)}>
              {s}
            </button>
          ))}
        </div>
        <select className="select" value={sort} onChange={(e) => update('sort', e.target.value === 'popular' ? '' : e.target.value)}>
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {t(s.label)}
            </option>
          ))}
        </select>
      </div>

      {catalog && !list.length ? (
        <div className="empty empty--inline">
          <p className="empty__text">{t('nothingFound')}</p>
          {hasFilters && (
            <button
              className="btn btn--outline"
              onClick={() => {
                setQuery('');
                setParams({}, { replace: true });
              }}
            >
              {t('resetFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid">
          {catalog
            ? list.map((p) => <ProductCard key={p.id} product={p} />)
            : Array.from({ length: 6 }, (_, i) => <div key={i} className="card card--skeleton" />)}
        </div>
      )}
    </div>
  );
}
