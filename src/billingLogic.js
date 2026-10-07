export function validateCardNumber(value) {
  const digits = `${value || ''}`.replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function validateExpiry(value) {
  const match = `${value || ''}`.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
}

export function validateCvc(value) {
  return /^\d{3,4}$/.test(`${value || ''}`.replace(/\D/g, ''));
}

// Priced directly in Naira - fair, round numbers in the spirit of ChatGPT
// Plus's pricing, not derived from a USD figure via an exchange rate.
// Yearly = 10x monthly (2 months free).
//
// These numbers MUST match two other places exactly, or what the customer
// sees won't match what they're charged:
//   - the `plans` array in the Pricing component, NightlineLanding.jsx
//   - PRICE_MAP_NGN_KOBO in server.js (same amounts, in kobo = naira * 100)
const PLAN_MAP = {
  '14-day trial': { monthlyNgn: 0, yearlyNgn: 0, isTrial: true, trialDays: 14 },
  Starter: { monthlyNgn: 15000, yearlyNgn: 150000, isTrial: false, trialDays: 0 },
  Professional: { monthlyNgn: 35000, yearlyNgn: 350000, isTrial: false, trialDays: 0 },
  Business: { monthlyNgn: 75000, yearlyNgn: 750000, isTrial: false, trialDays: 0 },
};

// `currency` is kept as a parameter for call-site compatibility, but the
// product is NGN-only (the connected Paystack account can only actually
// settle Naira), so this always prices and formats in NGN regardless of
// what's passed in.
export function getPlanDetails(plan, currency = 'NGN', billingPeriod = 'monthly') {
  const normalized = plan === 'Free trial' ? '14-day trial' : plan;
  const base = PLAN_MAP[normalized] || PLAN_MAP.Starter;
  const normalizedBillingPeriod = billingPeriod === 'yearly' ? 'yearly' : 'monthly';
  const amountDue = normalizedBillingPeriod === 'yearly' ? base.yearlyNgn : base.monthlyNgn;

  const displayPrice = amountDue === 0 ? 'NGN 0' : `NGN ${amountDue.toLocaleString('en-US')}`;
  const periodLabel = normalizedBillingPeriod === 'yearly' ? 'billed yearly' : 'billed monthly';

  return {
    name: normalized,
    monthlyNgn: base.monthlyNgn,
    yearlyNgn: base.yearlyNgn,
    amountDue,
    isTrial: Boolean(base.isTrial),
    displayPrice,
    secondaryPrice: displayPrice,
    trialDays: base.trialDays,
    billingPeriod: normalizedBillingPeriod,
    periodLabel,
  };
}

export function getTrialEndsAt(days = 14) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}