'use client';

/* Yardskapes website — Split feature (hardscaping focus) */

import { Layers, Ruler, Leaf, ArrowRight } from 'lucide-react';
import { Eyebrow, Btn, Photo, IconTick } from './primitives';

export function SplitFeature() {
  return (
    <section className="section" style={{ background: 'var(--limestone-deep)' }}>
      <div
        className="container-wide split-grid"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}
      >
        <div className="framed split-photo">
          <Photo h={520} framed src="/images/split-detail.png" alt="Detailed hardscape and stonework by Yardskapes" />
        </div>
        <div>
          <Eyebrow>Patios &amp; Stonework</Eyebrow>
          <h2 style={{ margin: '20px 0 0' }}>
            Inspired by nature.
            <br />
            Focused hardscaping.
          </h2>
          <p className="lead" style={{ marginTop: 22 }}>
            Every Yardskapes project is built around its hardscape — patios, walls, and stonework set with precision,
            then softened with planting. The result looks effortless because nothing about it was left to chance.
          </p>
          <div style={{ display: 'grid', gap: 18, marginTop: 30 }}>
            <IconTick icon={Layers}>Custom patios, walkways, and retaining walls built to last</IconTick>
            <IconTick icon={Ruler}>Steel-edged beds and millimeter-clean transitions</IconTick>
            <IconTick icon={Leaf}>Native, drought-smart palettes built for Houston heat</IconTick>
          </div>
          <div style={{ marginTop: 36 }}>
            <a href="#process">
              <Btn variant="outline" icon={ArrowRight}>
                Explore the Process
              </Btn>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
