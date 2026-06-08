'use client';

/* Yardskapes website — Process (dark band) */

import { Eyebrow } from './primitives';

const STEPS = [
  { n: '01', t: 'Walkthrough', d: 'We walk your property, listen to how you live outdoors, and map the opportunity.' },
  { n: '02', t: 'Design', d: 'A scaled master plan — grades, materials, planting, and lighting, drawn to precision.' },
  { n: '03', t: 'Build', d: 'In-house crews execute hardscape, planting, and irrigation to estate standards.' },
  { n: '04', t: 'Maintain', d: 'Year-round white-glove care that keeps every edge sharp and every bed full.' },
];

export function Process() {
  return (
    <section
      className="section"
      id="process"
      style={{ position: 'relative', background: 'var(--heritage-green)', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'var(--leaf-texture)', opacity: 0.12 }} />
      <div className="container-wide" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 640 }}>
          <Eyebrow light>How We Work</Eyebrow>
          <h2 style={{ color: 'var(--limestone)', margin: '20px 0 0' }}>One team. Four disciplines. Zero handoffs.</h2>
        </div>
        <div
          className="grid-process"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, marginTop: 56 }}
        >
          {STEPS.map((s) => (
            <div key={s.n} style={{ padding: '4px 28px 4px 0', borderTop: '1px solid var(--line-on-dark)', paddingTop: 26 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--gold-soft)', letterSpacing: '.16em' }}>
                {s.n}
              </div>
              <h4 style={{ color: 'var(--limestone)', margin: '18px 0 10px', fontSize: 22, textTransform: 'uppercase', letterSpacing: '.02em' }}>
                {s.t}
              </h4>
              <p style={{ color: 'var(--fg-on-dark-2)', margin: 0, fontSize: 14.5, lineHeight: 1.55 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
