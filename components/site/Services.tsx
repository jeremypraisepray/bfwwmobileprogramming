'use client';

/* Yardskapes website — Services grid */

import { useState } from 'react';
import { Ruler, Layers, Sprout, Droplets, Lightbulb, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Eyebrow } from './primitives';

type Service = { n: string; icon: LucideIcon; t: string; d: string };

const SERVICES: Service[] = [
  { n: '01', icon: Ruler, t: 'Landscape Design', d: 'Master plans engineered for your property — drawn with precision, built to last a generation.' },
  { n: '02', icon: Layers, t: 'Hardscapes & Stonework', d: 'Limestone patios, steel edging, decomposed-granite paths, and modern outdoor architecture.' },
  { n: '03', icon: Sprout, t: 'Native Planting', d: 'Drought-smart Texas natives and curated beds that look intentional in every season.' },
  { n: '04', icon: Droplets, t: 'Smart Irrigation', d: 'Multi-zone, weather-aware systems that protect your investment and conserve water.' },
  { n: '05', icon: Lightbulb, t: 'Landscape Lighting', d: 'Warm architectural lighting that makes every edge and texture read after dark.' },
  { n: '06', icon: ShieldCheck, t: 'Estate Maintenance', d: 'White-glove, in-house crews keeping every inch of your property sharp, year-round.' },
];

function ServiceCard({ s }: { s: Service }) {
  const [hover, setHover] = useState(false);
  const Icon = s.icon;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: 'var(--cream)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-md)',
        padding: '34px 30px 30px',
        overflow: 'hidden',
        boxShadow: hover ? 'var(--shadow-md)' : 'none',
        transform: hover ? 'translateY(-3px)' : 'none',
        transition: 'all var(--dur) var(--ease-out)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'var(--gold)',
          transform: hover ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform var(--dur) var(--ease-out)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: 26,
          right: 28,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 13,
          color: 'var(--ink-300)',
          letterSpacing: '.1em',
        }}
      >
        {s.n}
      </span>
      <div
        style={{
          width: 46,
          height: 46,
          border: '1.5px solid var(--heritage-green)',
          borderRadius: 'var(--r-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--heritage-green)',
          marginBottom: 22,
        }}
      >
        <Icon size={22} aria-hidden />
      </div>
      <h4 style={{ margin: '0 0 10px', fontSize: 21 }}>{s.t}</h4>
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55 }}>{s.d}</p>
    </div>
  );
}

export function Services() {
  return (
    <section className="section" id="services">
      <div className="container-wide">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 24,
            marginBottom: 52,
          }}
        >
          <div>
            <Eyebrow>Our Services</Eyebrow>
            <h2 style={{ margin: '20px 0 0', maxWidth: 620 }}>Outdoor spaces designed with purpose</h2>
          </div>
          <p style={{ maxWidth: 360, margin: 0 }}>
            One in-house team for the full lifecycle — design, build, and maintain. No handoffs, no compromises.
          </p>
        </div>
        <div className="grid-services" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
          {SERVICES.map((s) => (
            <ServiceCard key={s.n} s={s} />
          ))}
        </div>
      </div>
    </section>
  );
}
