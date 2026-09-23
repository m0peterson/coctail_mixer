// Вычисляемые характеристики коктейля: крепость, лёгкость приготовления, тиры.

import { STRONG_FAMILIES } from '../data/ingredients.js';

// Сколько мл жидкости в одной единице
const UNIT_ML = { ml: 1, top: 1, dash: 0.8, drop: 0.05, bsp: 5, tsp: 5, tbsp: 15, rinse: 1 };

/** Нормализует строку рецепта из кортежа в объект. */
export function normalizeLine([id, amount, unit = 'ml', opts = {}]) {
  return { id, amount, unit, ...opts };
}

/** Объём строки рецепта в мл (для оценки крепости). */
export function lineVolume(line, ing) {
  if (line.ml != null) return line.ml;
  if (ing?.solid) return 0;
  if (UNIT_ML[line.unit] != null) return line.amount * UNIT_ML[line.unit];
  if (line.unit === 'pcs' && ing?.mlPerPcs) return line.amount * ing.mlPerPcs;
  return 0;
}

const stirred = (x) => -1.21 * x * x + 1.246 * x + 0.145;

/**
 * Доля воды от таяния льда. Для шейка и стира используется зависимость от
 * начальной крепости (крепкие смеси растапливают больше льда): формула для стира
 * из «Liquid Intelligence» Дэйва Арнольда, для шейка линейное приближение
 * к его же замерам. Это оценка, а не лабораторные данные.
 */
export function dilution(method, x, flags = []) {
  switch (method) {
    case 'shake': return 0.2 + 1.4 * x;
    case 'stir': return stirred(x);
    case 'blend': return 0.8;
    // В бокале: высокие коктейли почти не разбавляются, спиртовые на льду тают сильнее
    case 'build': return Math.max(flags.includes('crushed') ? 0.35 : 0.12, 0.6 * stirred(x));
    default: return 0; // layer, hot
  }
}

// Одна стопка водки: 50 мл × 40% = 20 мл спирта
export const SHOT_ETHANOL_ML = 20;

/** Крепость готового напитка и количество спирта. */
export function computeStrength(cocktail, byId) {
  let baseVol = 0, baseAlc = 0, topVol = 0, topAlc = 0;
  for (const line of cocktail.lines) {
    if (line.optional) continue;
    const ing = byId[line.id];
    const vol = lineVolume(line, ing);
    const alc = vol * (ing?.abv || 0) / 100;
    if (line.unit === 'top' || line.side) { topVol += vol; topAlc += alc; } else { baseVol += vol; baseAlc += alc; }
  }
  const total = baseVol + topVol;
  if (total === 0) return { abv: 0, ethanolMl: 0, volumeMl: 0 };

  let water = 0;
  if (!cocktail.noIce) {
    // В «билде» лёд тает во всём объёме, в остальных методах разбавляется только взбиваемая часть
    if (cocktail.method === 'build') {
      water = dilution('build', (baseAlc + topAlc) / total, cocktail.flags) * total;
    } else {
      water = dilution(cocktail.method, baseVol ? baseAlc / baseVol : 0, cocktail.flags) * baseVol;
    }
  }
  const ethanolMl = baseAlc + topAlc;
  const volumeMl = total + water;
  return { abv: ethanolMl / volumeMl, ethanolMl, volumeMl };
}

export const STRENGTH_LEVELS = [
  { id: 'zero', name: 'Безалкогольный', short: 'б/а', max: 0.005 },
  { id: 'light', name: 'Лёгкий', short: 'лёгкий', max: 0.09 },
  { id: 'medium', name: 'Средний', short: 'средний', max: 0.16 },
  { id: 'strong', name: 'Крепкий', short: 'крепкий', max: 0.22 },
  { id: 'brutal', name: 'Убойный', short: 'убойный', max: Infinity },
];

export function strengthLevel(abv) {
  const idx = STRENGTH_LEVELS.findIndex((l) => abv < l.max);
  return { ...STRENGTH_LEVELS[idx], index: idx };
}

// ── Лёгкость приготовления ─────────────────────────────────────

export const METHOD_EFFORT = { build: 0, stir: 1, shake: 1, blend: 1.5, layer: 2, hot: 1 };
export const FLAG_EFFORT = {
  muddle: 0.3, crushed: 0.3, eggwhite: 0.8, rinse: 0.5, float: 0.4,
  rim: 0.3, longshake: 1.5, whip: 0.6, espresso: 0.4,
};
export const PER_EXTRA_INGREDIENT = 0.4;

/**
 * Очки возни: метод + доп. техники + домашние заготовки + число ингредиентов сверх двух.
 * Лёгкость = 5 − очки, от 1 до 5.
 */
export function computeEase(cocktail, byId) {
  const required = cocktail.lines.filter((l) => !l.optional && !byId[l.id]?.always);
  let points = METHOD_EFFORT[cocktail.method] ?? 1;
  for (const f of cocktail.flags || []) points += FLAG_EFFORT[f] ?? 0;
  for (const l of required) points += byId[l.id]?.effort ?? 0;
  points += Math.max(0, required.length - 2) * PER_EXTRA_INGREDIENT;
  const ease = Math.min(5, Math.max(1, 5 - points));
  return { ease: Math.round(ease * 10) / 10, effortPoints: points };
}

// ── Тиры ───────────────────────────────────────────────────────

export const TIERS = [
  { id: 'S', min: 4.5 },
  { id: 'A', min: 3.5 },
  { id: 'B', min: 2.5 },
  { id: 'C', min: 1.5 },
  { id: 'D', min: -Infinity },
];

export function tierOf(score) {
  return TIERS.find((t) => score >= t.min).id;
}

/** Общий балл: вес w для лёгкости, 1 − w для необычности. */
export function comboScore(c, w = 0.5) {
  return w * c.ease + (1 - w) * c.wow;
}

// Доли тиров для рейтинга по месту: S — лучшие 10%, A — следующие 20% и т. д.
export const RANK_SHARES = [['S', 0.1], ['A', 0.2], ['B', 0.35], ['C', 0.2], ['D', 0.15]];

/**
 * Тиры по месту в рейтинге. Среднее двух оценок сжимается к середине шкалы,
 * поэтому для комбо абсолютные пороги дают почти всех в B; распределение по долям честнее.
 * Возвращает функцию score → тир. Одинаковые баллы всегда попадают в один тир.
 */
export function rankTiers(scores) {
  const sorted = [...scores].sort((a, b) => b - a);
  const cuts = [];
  let acc = 0;
  for (const [id, share] of RANK_SHARES.slice(0, -1)) {
    acc += share;
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.round(sorted.length * acc) - 1));
    cuts.push([id, sorted[idx]]);
  }
  return (score) => (cuts.find(([, min]) => score >= min - 1e-9) || ['D'])[0];
}

// ── Основа и семейства ─────────────────────────────────────────

/** Семейства алкоголя в коктейле с объёмами (только обязательные строки). */
export function familyVolumes(cocktail, byId) {
  const vols = {};
  for (const line of cocktail.lines) {
    if (line.optional) continue;
    const ing = byId[line.id];
    if (!ing?.family) continue;
    vols[ing.family] = (vols[ing.family] || 0) + lineVolume(line, ing);
  }
  return vols;
}

/**
 * Основа: самый объёмный крепкий алкоголь. Если крепкого нет — аперитив или ликёр
 * от 15 мл (Апероль в шприце важнее игристого), иначе самый объёмный любой.
 */
export function baseFamily(vols) {
  const pick = (families, minMl = 0) => {
    let best = null;
    for (const f of families) if (vols[f] >= minMl && vols[f] > 0 && (!best || vols[f] > vols[best])) best = f;
    return best;
  };
  return pick(STRONG_FAMILIES) || pick(['aperitif', 'liqueur'], 15) || pick(Object.keys(vols)) || 'none';
}
