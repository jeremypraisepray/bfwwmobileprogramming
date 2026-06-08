'use client';

/* Yardskapes website — CTA block + Footer */

import { ArrowRight, Phone } from 'lucide-react';
import { Mark, Btn } from './primitives';

export function CTA({ onQuote }: { onQuote: () => void }) {
  return (
    <section className="section" style={{ position: 'relative', background: 'var(--charcoal-green)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--leaf-texture)', opacity: 0.09 }} />
      <span className="tick tick-tl" style={{ top: 34, left: 'max(34px, calc((100% - 1360px)/2 + 40px))' }} />
      <span className="tick tick-br" style={{ bottom: 34, right: 'max(34px, calc((100% - 1360px)/2 + 40px))' }} />
      <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 820 }}>
        <Mark tone="gold" size={48} style={{ margin: '0 auto 26px' }} />
        <h2 style={{ color: 'var(--limestone)', fontSize: 'clamp(34px,4.6vw,60px)', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
          Houston landscaping with a higher standard
        </h2>
        <p className="serif-lead" style={{ color: 'var(--fg-on-dark-2)', maxWidth: 520, margin: '20px auto 0', fontSize: 21 }}>
          Tell us about your property. We&rsquo;ll walk it with you and show you what&rsquo;s possible.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 38, flexWrap: 'wrap' }}>
          <Btn variant="light" icon={ArrowRight} onClick={onQuote}>
            Request a Walkthrough
          </Btn>
          <a href="tel:+17135550148">
            <Btn variant="outline-light" icon={Phone}>
              (713) 555-0148
            </Btn>
          </a>
        </div>
      </div>
    </section>
  );
}

const FOOTER_COLS: [string, string[]][] = [
  ['Services', ['Landscape Design', 'Hardscapes', 'Native Planting', 'Irrigation', 'Lighting', 'Maintenance']],
  ['Company', ['Our Work', 'Process', 'About', 'Careers', 'Contact']],
  ['Serving', ['River Oaks', 'Memorial', 'The Woodlands', 'Sugar Land', 'Katy']],
];

export function Footer() {
  return (
    <footer id="about" style={{ background: 'var(--forest-deep)', color: 'var(--fg-on-dark)' }}>
      <div
        className="container-wide footer-grid"
        style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 40, padding: '72px 40px 48px' }}
      >
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-full-cream.png" alt="Yardskapes" style={{ height: 64, width: 'auto', marginBottom: 18 }} />
          <p style={{ color: 'var(--fg-on-dark-2)', maxWidth: 280, fontSize: 14.5, margin: 0 }}>
            Inspired by nature. Perfected by us. Premium landscaping &amp; outdoor living across greater Houston.
          </p>
        </div>
        {FOOTER_COLS.map(([h, items]) => (
          <div key={h}>
            <div className="tracked-caps" style={{ fontSize: 11, letterSpacing: '.16em', color: 'var(--gold-soft)', marginBottom: 18 }}>
              {h}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 11 }}>
              {items.map((i) => (
                <li key={i}>
                  <a
                    href="#"
                    style={{ color: 'var(--fg-on-dark-2)', fontSize: 14 }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--limestone)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fg-on-dark-2)')}
                  >
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--line-on-dark)' }}>
        <div
          className="container-wide"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 40px', flexWrap: 'wrap', gap: 12 }}
        >
          <span className="caption" style={{ color: 'var(--fg-on-dark-2)' }}>
            © 2026 Yardskapes LLC · Houston, Texas
          </span>
          <span className="caption" style={{ color: 'var(--fg-on-dark-2)', letterSpacing: '.14em' }}>
            EVERY EDGE. EVERY TEXTURE. EVERY DETAIL.
          </span>
        </div>
      </div>
    </footer>
  );
}
