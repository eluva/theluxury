import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action: string }) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <h2 className="empty__title">{title}</h2>
      <p className="empty__text">{text}</p>
      <Link to="/catalog" className="btn btn--outline">
        {action}
      </Link>
    </div>
  );
}
