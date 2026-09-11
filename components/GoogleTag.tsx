'use client';

import Script from 'next/script';

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

// Google Ads gtag.js, loaded sitewide (direct — no Google Tag Manager container).
// Independent of the Meta (fbq) and TikTok (ttq) pixels. Renders nothing until
// NEXT_PUBLIC_GOOGLE_ADS_ID is set.
export default function GoogleTag() {
  if (!ADS_ID) return null;
  return (
    <>
      <Script
        id="gtag-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`}
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ADS_ID}');`}
      </Script>
    </>
  );
}
