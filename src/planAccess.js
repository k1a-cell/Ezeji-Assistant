const PREMIUM_PLANS = new Set(['Professional', 'Business']);

export function hasActivePremiumPlan(account) {
  const paymentStatus = account?.paymentStatus ?? account?.payment_status;
  return paymentStatus === 'active' && PREMIUM_PLANS.has(account?.plan);
}