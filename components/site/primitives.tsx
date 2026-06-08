'use client';

/* Yardskapes website — shared primitives (ported from the handoff primitives.jsx) */

import type { CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  const color = light ? 'var(--gold-soft)' : 'var(--clay)';
  return (
    <div className="eyebrow-row" style={{ ['--clay']: color } as CSSProperties}>
      <span className="eyebrow" style={{ color }}>
        {children}
      </span>
    </div>
  );
}

type BtnVariant = 'primary' | 'light' | 'outline' | 'outline-light' | 'clay' | 'ghost';

export function Btn({
  variant = 'primary',
  icon: Icon,
  children,
  onClick,
  type = 'button',
}: {
  variant?: BtnVariant;
  icon?: LucideIcon;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick} type={type}>
      {children}
      {Icon && <Icon size={16} aria-hidden />}
    </button>
  );
}

/* Brand mark image (pre-generated recolors in /public/assets) */
export function Mark({
  tone = 'green',
  size = 40,
  style,
}: {
  tone?: 'green' | 'gold' | 'cream';
  size?: number;
  style?: CSSProperties;
}) {
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={`/assets/mark-${tone}.png`} alt="Yardskapes" style={{ height: size, width: 'auto', ...style }} />;
}

/* Photo zone — renders a real <img> when `src` is provided, otherwise the
   branded green placeholder. (Handoff: every .photo-zone gets real photography.) */
export function Photo({
  h = 420,
  radius = 4,
  placeholder,
  framed,
  mark = true,
  src,
  alt = '',
  grad = false,
  style,
  className = '',
}: {
  h?: number | string;
  radius?: number;
  placeholder?: string;
  framed?: boolean;
  mark?: boolean;
  src?: string;
  alt?: string;
  grad?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`photo-zone ${framed ? 'framed' : ''} ${grad ? 'pz-grad' : ''} ${className}`}
      style={{ height: typeof h === 'number' ? h + 'px' : h, borderRadius: radius, ...style }}
    >
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img className="pz-img" src={src} alt={alt} />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {mark && <img className="pz-mark" src="/assets/mark-cream.png" alt="" />}
          {placeholder && <span className="pz-cap">{placeholder}</span>}
        </>
      )}
      {framed && (
        <>
          <span className="tick tick-tl" />
          <span className="tick tick-tr" />
          <span className="tick tick-bl" />
          <span className="tick tick-br" />
        </>
      )}
    </div>
  );
}

/* small numbered/iconed feature line */
export function IconTick({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span
        style={{
          width: 26,
          height: 26,
          flex: 'none',
          border: '1.5px solid var(--heritage-green)',
          borderRadius: 'var(--r-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--heritage-green)',
        }}
      >
        <Icon size={14} aria-hidden />
      </span>
      <span style={{ fontSize: 15.5, lineHeight: 1.5, color: 'var(--fg-2)', paddingTop: 2 }}>{children}</span>
    </div>
  );
}
