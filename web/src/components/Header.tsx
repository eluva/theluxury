import { Link } from 'react-router-dom';
import { haptic } from '../lib/telegram';
import { useShop } from '../store/shop';
import { Logo } from './Logo';

export function Header() {
  const lang = useShop((s) => s.lang);
  const setLang = useShop((s) => s.setLang);

  return (
    <header className="header">
      <Link to="/" className="header__logo" aria-label="LUXURY">
        <Logo small />
      </Link>
      <div className="lang" role="group" aria-label="Language">
        {(['ru', 'uz'] as const).map((l) => (
          <button
            key={l}
            className={`lang__btn${lang === l ? ' is-active' : ''}`}
            onClick={() => {
              haptic.select();
              setLang(l);
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </header>
  );
}
