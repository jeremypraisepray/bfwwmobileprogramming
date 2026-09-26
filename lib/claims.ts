// ---------------------------------------------------------------------------
// Every advertised claim, credential, disclosure, and business fact rendered
// on the funnel lives here — one line to edit, nothing hardcoded in JSX.
//
// LEGAL BLOCKS (FINANCING_DISCLAIMER, CONSENT_TEXT) are verbatim and must not
// be paraphrased, shortened, or softened. CONSENT_TEXT and CONSENT_TEXT_VERSION
// are deliberately adjacent: if the wording changes, bump the version in the
// same edit so the rendered copy and the logged version string never drift.
// ---------------------------------------------------------------------------

export const BUSINESS = {
  name: 'American Master Roofing',
  addressLine: '6260 Westpark Drive, Suite 315, Houston, TX 77057',
  phoneDisplay: '(346) 680-3564',
  phoneHref: 'tel:+13466803564',
  serviceAreas: 'Houston, Katy, Sugar Land, The Woodlands, Pearland, Cypress & Spring',
} as const;

// ---- Credentials (primary — must be visible on step 1 without interaction) --
export const CRED_OWENS_CORNING = 'Owens Corning Preferred Contractor';
export const CRED_BBB = 'BBB A+ Rated · Accredited Business';
export const CRED_GOOGLE = '5-Star Google Reviews';
export const CRED_ROOFS = '1,500+ Roofs Replaced across Houston';

// Short forms for the mobile hero's credential strip (same claims, fewer words).
export const CRED_OWENS_CORNING_SHORT = 'Owens Corning Preferred';
export const CRED_BBB_SHORT = 'BBB A+ Accredited';
export const CRED_GOOGLE_SHORT = '5-Star Google Reviews';
export const CRED_ROOFS_SHORT = '1,500+ Houston roofs';
export const HERO_KICKER = 'Houston · Since 1999 · No obligation';

// ---- Credentials (secondary) ------------------------------------------------
export const CRED_YEARS = '25+ Years Experience';
export const CRED_SINCE = 'Roofing Houston since 1999';
export const CRED_INSURED = 'Insured & Bonded';
export const CRED_FREE = 'Free inspection, no obligation';
export const CRED_24H = 'Inspection within 24 hours';

// ---- Product & warranty ------------------------------------------------------
export const CLAIM_SHINGLES = 'Owens Corning architectural shingles with manufacturer warranty';
export const CLAIM_WARRANTY = '50-year warranty covering labor and materials, per warranty terms';
export const CLAIM_WARRANTY_SHORT = '50-year warranty';

// ---- Pricing -----------------------------------------------------------------
export const PRICE_FROM = 'Roof replacement from $7,995';
export const PRICE_QUALIFIER =
  'Final pricing depends on roof size, pitch, materials, and scope of work — your written estimate is free and non-binding.';
export const CLAIM_FINANCING = '$0-down and no-interest financing options available.*';
// Hero offer tag: the asterisk points to FINANCING_EXAMPLE in the fine print.
export const OFFER_DOWN = '$0 down';
export const OFFER_MONTHLY = 'Payments as low as $99/mo*';

// ---- Payment example — VERBATIM (owner-supplied), do not edit wording -------
export const FINANCING_EXAMPLE =
  '*Payments as low as $99/mo. Example based on approved financing; APR, term and amount financed vary by applicant. Subject to credit approval. See lender for complete terms.';

// ---- Financing disclaimer — VERBATIM, do not edit wording --------------------
export const FINANCING_DISCLAIMER =
  '*Financing subject to approved credit. Terms and conditions apply. See representative for complete details.';

// ---- TCPA consent — VERBATIM, do not edit wording without bumping version ----
// [Privacy Policy] and [Terms] are link placeholders the UI resolves; the
// surrounding wording renders exactly as written here.
export const CONSENT_TEXT =
  'By submitting, I agree to receive SMS/email communications from American Master Roofing. Consent is not a condition of purchase. Msg & data rates may apply. Reply STOP to opt out. See our [Privacy Policy] and [Terms].';
export const CONSENT_TEXT_VERSION = 'tcpa-v1-2026-09';
export const CONSENT_PRIVACY_URL = 'https://americanmasteroofing.com/?page_id=4605';
export const CONSENT_TERMS_URL = 'https://americanmasteroofing.com/?page_id=4614';

// Logo assets (files live in public/assets/; wording above is always DOM text).
export const LOGO_OWENS_CORNING = '/assets/logo-owens-corning.png';
export const LOGO_BBB = '/assets/logo-bbb.png';
export const LOGO_GOOGLE = '/assets/logo-google.png';
export const LOGO_AMR = '/assets/logo-trim.png';
