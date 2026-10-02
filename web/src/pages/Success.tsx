import { Link, useParams } from 'react-router-dom';
import { IconCheck, IconSend } from '../components/Icons';
import { BRAND } from '../brand';
import { useT } from '../lib/i18n';
import { openTelegram } from '../lib/telegram';

export function Success() {
  const { id } = useParams();
  const t = useT();
  return (
    <div className="empty success">
      <div className="empty__icon empty__icon--gold">
        <IconCheck width={34} height={34} />
      </div>
      <h1 className="empty__title">{t('thanks')}</h1>
      <p className="empty__text">{t('thanksText')}</p>
      <p className="success__no">
        {t('orderNo')}: <b>#{id}</b>
      </p>
      <div className="success__actions">
        <Link to="/" className="btn btn--gold">
          {t('backHome')}
        </Link>
        <button className="btn btn--outline" onClick={() => openTelegram(BRAND.telegram)}>
          <IconSend width={18} height={18} /> {t('writeUs')}
        </button>
      </div>
    </div>
  );
}
