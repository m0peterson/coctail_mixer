import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plural, count, num, formatAmount } from '../public/js/core/format.js';

const F = ['коктейль', 'коктейля', 'коктейлей'];

test('склонения', () => {
  assert.equal(count(1, F), '1 коктейль');
  assert.equal(count(2, F), '2 коктейля');
  assert.equal(count(5, F), '5 коктейлей');
  assert.equal(count(11, F), '11 коктейлей');
  assert.equal(count(12, F), '12 коктейлей');
  assert.equal(count(21, F), '21 коктейль');
  assert.equal(count(22, F), '22 коктейля');
  assert.equal(count(111, F), '111 коктейлей');
  assert.equal(plural(1.5, F), 'коктейля');
});

test('числа по-русски', () => {
  assert.equal(num(7.5), '7,5');
  assert.equal(num(60), '60');
  assert.equal(num(0.5, { fractions: true }), '½');
  assert.equal(num(1.5, { fractions: true }), '1½');
});

test('количества в рецепте', () => {
  assert.equal(formatAmount(50), '50 мл');
  assert.equal(formatAmount(22.5, 'ml'), '22,5 мл');
  assert.equal(formatAmount(50, 'ml', 3), '150 мл');
  assert.equal(formatAmount(2, 'dash'), '2 дэша');
  assert.equal(formatAmount(5, 'dash'), '5 дэшей');
  assert.equal(formatAmount(1, 'bsp'), '1 бар. ложка');
  assert.equal(formatAmount(8, 'leaf'), '8 листьев');
  assert.equal(formatAmount(0.5, 'pcs'), '½ шт.');
  assert.equal(formatAmount(150, 'top'), 'долить ~150 мл');
  assert.equal(formatAmount(1, 'rinse'), 'ополоснуть бокал');
  assert.equal(formatAmount(1, 'pinch', 2), '2 щепотки');
});
