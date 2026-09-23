// Что можно приготовить из имеющегося бара и что стоит докупить.

const toCombo = (x) => (Array.isArray(x) ? x : [x]);

export function isOwned(id, owned, byId) {
  const ing = byId[id];
  return !!ing && (ing.always || owned.has(id));
}

export function canMake(id, owned, byId) {
  const make = byId[id]?.make;
  return !!make && make.from.every((x) => isOwned(x, owned, byId));
}

function comboAvailable(combo, owned, byId) {
  return combo.every((x) => isOwned(x, owned, byId) || canMake(x, owned, byId));
}

/**
 * Статус строки рецепта:
 *   have    — есть
 *   make    — можно сделать самому (сахарный сироп из сахара)
 *   sub     — есть замена (kind: 'alt' — по рецепту, 'sub' — общая)
 *   missing — нет
 */
export function resolveLine(line, owned, byId) {
  if (isOwned(line.id, owned, byId)) return { status: 'have' };
  if (canMake(line.id, owned, byId)) return { status: 'make', via: byId[line.id].make.from };
  for (const alt of line.alts || []) {
    const combo = toCombo(alt);
    if (comboAvailable(combo, owned, byId)) return { status: 'sub', kind: 'alt', via: combo };
  }
  if (!line.strict) {
    for (const sub of byId[line.id]?.subs || []) {
      const combo = toCombo(sub);
      if (comboAvailable(combo, owned, byId)) return { status: 'sub', kind: 'sub', via: combo };
    }
  }
  return { status: 'missing' };
}

/** Быстрый подсчёт недостающих обязательных строк. */
export function missingCount(cocktail, owned, byId) {
  let n = 0;
  for (const line of cocktail.lines) {
    if (line.optional) continue;
    if (resolveLine(line, owned, byId).status === 'missing') n++;
  }
  return n;
}

/** Полная оценка коктейля относительно бара. */
export function evaluate(cocktail, owned, byId) {
  const lines = cocktail.lines.map((line) => ({ line, ...resolveLine(line, owned, byId) }));
  const required = lines.filter((r) => !r.line.optional);
  const missing = required.filter((r) => r.status === 'missing');
  return {
    lines,
    missing,
    missingCount: missing.length,
    subs: required.filter((r) => r.status === 'sub').length,
    makes: required.filter((r) => r.status === 'make').length,
    ready: missing.length === 0,
  };
}

/** Одиночные ингредиенты, любой из которых закрывает строку рецепта. */
export function fixOptions(line, byId) {
  const ids = [line.id];
  for (const alt of line.alts || []) if (!Array.isArray(alt)) ids.push(alt);
  if (!line.strict) for (const sub of byId[line.id]?.subs || []) if (!Array.isArray(sub)) ids.push(sub);
  return [...new Set(ids)];
}

/** Разбивает коктейли по числу недостающих ингредиентов. */
export function groupByMissing(cocktails, owned, byId) {
  const groups = { ready: [], one: [], two: [], more: [] };
  for (const c of cocktails) {
    const ev = evaluate(c, owned, byId);
    const item = { cocktail: c, ev };
    if (ev.missingCount === 0) groups.ready.push(item);
    else if (ev.missingCount === 1) groups.one.push(item);
    else if (ev.missingCount === 2) groups.two.push(item);
    else groups.more.push(item);
  }
  return groups;
}

/**
 * Какие покупки откроют больше всего коктейлей.
 * unlocks — станут доступны сразу, closer — останется докупить всего один ингредиент.
 */
export function suggestPurchases(catalog, owned, { limit = 8 } = {}) {
  const { cocktails, ingredients, byId } = catalog;
  const baseline = new Map(cocktails.map((c) => [c.id, missingCount(c, owned, byId)]));
  const results = [];
  for (const ing of ingredients) {
    if (ing.always || ing.hidden || owned.has(ing.id)) continue;
    const trial = new Set(owned).add(ing.id);
    const unlocks = [];
    const closer = [];
    for (const c of cocktails) {
      const before = baseline.get(c.id);
      if (before === 0) continue;
      const after = missingCount(c, trial, byId);
      if (after === 0) unlocks.push(c);
      else if (after === 1 && before > 1) closer.push(c);
    }
    if (unlocks.length || closer.length) results.push({ ingredient: ing, unlocks, closer });
  }
  results.sort((a, b) =>
    b.unlocks.length - a.unlocks.length
    || b.closer.length - a.closer.length
    || (a.ingredient.rarity || 1) - (b.ingredient.rarity || 1));
  return results.slice(0, limit);
}

/** Жадная корзина: по очереди добавляем самую полезную покупку. */
export function shoppingBasket(catalog, owned, size = 3) {
  const current = new Set(owned);
  const steps = [];
  for (let k = 0; k < size; k++) {
    const [best] = suggestPurchases(catalog, current, { limit: 1 });
    if (!best || best.unlocks.length === 0) break;
    current.add(best.ingredient.id);
    steps.push({ ingredient: best.ingredient, unlocks: best.unlocks });
  }
  return steps;
}
