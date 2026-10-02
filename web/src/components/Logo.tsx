export function Logo({ small }: { small?: boolean }) {
  return (
    <div className={`logo${small ? ' logo--small' : ''}`}>
      <span className="logo__word">LUXURY</span>
      {!small && <span className="logo__sub">UZBEKISTAN</span>}
    </div>
  );
}
