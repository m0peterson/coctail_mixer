import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog } from '../public/js/core/catalog.js';
import { tierOf, comboScore, dilution } from '../public/js/core/metrics.js';

const catalog = buildCatalog();
const get = (id) => catalog.cocktailById[id];

test('крепость в правдоподобных пределах', () => {
  for (const c of catalog.cocktails) {
    if (c.strength.id === 'zero') {
      assert.equal(c.abv, 0, `${c.id}: безалкогольный с градусом`);
      continue;
    }
    assert.ok(c.abv > 0.03 && c.abv < 0.36, `${c.id}: ${(c.abv * 100).toFixed(1)}% вне 3–36%`);
    assert.ok(c.ethanolMl > 5 && c.ethanolMl < 70, `${c.id}: ${c.ethanolMl} мл спирта`);
  }
});

test('известные коктейли попадают в ожидаемую крепость', () => {
  // Ориентиры из замеров Дэйва Арнольда и типичных оценок барменов, ±3%
  const expect = { dry_martini: 0.26, manhattan: 0.27, negroni: 0.2, daiquiri: 0.155, gin_tonic: 0.09, aperol_spritz: 0.08, mojito: 0.1 };
  for (const [id, abv] of Object.entries(expect)) {
    assert.ok(Math.abs(get(id).abv - abv) < 0.03, `${id}: ${(get(id).abv * 100).toFixed(1)}%, ждали ≈${abv * 100}%`);
  }
  assert.equal(get('dry_martini').strength.id, 'brutal');
  assert.equal(get('aperol_spritz').strength.id, 'light');
  assert.equal(get('virgin_mojito').strength.id, 'zero');
});

test('Зомби: почти три стопки водки по спирту и метка «коварный»', () => {
  const z = get('zombie');
  assert.ok(z.shots > 2.5 && z.shots < 3.2, `стопок: ${z.shots}`);
  assert.ok(z.sneaky);
});

test('разбавление растёт с крепостью смеси', () => {
  assert.ok(dilution('stir', 0.35) > dilution('stir', 0.2));
  assert.ok(dilution('shake', 0.3) > dilution('stir', 0.3), 'шейк разбавляет сильнее стира');
  assert.equal(dilution('layer', 0.3), 0);
});

test('лёгкость: простые хайболы выше тики-монстров', () => {
  assert.equal(get('gin_tonic').easeTier, 'S');
  assert.equal(get('mimosa').easeTier, 'S');
  assert.equal(get('ramos_gin_fizz').easeTier, 'D');
  assert.equal(get('zombie').easeTier, 'D');
  assert.ok(get('daiquiri').ease > get('clover_club').ease, 'белок усложняет');
  assert.ok(get('cuba_libre').ease > get('mojito').ease, 'мадлинг и колотый лёд усложняют');
  for (const c of catalog.cocktails) assert.ok(c.ease >= 1 && c.ease <= 5, `${c.id}: ease ${c.ease}`);
});

test('все тиры заполнены', () => {
  for (const key of ['easeTier', 'wowTier']) {
    const seen = new Set(catalog.cocktails.map((c) => c[key]));
    for (const t of ['S', 'A', 'B', 'C', 'D']) assert.ok(seen.has(t), `${key}: пустой тир ${t}`);
  }
});

test('tierOf и comboScore', () => {
  assert.equal(tierOf(5), 'S');
  assert.equal(tierOf(4.5), 'S');
  assert.equal(tierOf(4.49), 'A');
  assert.equal(tierOf(1), 'D');
  const c = { ease: 5, wow: 1 };
  assert.equal(comboScore(c, 1), 5);
  assert.equal(comboScore(c, 0), 1);
  assert.equal(comboScore(c, 0.5), 3);
});

test('основа коктейля', () => {
  assert.equal(get('negroni').base, 'gin');
  assert.equal(get('aperol_spritz').base, 'aperitif', 'Апероль важнее игристого');
  assert.equal(get('kir').base, 'wine', '10 мл ликёра не делают его основой');
  assert.equal(get('michelada').base, 'beer');
  assert.equal(get('shirley_temple').base, 'none');
});
