import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchAllPages } from './dataPaging.js';

test('fetchAllPages returns rows from every full and partial page', async () => {
  const requests = [];
  const rows = await fetchAllPages(async (offset, pageSize) => {
    requests.push([offset, pageSize]);
    const allRows = [1, 2, 3, 4, 5];
    return { data: allRows.slice(offset, offset + pageSize), error: null };
  }, 2);

  assert.deepEqual(rows, [1, 2, 3, 4, 5]);
  assert.deepEqual(requests, [[0, 2], [2, 2], [4, 2]]);
});

test('fetchAllPages requests an empty page when the row count is an exact multiple', async () => {
  const offsets = [];
  const rows = await fetchAllPages(async (offset) => {
    offsets.push(offset);
    return { data: offset === 0 ? [1, 2] : [], error: null };
  }, 2);

  assert.deepEqual(rows, [1, 2]);
  assert.deepEqual(offsets, [0, 2]);
});

test('fetchAllPages continues when the API truncates pages below the requested size', async () => {
  const offsets = [];
  const allRows = [1, 2, 3, 4, 5];
  const rows = await fetchAllPages(async (offset) => {
    offsets.push(offset);
    return { data: allRows.slice(offset, offset + 2), count: allRows.length, error: null };
  }, 4);

  assert.deepEqual(rows, allRows);
  assert.deepEqual(offsets, [0, 2, 4]);
});

test('fetchAllPages propagates query errors', async () => {
  await assert.rejects(
    fetchAllPages(async () => ({ data: null, error: new Error('query failed') })),
    /query failed/
  );
});