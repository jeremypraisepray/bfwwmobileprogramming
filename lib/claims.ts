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

// ---- Credentials (secondary) ------------------------------------------------
export const CRED_YEARS = '25+ Years Experience';
export const CRED_SINCE = 'Roofing Houston since 1999';
export const CRED_INSURED = 'Insured & Bonded';
export const CRED_FREE = 'Free inspection, no obligation';
export const CRED_24H = 'Inspection within 24 hours';

// ---- Product & warranty ------------------------------------------------------
export const CLAIM_SHINGLES = 'Owens Corning architectural shingles with manufacturer warranty';
export const CLAIM_WARRANTY = '30-year warranty covering labor and materials, per warranty terms';

// ---- Pricing -----------------------------------------------------------------
export const PRICE_FROM = 'Roof replacement from $7,995';
export const PRICE_QUALIFIER =
  'Final pricing depends on roof size, pitch, materials, and scope of work — your written estimate is free and non-binding.';
export const CLAIM_FINANCING = '$0-down and no-interest financing options available.*';

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
