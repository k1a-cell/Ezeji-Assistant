import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAssistantRequestPayload } from './assistantLogic.js';

test('customer chat includes the business id required for real booking creation', () => {
  const payload = buildAssistantRequestPayload('Book a haircut', { id: 'business-1' });

  assert.equal(payload.businessId, 'business-1');
});

test('dashboard preview omits the business id to prevent persistent bookings', () => {
  const payload = buildAssistantRequestPayload(
    'Book a haircut',
    { id: 'business-1' },
    [],
    {},
    { previewOnly: true }
  );

  assert.equal(payload.businessId, null);
});