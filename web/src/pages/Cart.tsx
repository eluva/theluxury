import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Empty } from '../components/Empty';
import { IconBag, IconClose, IconMinus, IconPlus } from '../components/Icons';
import { Img } from '../components/Img';
import { submitOrder, useCatalog } from '../lib/api';
import { formatPhone, formatPrice, isValidPhone } from '../lib/format';
import { useT } from '../lib/i18n';
import { haptic } from '../lib/telegram';
import { useShop } from '../store/shop';

export function Cart() {
  const t = useT();
  const navigate = useNavigate();
  const catalog = useCatalog();
  const { lang, cart, setQty, clearCart, customer, saveCustomer } = useShop();

  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone || '+998 ');
  const [method, setMethod] = useState<'pickup' | 'courier'>('pickup');
  const [address, setAddress] = useState(customer.address);
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const lines = cart
    .map((item) => {
      const product = catalog?.products.find((p) => p.id === item.productId);
      if (!product) return null;
      const stock = product.sizes.find((s) => s.size === item.size)?.qty ?? 0;
      return { ...item, product, stock };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  if (catalog && !lines.length) {
    return <Empty icon={<IconBag width={32} height={32} />} title={t('emptyCart')} text={t('emptyCartText')} action={t('goCatalog')} />;
  }

  const total = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const count = lines.reduce((n, l) => n + l.qty, 0);

  const errors = {
    name: !name.trim() ? t('required') : '',
    phone: !isValidPhone(phone) ? t('badPhone') : '',
    address: method === 'courier' && !address.trim() ? t('required') : '',
  };
  const valid = !errors.name && !errors.phone && !errors.address;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) {
      haptic.error();
      return;
    }
    setSending(true);
    setError('');
    saveCustomer({ name: name.trim(), phone, address: address.trim() });
    try {
      const { id } = await submitOrder({
        customer: { name: name.trim(), phone },
        delivery: { method, address: method === 'courier' ? address.trim() : undefined },
        comment: comment.trim() || undefined,
        items: lines.map((l) => ({
          productId: l.product.id,
          sku: l.product.sku,
          name: l.product.name,
          size: l.size,
          qty: l.qty,
          price: l.product.price,
        })),
        total,
      });
      haptic.success();
      clearCart();
      navigate(`/success/${id}`, { replace: true });
    } catch {
      haptic.error();
      setError(t('orderError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="page page--cart" onSubmit={onSubmit} noValidate>
      <div className="page__head">
        <h1 className="h1">{t('cart')}</h1>
        <span className="muted">
          {count} {t('pcs')}
        </span>
      </div>

      <ul className="lines">
        {lines.map((l) => (
          <li key={`${l.product.id}-${l.size}`} className="line">
            <Link to={`/product/${l.product.id}`} className="line__img">
              <Img src={l.product.images[0]} alt={l.product.name} width={200} />
            </Link>
            <div className="line__info">
              <div className="line__top">
                <Link to={`/product/${l.product.id}`} className="line__name">
                  {l.product.name}
                </Link>
                <button type="button" className="icon-btn" aria-label={t('remove')} onClick={() => setQty(l.product.id, l.size, 0)}>
                  <IconClose width={16} height={16} />
                </button>
              </div>
              <div className="muted">
                {t('size')}: {l.size}
              </div>
              <div className="line__bottom">
                <div className="stepper">
                  <button type="button" onClick={() => { haptic.select(); setQty(l.product.id, l.size, l.qty - 1); }} aria-label="-">
                    <IconMinus width={16} height={16} />
                  </button>
                  <span>{l.qty}</span>
                  <button
                    type="button"
                    disabled={l.qty >= l.stock}
                    onClick={() => { haptic.select(); setQty(l.product.id, l.size, l.qty + 1); }}
                    aria-label="+"
                  >
                    <IconPlus width={16} height={16} />
                  </button>
                </div>
                <span className="line__price">{formatPrice(l.product.price * l.qty, lang)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <section className="form">
        <h2 className="h3">{t('yourData')}</h2>
        <label className="field">
          <span>{t('name')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          {touched && errors.name && <em>{errors.name}</em>}
        </label>
        <label className="field">
          <span>{t('phone')}</span>
          <input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} inputMode="tel" autoComplete="tel" />
          {touched && errors.phone && <em>{errors.phone}</em>}
        </label>

        <h2 className="h3">{t('delivery')}</h2>
        <div className="radios">
          {(['pickup', 'courier'] as const).map((m) => (
            <label key={m} className={`radio${method === m ? ' is-active' : ''}`}>
              <input type="radio" name="delivery" checked={method === m} onChange={() => { haptic.select(); setMethod(m); }} />
              <span className="radio__dot" />
              <span className="radio__text">
                {t(m)}
                <small>{m === 'pickup' ? t('address1') : t('byTariff')}</small>
              </span>
            </label>
          ))}
        </div>
        {method === 'courier' && (
          <label className="field">
            <span>{t('address')}</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
            {touched && errors.address && <em>{errors.address}</em>}
          </label>
        )}
        <label className="field">
          <span>{t('comment')}</span>
          <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
        </label>
      </section>

      <section className="summary">
        <div>
          <span>{t('items')}</span>
          <span>{formatPrice(total, lang)}</span>
        </div>
        <div>
          <span>{t('delivery')}</span>
          <span>{method === 'pickup' ? t('free') : t('byTariff')}</span>
        </div>
        <div className="summary__total">
          <span>{t('total')}</span>
          <span>{formatPrice(total, lang)}</span>
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}

      <div className="sticky-cta">
        <button type="submit" className="btn btn--gold btn--block" disabled={sending}>
          {sending ? t('sending') : `${t('confirm')} · ${formatPrice(total, lang)}`}
        </button>
      </div>
    </form>
  );
}
