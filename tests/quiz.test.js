import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog } from '../public/js/core/catalog.js';
import { missingCount } from '../public/js/core/matching.js';
import { rankByQuiz, scoreCocktail, isQuizEmpty, QUESTIONS } from '../public/js/core/quiz.js';

const catalog = buildCatalog();
const ctxFor = (owned = new Set()) => ({
  missing: (c) => missingCount(c, owned, catalog.byId),
  familyName: (id) => catalog.familyById[id]?.name || id,
});
const rank = (answers, owned) => rankByQuiz(catalog.cocktails, answers, ctxFor(owned), 200);

test('«не пью джин» убирает всё, где есть джин', () => {
  const { results } = rank({ spirits: { gin: 'no' } });
  for (const r of results) assert.ok(!(r.cocktail.familyVolumes.gin >= 5), r.cocktail.id);
  assert.ok(!results.some((r) => r.cocktail.id === 'vesper'));
});

test('без алкоголя — только безалкогольные', () => {
  const { results } = rank({ strength: 'zero' });
  assert.ok(results.length >= 3);
  for (const r of results) assert.equal(r.cocktail.strength.id, 'zero');
});

test('дизлайк горечи исключает Негрони и Кампари-коктейли', () => {
  const { results } = rank({ dislikes: ['bitter'] });
  const ids = results.map((r) => r.cocktail.id);
  assert.ok(!ids.includes('negroni'));
  assert.ok(!ids.includes('jungle_bird'));
});

test('дизлайк белка исключает только обязательный белок', () => {
  const { results } = rank({ dislikes: ['egg'] });
  const ids = results.map((r) => r.cocktail.id);
  assert.ok(!ids.includes('clover_club'));
  assert.ok(ids.includes('whiskey_sour'), 'белок в виски сауэре по желанию');
});

test('«только из бара» с баром даёт только готовые', () => {
  const owned = new Set(['vodka', 'orange_juice', 'cranberry_juice', 'lime']);
  const { results } = rank({ bar: 'have' }, owned);
  assert.ok(results.length > 0);
  for (const r of results) assert.equal(missingCount(r.cocktail, owned, catalog.byId), 0);
});

test('крепко + горькое + вечер: наверху спиртуозные коктейли', () => {
  const { results } = rank({ strength: 'strong', likes: ['bitter'], mood: 'chill' });
  // В базе ровно три крепких горьких коктейля на вечер: они и должны быть первыми
  const top = results.slice(0, 3).map((r) => r.cocktail.id).sort();
  assert.deepEqual(top, ['boulevardier', 'hanky_panky', 'negroni']);
  for (const r of results.slice(0, 3)) assert.equal(r.match, 1);
});

test('освежиться + лениво: наверху простые хайболы', () => {
  const { results } = rank({ mood: 'refresh', effort: 'lazy', strength: 'light' });
  for (const r of results.slice(0, 5)) {
    assert.ok(r.cocktail.ease >= 4, `${r.cocktail.id}: лёгкость ${r.cocktail.ease}`);
    assert.ok(r.cocktail.tags.includes('fizzy') || r.cocktail.tags.includes('refreshing'));
  }
});

test('процент совпадения от 0 до 1, результат отсортирован', () => {
  const { results } = rank({ mood: 'party', likes: ['sweet', 'fruity'], vibe: 'classic' });
  for (let i = 0; i < results.length; i++) {
    assert.ok(results[i].match >= 0 && results[i].match <= 1);
    if (i) assert.ok(results[i - 1].score >= results[i].score);
  }
});

test('пустые ответы', () => {
  assert.ok(isQuizEmpty({}));
  assert.ok(isQuizEmpty({ mood: 'any', spirits: { gin: 'ok' } }));
  assert.ok(!isQuizEmpty({ likes: ['sour'] }));
  const r = scoreCocktail(catalog.cocktailById.negroni, {}, ctxFor());
  assert.equal(r.excluded, false);
  assert.equal(r.max, 0);
});

test('у каждого вопроса есть заголовок и варианты', () => {
  for (const q of QUESTIONS) {
    assert.ok(q.title);
    if (q.type === 'spirits') {
      for (const f of q.families) assert.ok(catalog.familyById[f], f);
    } else {
      assert.ok(q.options.length >= 2);
    }
  }
});
