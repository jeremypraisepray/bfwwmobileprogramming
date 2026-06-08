'use client';

/* Yardskapes website — Gallery with before/after slider + portfolio grid */

import { useEffect, useRef, useState } from 'react';
import { ChevronsLeftRight } from 'lucide-react';
import { Eyebrow, Photo } from './primitives';

function BeforeAfter() {
  const [pos, setPos] = useState(52);
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef(false);

  /* keep the clipped "before" image at the container's full width so it
     stays aligned with the "after" layer as the slider moves */
  useEffect(() => {
    const measure = () => ref.current && setWidth(ref.current.getBoundingClientRect().width);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!drag.current || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const x = clientX - r.left;
      setPos(Math.max(2, Math.min(98, (x / r.width) * 100)));
    };
    const up = () => (drag.current = false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="framed"
      style={{
        position: 'relative',
        height: 460,
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: 'ew-resize',
        background: 'var(--charcoal-green)',
      }}
      onMouseDown={() => (drag.current = true)}
      onTouchStart={() => (drag.current = true)}
    >
      {/* AFTER (full) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/after.png"
        alt="After: completed Yardskapes landscape"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        draggable={false}
      />
      {/* BEFORE (clipped) */}
      <div style={{ position: 'absolute', inset: 0, width: pos + '%', overflow: 'hidden', borderRight: '2px solid var(--limestone)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/before.png"
          alt="Before: the property prior to landscaping"
          style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: width || '100%', maxWidth: 'none', objectFit: 'cover' }}
          draggable={false}
        />
        <span style={{ position: 'absolute', top: 18, left: 18, zIndex: 3 }} className="tracked-caps">
          <span style={{ background: 'rgba(17,32,26,.7)', color: 'var(--limestone)', fontSize: 11, letterSpacing: '.16em', padding: '7px 13px', borderRadius: 'var(--r-pill)' }}>
            Before
          </span>
        </span>
      </div>
      <span style={{ position: 'absolute', top: 18, right: 18, zIndex: 3 }} className="tracked-caps">
        <span style={{ background: 'var(--clay)', color: '#fff', fontSize: 11, letterSpacing: '.16em', padding: '7px 13px', borderRadius: 'var(--r-pill)' }}>
          After
        </span>
      </span>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: pos + '%', width: 2, background: 'var(--limestone)', transform: 'translateX(-1px)', zIndex: 4 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: 'var(--limestone)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
            color: 'var(--heritage-green)',
          }}
        >
          <ChevronsLeftRight size={20} aria-hidden />
        </div>
      </div>
    </div>
  );
}

const PORTFOLIO: { title: string; src: string }[] = [
  { title: 'Independence Heights Estate', src: '/images/gallery-river-oaks.png' },
  { title: 'Friendswood', src: '/images/gallery-memorial-modern.png' },
  { title: 'Sagemont Retreat', src: '/images/gallery-hill-country.png' },
];

export function Gallery() {
  return (
    <section className="section" id="work">
      <div className="container-wide">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 24,
            marginBottom: 44,
          }}
        >
          <div>
            <Eyebrow>Selected Work</Eyebrow>
            <h2 style={{ margin: '20px 0 0', maxWidth: 560 }}>Landscapes that look intentional from every angle</h2>
          </div>
          <span className="tracked-caps" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '.14em' }}>
            Drag to compare →
          </span>
        </div>
        <BeforeAfter />
        <div className="grid-gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22, marginTop: 22 }}>
          {PORTFOLIO.map((p) => (
            <figure key={p.title} style={{ margin: 0 }}>
              <Photo h={260} src={p.src} alt={`${p.title} — landscaping project in Houston`} grad />
              <figcaption style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14 }}>
                <span className="h6" style={{ fontSize: 15 }}>
                  {p.title}
                </span>
                <span className="caption" style={{ color: 'var(--clay)' }}>
                  Houston, TX
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
