import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INGREDIENTS, CATEGORIES, FAMILIES } from '../public/js/data/ingredients.js';
import { COCKTAILS } from '../public/js/data/cocktails.js';
import { TAGS, METHODS, GLASSES, TECHNIQUES } from '../public/js/core/labels.js';

const ingIds = new Set(INGREDIENTS.map((i) => i.id));
const catIds = new Set(CATEGORIES.map((c) => c.id));
const famIds = new Set(FAMILIES.map((f) => f.id));
const UNITS = new Set(['ml', 'dash', 'drop', 'bsp', 'tsp', 'tbsp', 'pcs', 'leaf', 'wedge', 'slice', 'stick', 'pinch', 'top', 'rinse']);
const LINE_OPTS = new Set(['optional', 'alts', 'altNote', 'strict', 'ml', 'note', 'side']);

const combos = (list = []) => list.map((x) => (Array.isArray(x) ? x : [x]));

test('ингредиенты: уникальные id и корректные поля', () => {
  assert.equal(ingIds.size, INGREDIENTS.length, 'дубликаты id ингредиентов');
  for (const ing of INGREDIENTS) {
    assert.ok(ing.name, `${ing.id}: нет названия`);
    assert.ok(catIds.has(ing.cat), `${ing.id}: неизвестная категория ${ing.cat}`);
    if (ing.family) assert.ok(famIds.has(ing.family), `${ing.id}: неизвестное семейство`);
    if (ing.abv != null) assert.ok(ing.abv > 0 && ing.abv <= 75, `${ing.id}: странная крепость`);
    if (!ing.always) assert.ok([1, 2, 3].includes(ing.rarity), `${ing.id}: rarity 1–3`);
    for (const combo of combos(ing.subs)) {
      for (const id of combo) assert.ok(ingIds.has(id), `${ing.id}: замена ${id} не существует`);
      assert.ok(!combo.includes(ing.id), `${ing.id}: заменяет сам себя`);
    }
    if (ing.make) {
      assert.ok(ing.make.how, `${ing.id}: нет инструкции make.how`);
      for (const id of ing.make.from) assert.ok(ingIds.has(id), `${ing.id}: make.from ${id} не существует`);
    }
  }
});

test('коктейли: уникальные id и полные карточки', () => {
  const ids = new Set(COCKTAILS.map((c) => c.id));
  assert.equal(ids.size, COCKTAILS.length, 'дубликаты id коктейлей');
  assert.ok(COCKTAILS.length >= 80, 'в базе должно быть хотя бы 80 коктейлей');
  for (const c of COCKTAILS) {
    const at = `коктейль ${c.id}`;
    for (const field of ['name', 'en', 'desc', 'garnish']) assert.ok(c[field], `${at}: нет ${field}`);
    assert.ok(METHODS[c.method], `${at}: неизвестный метод ${c.method}`);
    assert.ok(GLASSES[c.glass], `${at}: неизвестный бокал ${c.glass}`);
    assert.ok(Array.isArray(c.steps) && c.steps.length >= 1, `${at}: нет шагов`);
    assert.ok(Number.isInteger(c.wow) && c.wow >= 1 && c.wow <= 5, `${at}: wow 1–5`);
    assert.ok(Number.isInteger(c.drink) && c.drink >= 1 && c.drink <= 5, `${at}: drink 1–5`);
    assert.equal(c.t.length, 3, `${at}: t = [сладость, кислота, горечь]`);
    for (const v of c.t) assert.ok(Number.isInteger(v) && v >= 0 && v <= 3, `${at}: вкус 0–3`);
    for (const tag of c.tags) assert.ok(TAGS[tag], `${at}: неизвестный тег ${tag}`);
    for (const f of c.flags || []) assert.ok(TECHNIQUES[f], `${at}: неизвестный флаг ${f}`);

    assert.ok(c.lines.length >= 1, `${at}: пустой рецепт`);
    const seen = new Set();
    for (const [id, amount, unit = 'ml', opts = {}] of c.lines) {
      assert.ok(ingIds.has(id), `${at}: ингредиент ${id} не существует`);
      assert.ok(!seen.has(id), `${at}: ${id} указан дважды`);
      seen.add(id);
      assert.ok(typeof amount === 'number' && amount > 0, `${at}: ${id} количество`);
      assert.ok(UNITS.has(unit), `${at}: ${id} неизвестная единица ${unit}`);
      for (const k of Object.keys(opts)) assert.ok(LINE_OPTS.has(k), `${at}: ${id} неизвестная опция ${k}`);
      for (const combo of combos(opts.alts)) {
        for (const alt of combo) assert.ok(ingIds.has(alt), `${at}: альтернатива ${alt} не существует`);
      }
      if (opts.altNote) assert.ok(opts.alts, `${at}: altNote без alts`);
    }
    assert.ok(c.lines.some(([, , , o = {}]) => !o.optional), `${at}: нет обязательных ингредиентов`);
  }
});

test('каждый ингредиент из бара где-то используется', () => {
  const used = new Set();
  for (const c of COCKTAILS) {
    for (const [id, , , opts = {}] of c.lines) {
      used.add(id);
      for (const combo of combos(opts.alts)) combo.forEach((x) => used.add(x));
    }
  }
  for (const ing of INGREDIENTS) {
    if (ing.always) continue;
    // Сырьё для домашних сиропов и замен считается использованным
    const feeds = INGREDIENTS.some((o) => o.make?.from.includes(ing.id) || combos(o.subs).some((cb) => cb.includes(ing.id)));
    assert.ok(used.has(ing.id) || feeds, `ингредиент ${ing.id} нигде не нужен`);
  }
});

test('пресеты бара ссылаются на существующие ингредиенты', async () => {
  const { PRESETS } = await import('../public/js/ui/views/bar.js');
  for (const p of PRESETS) {
    for (const id of p.ids) assert.ok(ingIds.has(id), `пресет ${p.id}: нет ингредиента ${id}`);
  }
});
