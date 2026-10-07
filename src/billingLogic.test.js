import test from 'node:test';
import assert from 'node:assert/strict';
import { getPlanDetails } from './billingLogic.js';

test('yearly billing returns annual amount and yearly label', () => {
  const details = getPlanDetails('Professional', 'USD', 'yearly');

  assert.equal(details.amountDue, 790);
  assert.equal(details.billingPeriod, 'yearly');
  assert.equal(details.periodLabel, 'billed yearly');
});

test('monthly billing returns the base monthly amount', () => {
  const details = getPlanDetails('Starter', 'USD', 'monthly');

  assert.equal(details.amountDue, 29);
  assert.equal(details.billingPeriod, 'monthly');
  assert.equal(details.periodLabel, 'billed monthly');
});

test('supports additional currencies with localized prices', () => {
  const ghs = getPlanDetails('Professional', 'GHS', 'monthly');
  const kes = getPlanDetails('Professional', 'KES', 'monthly');
  const zar = getPlanDetails('Professional', 'ZAR', 'monthly');

  assert.equal(ghs.amountDue, 1264);
  assert.equal(ghs.displayPrice, 'GH₵1,264');
  assert.equal(kes.amountDue, 12640);
  assert.equal(kes.displayPrice, 'KSh12,640');
  assert.equal(zar.amountDue, 1422);
  assert.equal(zar.displayPrice, 'R1,422');
});
