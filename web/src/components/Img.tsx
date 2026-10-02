import { useState } from 'react';

/** Image with a soft placeholder while loading and a monogram fallback on error.
 *  For Unsplash demo images the width param is rewritten to the requested size. */
export function Img({ src, alt, width, className }: { src?: string; alt: string; width?: number; className?: string }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>(src ? 'loading' : 'error');
  const url = src && width && src.includes('images.unsplash.com') ? src.replace(/w=\d+/, `w=${width}`) : src;

  return (
    <div className={`img img--${state}${className ? ` ${className}` : ''}`}>
      {state !== 'error' && url && (
        <img src={url} alt={alt} loading="lazy" decoding="async" onLoad={() => setState('ok')} onError={() => setState('error')} />
      )}
      {state === 'error' && <span className="img__fallback">L</span>}
    </div>
  );
}
