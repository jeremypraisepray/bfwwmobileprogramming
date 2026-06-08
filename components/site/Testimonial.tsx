'use client';

/* Yardskapes website — Testimonial / pull quote */

export function Testimonial() {
  return (
    <section
      className="section-tight"
      style={{ background: 'var(--cream)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}
    >
      <div className="container" style={{ textAlign: 'center', maxWidth: 920 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/mark-gold.png" alt="" style={{ height: 38, width: 'auto', margin: '0 auto 26px', display: 'block' }} />
        <blockquote
          className="serif-display"
          style={{ fontStyle: 'italic', fontSize: 'clamp(26px,3.4vw,40px)', lineHeight: 1.22, margin: 0, color: 'var(--fg-1)' }}
        >
          &ldquo;They treat our grounds like architecture. Every edge, every light, every bed is considered — it&rsquo;s the
          first thing guests notice when they pull in.&rdquo;
        </blockquote>
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span className="tracked-caps" style={{ fontSize: 12, letterSpacing: '.14em', color: 'var(--fg-1)' }}>
            Caroline Hadley
          </span>
          <span className="caption" style={{ color: 'var(--clay)' }}>
            Estate Owner · Independence Heights
          </span>
        </div>
      </div>
    </section>
  );
}
