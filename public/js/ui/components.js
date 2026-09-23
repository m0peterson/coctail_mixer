// Переиспользуемые куски интерфейса.

import { esc } from './dom.js';
import { num } from '../core/format.js';

export function strengthPill(c, { long = false } = {}) {
  const pct = c.strength.id === 'zero' ? '0%' : `≈${Math.round(c.abv * 100)}%`;
  const label = long ? `${c.strength.name} · ${pct}` : `${pct} ${c.strength.short}`;
  return `<span class="pill pill--st-${c.strength.id}" title="Крепость готового коктейля с учётом льда"><span class="pill__dot"></span>${esc(label)}</span>`;
}

export function drinkDots(value, label = 'Питкость') {
  const dots = Array.from({ length: 5 }, (_, i) => `<i class="${i < value ? 'on' : ''}"></i>`).join('');
  return `<span class="pill" title="${label}: ${value} из 5">${label === 'Питкость' ? 'пьётся' : esc(label)} <span class="dots">${dots}</span></span>`;
}

export function tierBadge(tier, title = '') {
  return `<span class="tier tier--${tier}" title="${esc(title)}">${tier}</span>`;
}

export function sneakyPill() {
  return '<span class="pill pill--sneaky" title="Пьётся легко, а алкоголя много">⚠ коварный</span>';
}

/** Имя ингредиента в рецепте: «Сок лайма» для цитрусов в мл. */
export function lineName(line, ing) {
  if (ing?.juiceName && line.unit === 'ml') return ing.juiceName;
  return ing?.name || line.id;
}

/** Краткий состав для карточки. */
function ingredientSummary(ev, byId) {
  return ev.lines
    .filter((r) => !r.line.optional && !byId[r.line.id]?.always)
    .map((r) => {
      const name = esc(lineName(r.line, byId[r.line.id]));
      if (r.status === 'missing') return `<span class="ing--missing">${name}</span>`;
      if (r.status === 'sub') return `<span class="ing--sub" title="Замена: ${esc(r.via.map((id) => byId[id].name).join(' + '))}">${name}*</span>`;
      return name;
    })
    .join(' · ');
}

/**
 * Карточка коктейля. Это ссылка: открывает рецепт через адресную строку,
 * поэтому работают «назад» и отправка ссылки на конкретный рецепт.
 */
export function cocktailCard(c, ev, ctx, { match = null, reasons = null } = {}) {
  const { byId, familyById } = ctx.catalog;
  const base = c.base === 'none' ? 'без алкоголя' : familyById[c.base]?.name.toLowerCase();
  const need = !ev.ready
    ? `<div class="card__need"><span class="card__need-label">Докупить:</span>${ev.missing
      .map((r) => `<span class="need">${esc(byId[r.line.id].name)}</span>`).join('')}</div>`
    : '';
  const reasonsHtml = reasons?.length
    ? `<div class="card__reasons">${reasons.slice(0, 4).map((r) => `<span class="reason">${esc(r)}</span>`).join('')}</div>`
    : '';
  return `
    <a class="card" href="${ctx.link(c.id)}">
      ${match != null ? `<span class="card__match match">${Math.round(match * 100)}%</span>` : ''}
      <div class="card__top">
        <div class="card__titles">
          <div class="card__name">${esc(c.name)}</div>
          <div class="card__en">${esc(c.en)} · ${esc(base)}</div>
        </div>
        <div class="card__tiers">
          <span class="tier-pair">лёгк.${tierBadge(c.easeTier, `Лёгкость приготовления: ${num(c.ease)} из 5`)}</span>
          <span class="tier-pair">вау${tierBadge(c.wowTier, `Круто и необычно: ${c.wow} из 5`)}</span>
        </div>
      </div>
      <div class="card__meta">
        ${strengthPill(c)}
        ${drinkDots(c.drink)}
        ${c.sneaky ? sneakyPill() : ''}
        ${ev.ready && ctx.store.bar.size ? '<span class="pill pill--ready">✓ всё есть</span>' : ''}
      </div>
      <div class="card__ings">${ingredientSummary(ev, byId)}</div>
      ${need}
      ${reasonsHtml}
    </a>`;
}

export function cardGrid(items, ctx, opts) {
  return `<div class="grid">${items.map(({ cocktail, ev, ...rest }) => cocktailCard(cocktail, ev, ctx, { ...opts, ...rest })).join('')}</div>`;
}

export function emptyState({ icon, title, text, actions = '' }) {
  return `<div class="empty"><div class="empty__icon" aria-hidden="true">${icon}</div><h2>${esc(title)}</h2><p>${esc(text)}</p>${actions ? `<div class="btn-row">${actions}</div>` : ''}</div>`;
}

export function segmented(name, options, current) {
  return `<div class="seg" role="group">${options
    .map(([value, label]) => `<button type="button" data-seg="${esc(name)}" data-val="${esc(value)}" aria-pressed="${value === current}">${esc(label)}</button>`)
    .join('')}</div>`;
}

export const RARITY = {
  1: 'есть в любом супермаркете',
  2: 'в хорошем алкомаркете',
  3: 'редкость, скорее онлайн',
};

// Сортировки для списков коктейлей
export const SORTS = {
  combo: { label: 'Лучшее: легко + круто', fn: (a, b) => (b.ease + b.wow) - (a.ease + a.wow) },
  ease: { label: 'Сначала простые', fn: (a, b) => b.ease - a.ease || b.wow - a.wow },
  wow: { label: 'Сначала необычные', fn: (a, b) => b.wow - a.wow || b.ease - a.ease },
  drink: { label: 'Сначала питкие', fn: (a, b) => b.drink - a.drink || a.abv - b.abv },
  weak: { label: 'Слабее', fn: (a, b) => a.abv - b.abv },
  strong: { label: 'Крепче', fn: (a, b) => b.abv - a.abv },
  name: { label: 'По алфавиту', fn: (a, b) => a.name.localeCompare(b.name, 'ru') },
};

export function sortSelect(current, name = 'sort') {
  return `<label class="visually-hidden" for="sel-${name}">Сортировка</label>
    <select class="select" id="sel-${name}" data-pref="${name}">${Object.entries(SORTS)
    .map(([id, s]) => `<option value="${id}"${id === current ? ' selected' : ''}>${esc(s.label)}</option>`).join('')}</select>`;
}

export const STRENGTH_FILTER = [
  ['all', 'Любая'], ['zero', 'б/а'], ['light', 'Лёгкие'], ['medium', 'Средние'], ['strong', 'Крепкие'], ['brutal', 'Убойные'],
];

// Коктейль с заменами — упрощённая версия, в «лучших» он уступает оригиналу
const SUB_PENALTY = 0.75;

export function sortItems(items, sortId) {
  if (!SORTS[sortId] || sortId === 'combo') {
    const score = (i) => i.cocktail.ease + i.cocktail.wow - SUB_PENALTY * (i.ev?.subs || 0);
    return [...items].sort((a, b) => score(b) - score(a) || b.cocktail.drink - a.cocktail.drink);
  }
  const { fn } = SORTS[sortId];
  return [...items].sort((a, b) => fn(a.cocktail, b.cocktail) || (a.ev?.subs || 0) - (b.ev?.subs || 0));
}
