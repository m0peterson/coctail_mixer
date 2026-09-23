import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog } from '../public/js/core/catalog.js';
import {
  evaluate, resolveLine, missingCount, suggestPurchases, shoppingBasket, groupByMissing, fixOptions,
} from '../public/js/core/matching.js';

const catalog = buildCatalog();
const { byId } = catalog;
const get = (id) => catalog.cocktailById[id];
const bar = (...ids) => new Set(ids);

test('всё есть — коктейль готов', () => {
  const ev = evaluate(get('negroni'), bar('gin', 'campari', 'sweet_vermouth'), byId);
  assert.equal(ev.ready, true);
  assert.equal(ev.missingCount, 0);
});

test('не хватает одного — видно, чего именно', () => {
  const ev = evaluate(get('negroni'), bar('gin', 'campari'), byId);
  assert.equal(ev.missingCount, 1);
  assert.equal(ev.missing[0].line.id, 'sweet_vermouth');
});

test('сахарный сироп можно сделать из сахара', () => {
  const r = resolveLine({ id: 'syrup', amount: 15, unit: 'ml' }, bar('sugar'), byId);
  assert.equal(r.status, 'make');
  assert.ok(evaluate(get('daiquiri'), bar('rum_white', 'lime', 'sugar'), byId).ready);
});

test('общая замена: золотой ром вместо белого', () => {
  const ev = evaluate(get('daiquiri'), bar('rum_gold', 'lime', 'syrup'), byId);
  assert.ok(ev.ready);
  const rum = ev.lines.find((r) => r.line.id === 'rum_white');
  assert.equal(rum.status, 'sub');
  assert.deepEqual(rum.via, ['rum_gold']);
});

test('замена по рецепту: водка в Кайпиринье', () => {
  const ev = evaluate(get('caipirinha'), bar('vodka', 'lime', 'sugar'), byId);
  assert.ok(ev.ready);
  assert.equal(ev.lines.find((r) => r.line.id === 'cachaca').kind, 'alt');
});

test('составная замена: грейпфрутовый сок + содовая вместо газировки', () => {
  const ev = evaluate(get('paloma'), bar('tequila', 'lime', 'grapefruit_juice', 'soda'), byId);
  assert.ok(ev.ready);
});

test('опциональное не блокирует, вода есть всегда', () => {
  assert.ok(evaluate(get('gin_tonic'), bar('gin', 'tonic'), byId).ready, 'лайм по желанию');
  assert.ok(evaluate(get('hot_toddy'), bar('scotch', 'honey', 'lemon'), byId).ready, 'вода не нужна в баре');
});

test('strict отключает общие замены', () => {
  const line = { id: 'rum_white', amount: 50, unit: 'ml', strict: true };
  assert.equal(resolveLine(line, bar('rum_gold'), byId).status, 'missing');
});

test('fixOptions перечисляет одиночные варианты', () => {
  const line = { id: 'cachaca', amount: 60, unit: 'ml', alts: ['vodka', 'rum_white'] };
  assert.deepEqual(fixOptions(line, byId), ['cachaca', 'vodka', 'rum_white']);
});

test('группы по недостающим', () => {
  const g = groupByMissing(catalog.cocktails, bar('gin', 'tonic', 'campari', 'sweet_vermouth'), byId);
  const ids = g.ready.map((x) => x.cocktail.id);
  assert.ok(ids.includes('gin_tonic'));
  assert.ok(ids.includes('negroni'));
  assert.equal(g.ready.length + g.one.length + g.two.length + g.more.length, catalog.cocktails.length);
});

test('покупки: Кампари открывает Негрони, Американо и Бульвардье', () => {
  const owned = bar('gin', 'bourbon', 'sweet_vermouth', 'soda');
  const top = suggestPurchases(catalog, owned, { limit: 50 });
  const campari = top.find((s) => s.ingredient.id === 'campari');
  assert.ok(campari, 'Кампари должен быть в подсказках');
  const unlocked = campari.unlocks.map((c) => c.id);
  for (const id of ['negroni', 'americano', 'boulevardier']) assert.ok(unlocked.includes(id), `нет ${id}`);
  // Подсказки отсортированы по числу открываемых коктейлей
  for (let i = 1; i < top.length; i++) assert.ok(top[i - 1].unlocks.length >= top[i].unlocks.length);
});

test('корзина: каждая покупка что-то открывает, без повторов', () => {
  const owned = bar('vodka', 'gin', 'lime', 'lemon', 'sugar');
  const basket = shoppingBasket(catalog, owned, 3);
  assert.ok(basket.length >= 1);
  const ids = basket.map((s) => s.ingredient.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const step of basket) assert.ok(step.unlocks.length > 0);
  const after = new Set([...owned, ...ids]);
  for (const step of basket) for (const c of step.unlocks) assert.equal(missingCount(c, after, byId), 0);
});

test('пустой бар: ничего не готово, подсказки не падают', () => {
  const g = groupByMissing(catalog.cocktails, bar(), byId);
  assert.equal(g.ready.length, 0);
  assert.doesNotThrow(() => suggestPurchases(catalog, bar()));
});
