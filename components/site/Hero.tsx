'use client';

/* Yardskapes website — Hero + stat strip */

import { ArrowRight } from 'lucide-react';
import { Eyebrow, Btn } from './primitives';

const STATS: [string, string][] = [
  ['15+', 'Years in Houston'],
  ['320+', 'Properties Maintained'],
  ['4-Zone', 'Smart Irrigation'],
  ['100%', 'In-house Crews'],
];

export function Hero({ onQuote }: { onQuote: () => void }) {
  return (
    <section id="top" style={{ position: 'relative', background: 'var(--charcoal-green)', overflow: 'hidden' }}>
      {/* full-bleed property photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero.png"
        alt="A premium Houston estate landscape at golden hour"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {/* green protection overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(100deg, rgba(17,32,26,0.92) 0%, rgba(22,48,30,0.78) 42%, rgba(17,32,26,0.32) 100%)',
        }}
      />
      {/* leaf texture wash */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--leaf-texture)', opacity: 0.1, mixBlendMode: 'screen' }} />

      <div className="container-wide" style={{ position: 'relative', zIndex: 2, padding: '128px 40px 120px' }}>
        <div style={{ maxWidth: 760 }} className="fade-up">
          <Eyebrow light>Houston · Estate Landscaping</Eyebrow>
          <h1
            style={{
              color: 'var(--limestone)',
              fontSize: 'clamp(44px, 6vw, 88px)',
              margin: '22px 0 0',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              lineHeight: 0.98,
            }}
          >
            Built for Texas.
            <br />
            Refined for
            <br />
            <span style={{ color: 'var(--gold-soft)' }}>your property.</span>
          </h1>
          <p className="serif-lead" style={{ color: 'var(--fg-on-dark-2)', maxWidth: 540, marginTop: 28, fontSize: 22 }}>
            Where natural beauty meets sharp execution — outdoor environments designed, built, and maintained with
            obsessive attention to every detail.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
            <Btn variant="light" icon={ArrowRight} onClick={onQuote}>
              Request a Walkthrough
            </Btn>
            <a href="#work">
              <Btn variant="outline-light">View Our Work</Btn>
            </a>
          </div>
        </div>
      </div>

      {/* bottom stat strip */}
      <div style={{ position: 'relative', zIndex: 2, borderTop: '1px solid var(--line-on-dark)' }}>
        <div className="container-wide hero-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {STATS.map(([n, l], i) => (
            <div key={l} style={{ padding: '26px 28px', borderLeft: i ? '1px solid var(--line-on-dark)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--limestone)' }}>
                {n}
              </div>
              <div className="tracked-caps" style={{ fontSize: 10.5, color: 'var(--fg-on-dark-2)', letterSpacing: '.14em', marginTop: 5 }}>
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
