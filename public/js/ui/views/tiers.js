// «Тиры»: тир-листы по лёгкости, необычности и их комбинации.

import { esc } from '../dom.js';
import { num } from '../../core/format.js';
import {
  TIERS, tierOf, comboScore, rankTiers, RANK_SHARES, STRENGTH_LEVELS, METHOD_EFFORT, FLAG_EFFORT, PER_EXTRA_INGREDIENT,
} from '../../core/metrics.js';
import { TECHNIQUE_NAMES } from '../../core/labels.js';
import { segmented } from '../components.js';

const MODES = [['combo', 'Комбо'], ['ease', 'Лёгкость'], ['wow', 'Необычность'], ['map', 'Карта']];
const SCOPES = [['all', 'Все'], ['ready', 'Из моего бара'], ['near', 'Без одного']];

const TIER_HINTS = {
  ease: { S: 'налил и готово', A: 'пара движений', B: 'надо повозиться', C: 'для практиков', D: 'испытание' },
  wow: { S: 'вау', A: 'интересно', B: 'крепкая классика', C: 'привычное', D: 'база' },
  combo: { S: 'must try', A: 'отлично', B: 'хорошо', C: 'обычно', D: 'возня без вау' },
};

function scoreFn(mode, weight) {
  if (mode === 'ease') return (c) => c.ease;
  if (mode === 'wow') return (c) => c.wow;
  return (c) => comboScore(c, weight);
}

function scoped(ctx) {
  const scope = ctx.store.prefs.tierScope;
  const all = ctx.catalog.cocktails;
  if (scope === 'ready') return all.filter((c) => ctx.ev(c).ready);
  if (scope === 'near') return all.filter((c) => ctx.ev(c).missingCount <= 1);
  return all;
}

function tchip(c, ctx) {
  const ev = ctx.ev(c);
  const cls = ctx.store.bar.size && ev.ready ? ' tchip--ready' : '';
  const title = `${c.en} · ≈${Math.round(c.abv * 100)}% · лёгкость ${num(c.ease)} · вау ${c.wow}${ev.ready ? ' · всё есть' : ''}`;
  return `<a class="tchip${cls}" href="${ctx.link(c.id)}" title="${esc(title)}"><span class="tchip__dot" style="background:var(--st-${c.strength.id})"></span>${esc(c.name)}</a>`;
}

function renderTierList(ctx) {
  const { tierMode: mode } = ctx.store.prefs;
  const weight = ctx.ui.weight ?? ctx.store.prefs.weight;
  const score = scoreFn(mode, weight);
  // Комбо ранжируется по месту среди всех коктейлей, чтобы тир не зависел от выборки
  // На краях ползунка это чистая лёгкость или необычность: там работают обычные пороги
  const byRank = mode === 'combo' && weight > 0 && weight < 1;
  const tier = byRank ? rankTiers(ctx.catalog.cocktails.map(score)) : tierOf;
  const list = scoped(ctx);
  if (!list.length) return emptyScope();
  const rows = TIERS.map((t) => {
    const items = list.filter((c) => tier(score(c)) === t.id).sort((a, b) => score(b) - score(a) || b.drink - a.drink);
    return `
      <div class="tierrow">
        <div class="tierrow__label tier--${t.id}">${t.id}<small>${esc(TIER_HINTS[mode][t.id])}</small></div>
        <div class="tierrow__items">${items.length ? items.map((c) => tchip(c, ctx)).join('') : '<span class="tierrow__empty">пусто</span>'}</div>
      </div>`;
  }).join('');
  return `<div class="tierlist">${rows}</div>`;
}

function emptyScope() {
  return '<p class="muted">В этой выборке пусто. Отметь больше ингредиентов в баре или переключись на «Все».</p>';
}

function renderMap(ctx) {
  const list = scoped(ctx);
  if (!list.length) return emptyScope();
  const easy = (c) => c.ease >= 3.5;
  const cool = (c) => c.wow >= 4;
  const cell = (title, text, filter, best = false) => {
    const items = list.filter(filter).sort((a, b) => (b.ease + b.wow) - (a.ease + a.wow));
    return `
      <div class="quad__cell${best ? ' quad__cell--best' : ''}">
        <h3>${esc(title)}<span class="count-badge">${items.length}</span></h3>
        <p>${esc(text)}</p>
        <div class="chips">${items.map((c) => tchip(c, ctx)).join('') || '<span class="muted small">пусто</span>'}</div>
      </div>`;
  };
  return `
    <div class="quad">
      ${cell('Сложно, но того стоит', 'Необычно и эффектно, но придётся повозиться', (c) => !easy(c) && cool(c))}
      ${cell('Легко и круто', 'Минимум усилий, максимум впечатления: начинай отсюда', (c) => easy(c) && cool(c), true)}
      ${cell('Классика с возней', 'Знакомые вкусы, но техника или состав посложнее', (c) => !easy(c) && !cool(c))}
      ${cell('Легко и надёжно', 'Быстро, понятно, всегда заходит', (c) => easy(c) && !cool(c))}
    </div>
    <div class="quad__axis"><span>← сложнее</span><span>проще →</span></div>`;
}

function explain() {
  const methods = Object.entries(METHOD_EFFORT).map(([m, v]) => `${TECHNIQUE_NAMES[m].toLowerCase()} ${num(v)}`).join(', ');
  const shares = RANK_SHARES.map(([id, s], i) => `${id} ${i === 0 ? 'лучшие' : i === RANK_SHARES.length - 1 ? 'последние' : 'следующие'} ${Math.round(s * 100)}%`).join(', ');
  const flags = Object.entries(FLAG_EFFORT).map(([f, v]) => `${TECHNIQUE_NAMES[f].toLowerCase()} +${num(v)}`).join(', ');
  const levels = STRENGTH_LEVELS.map((l, i) => {
    const lo = i === 0 ? 0 : Math.round(STRENGTH_LEVELS[i - 1].max * 100);
    const hi = l.max === Infinity ? null : Math.round(l.max * 100);
    return `${l.name.toLowerCase()} ${i === 0 ? '0%' : hi ? `${lo}–${hi}%` : `от ${lo}%`}`;
  }).join(', ');
  return `
    <details class="explain">
      <summary>Как считаются тиры и крепость</summary>
      <ul>
        <li><b>Лёгкость</b> считается по рецепту: 5 минус «очки возни». Метод: ${methods}. Техники: ${flags}. Каждый ингредиент сверх двух +${num(PER_EXTRA_INGREDIENT)}, домашний сироп ещё немного.</li>
        <li><b>Необычность</b> («круто и необычно») — экспертная оценка от 1 до 5: насколько вкус и подача удивят обычного человека, а не бармена.</li>
        <li>Тиры лёгкости и необычности: S от 4,5, A от 3,5, B от 2,5, C от 1,5, остальное D.</li>
        <li><b>Комбо</b> — взвешенная сумма, ползунок решает, что важнее. Тиры по месту среди всех коктейлей: ${shares}.</li>
        <li><b>Крепость</b> оценена по объёму и градусу ингредиентов с учётом таяния льда при шейке, стире или подаче: ${levels}. Точность ±2–3%.</li>
        <li><b>Питкость</b> — насколько легко пьётся, без учёта крепости. Высокая питкость плюс много спирта даёт метку «коварный».</li>
      </ul>
    </details>`;
}

export default {
  id: 'tiers',
  title: 'Тиры',

  render(ctx) {
    const { tierMode: mode, tierScope: scope } = ctx.store.prefs;
    const weight = ctx.ui.weight ?? ctx.store.prefs.weight;
    const slider = mode === 'combo'
      ? `<label class="weight">
          <span>Необычность</span>
          <input type="range" id="tier-weight" min="0" max="1" step="0.1" value="${weight}" aria-label="Что важнее: лёгкость или необычность">
          <span>Лёгкость</span>
        </label>`
      : '';
    const legend = STRENGTH_LEVELS.map((l) => `<span><i style="background:var(--st-${l.id})"></i>${esc(l.name.toLowerCase())}</span>`).join('');
    return `
      <div class="page-head">
        <div class="page-head__text">
          <h1>Тир-лист коктейлей</h1>
          <p>По двум осям: насколько легко приготовить и насколько это круто и необычно. Цвет точки — крепость, зелёная подложка — всё есть в баре.</p>
        </div>
      </div>
      <div class="toolbar">
        ${segmented('tierMode', MODES, mode)}
        ${segmented('tierScope', SCOPES, scope)}
        ${slider}
      </div>
      <div class="legend">${legend}</div>
      <div id="tier-body">${mode === 'map' ? renderMap(ctx) : renderTierList(ctx)}</div>
      ${explain()}`;
  },

  bind(root, ctx) {
    const slider = root.querySelector('#tier-weight');
    if (!slider) return;
    slider.addEventListener('input', () => {
      ctx.ui.weight = Number(slider.value);
      root.querySelector('#tier-body').innerHTML = renderTierList(ctx);
    });
    slider.addEventListener('change', () => ctx.store.setPref('weight', Number(slider.value), { silent: true }));
  },
};
