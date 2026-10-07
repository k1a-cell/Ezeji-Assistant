import assert from 'node:assert/strict';
import test from 'node:test';
import { hasActivePremiumPlan } from './planAccess.js';

test('active Professional and Business subscriptions enable premium tools', () => {
  assert.equal(hasActivePremiumPlan({ plan: 'Professional', paymentStatus: 'active' }), true);
  assert.equal(hasActivePremiumPlan({ plan: 'Business', payment_status: 'active' }), true);
});

test('trial, pending, inactive, and Starter accounts do not enable premium tools', () => {
  assert.equal(hasActivePremiumPlan({ plan: 'Professional', paymentStatus: 'trial' }), false);
  assert.equal(hasActivePremiumPlan({ plan: 'Professional', paymentStatus: 'pending' }), false);
  assert.equal(hasActivePremiumPlan({ plan: 'Professional', paymentStatus: 'inactive' }), false);
  assert.equal(hasActivePremiumPlan({ plan: 'Starter', paymentStatus: 'active' }), false);
});