'use client';

/* Yardskapes website — Navigation bar (sticky, frosts on scroll) */

import { useEffect, useState } from 'react';
import { Phone, Leaf, Menu, X } from 'lucide-react';
import { Btn } from './primitives';

const LINKS: { label: string; href: string }[] = [
  { label: 'Services', href: '#services' },
  { label: 'Our Work', href: '#work' },
  { label: 'Process', href: '#process' },
  { label: 'About', href: '#about' },
];

export function Nav({ onQuote }: { onQuote: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: scrolled || open ? 'rgba(244,240,232,0.86)' : 'transparent',
        backdropFilter: scrolled || open ? 'saturate(140%) blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled || open ? 'saturate(140%) blur(12px)' : 'none',
        borderBottom: scrolled || open ? '1px solid var(--line)' : '1px solid transparent',
        transition: 'all var(--dur) var(--ease-out)',
      }}
    >
      <div
        className="container-wide"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 84 }}
      >
        <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-full-green.png" alt="Yardskapes" style={{ height: 34, width: 'auto' }} />
        </a>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 38 }} className="nav-links">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="tracked-caps"
              style={{ fontSize: 12, color: 'var(--fg-1)', letterSpacing: '.14em', position: 'relative' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--clay)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fg-1)')}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <a
            href="tel:+17135550148"
            className="tracked-caps nav-phone"
            style={{ fontSize: 12, color: 'var(--fg-2)', letterSpacing: '.1em', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Phone size={14} aria-hidden />
            (713) 555-0148
          </a>
          <span className="nav-cta-desktop">
            <Btn variant="primary" icon={Leaf} onClick={onQuote}>
              Get a Quote
            </Btn>
          </span>
          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            style={{
              display: 'none',
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              color: 'var(--fg-1)',
              padding: 6,
            }}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* mobile sheet */}
      {open && (
        <div className="nav-sheet" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="container-wide" style={{ display: 'grid', gap: 4, padding: '16px 20px 24px' }}>
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="tracked-caps"
                onClick={() => setOpen(false)}
                style={{ fontSize: 13, color: 'var(--fg-1)', letterSpacing: '.14em', padding: '12px 0', borderBottom: '1px solid var(--line)' }}
              >
                {l.label}
              </a>
            ))}
            <a
              href="tel:+17135550148"
              className="tracked-caps"
              style={{ fontSize: 13, color: 'var(--fg-2)', letterSpacing: '.1em', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}
            >
              <Phone size={15} aria-hidden />
              (713) 555-0148
            </a>
            <div style={{ marginTop: 8 }}>
              <Btn
                variant="primary"
                icon={Leaf}
                onClick={() => {
                  setOpen(false);
                  onQuote();
                }}
              >
                Get a Quote
              </Btn>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
