// Собирает каталог: индексы ингредиентов и коктейли с вычисленными метриками.

import { INGREDIENTS, CATEGORIES, FAMILIES } from '../data/ingredients.js';
import { COCKTAILS } from '../data/cocktails.js';
import {
  normalizeLine, computeStrength, strengthLevel, computeEase, tierOf,
  familyVolumes, baseFamily, SHOT_ETHANOL_ML,
} from './metrics.js';

export function buildCatalog(ingredients = INGREDIENTS, cocktails = COCKTAILS) {
  const byId = Object.fromEntries(ingredients.map((i) => [i.id, i]));

  const list = cocktails.map((raw) => {
    const c = { flags: [], ...raw, lines: raw.lines.map(normalizeLine) };
    const { abv, ethanolMl, volumeMl } = computeStrength(c, byId);
    const { ease, effortPoints } = computeEase(c, byId);
    const vols = familyVolumes(c, byId);
    const strength = strengthLevel(abv);
    const enriched = {
      ...c,
      abv,
      ethanolMl,
      volumeMl,
      shots: ethanolMl / SHOT_ETHANOL_ML,
      strength,
      ease,
      effortPoints,
      easeTier: tierOf(ease),
      wowTier: tierOf(c.wow),
      families: Object.keys(vols),
      familyVolumes: vols,
      base: baseFamily(vols),
      sweet: c.t[0],
      sour: c.t[1],
      bitter: c.t[2],
      // Коварный: пьётся легко, а спирта много
      sneaky: c.drink >= 4 && (ethanolMl >= 25 || abv >= 0.16),
      requiredIds: c.lines.filter((l) => !l.optional && !byId[l.id]?.always).map((l) => l.id),
    };
    enriched.search = [c.name, c.en, ...c.lines.map((l) => byId[l.id]?.name || '')].join(' ').toLowerCase();
    return enriched;
  });

  const cocktailById = Object.fromEntries(list.map((c) => [c.id, c]));

  // Сколько коктейлей использует каждый ингредиент (для сортировки и подсказок)
  const usage = {};
  for (const c of list) for (const id of new Set(c.requiredIds)) usage[id] = (usage[id] || 0) + 1;

  return {
    ingredients,
    byId,
    categories: CATEGORIES,
    families: FAMILIES,
    familyById: Object.fromEntries(FAMILIES.map((f) => [f.id, f])),
    cocktails: list,
    cocktailById,
    usage,
  };
}
