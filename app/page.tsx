'use client';

/* Yardskapes — single-page marketing site.
   Composition mirrors the handoff App: Nav · Hero · Services · SplitFeature ·
   Process · Gallery · Testimonial · CTA · Footer, with the QuoteModal mounted
   at root and toggled by state (openable from Nav, Hero, and CTA). */

import { useState } from 'react';
import { Nav } from '@/components/site/Nav';
import { Hero } from '@/components/site/Hero';
import { Services } from '@/components/site/Services';
import { SplitFeature } from '@/components/site/SplitFeature';
import { Process } from '@/components/site/Process';
import { Gallery } from '@/components/site/Gallery';
import { Testimonial } from '@/components/site/Testimonial';
import { CTA, Footer } from '@/components/site/CTAFooter';
import { QuoteModal } from '@/components/site/QuoteModal';

export default function Home() {
  const [quote, setQuote] = useState(false);
  const openQuote = () => setQuote(true);

  return (
    <div className="kit-root">
      <Nav onQuote={openQuote} />
      <Hero onQuote={openQuote} />
      <Services />
      <SplitFeature />
      <Process />
      <Gallery />
      <Testimonial />
      <CTA onQuote={openQuote} />
      <Footer />
      <QuoteModal open={quote} onClose={() => setQuote(false)} />
    </div>
  );
}
