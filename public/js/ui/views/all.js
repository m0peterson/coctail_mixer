// «Рецепты»: весь каталог с поиском и фильтрами.

import { esc, icons } from '../dom.js';
import { count } from '../../core/format.js';
import { cardGrid, sortSelect, sortItems, segmented, STRENGTH_FILTER } from '../components.js';

function baseOptions(ctx) {
  const used = new Set(ctx.catalog.cocktails.map((c) => c.base));
  const opts = [['all', 'Всё']];
  for (const f of ctx.catalog.families) if (used.has(f.id)) opts.push([f.id, f.name]);
  if (used.has('none')) opts.push(['none', 'Без алкоголя']);
  return opts;
}

function renderResults(ctx) {
  const { allBase, allStrength = 'all', allSort = 'combo' } = ctx.store.prefs;
  const q = (ctx.ui.allQuery || '').trim().toLowerCase();
  let list = ctx.catalog.cocktails;
  if (allBase !== 'all') list = list.filter((c) => c.base === allBase);
  if (allStrength !== 'all') list = list.filter((c) => c.strength.id === allStrength);
  if (q) list = list.filter((c) => c.search.includes(q));
  const items = sortItems(list.map((c) => ({ cocktail: c, ev: ctx.ev(c) })), allSort);
  const head = `<p class="muted small" style="margin-bottom:10px">${count(items.length, ['рецепт', 'рецепта', 'рецептов'])}</p>`;
  return items.length ? head + cardGrid(items, ctx) : `<p class="muted">Ничего не нашлось${q ? ` по запросу «${esc(q)}»` : ''}.</p>`;
}

export default {
  id: 'all',
  title: 'Рецепты',

  render(ctx) {
    const { allBase, allStrength = 'all', allSort = 'combo' } = ctx.store.prefs;
    return `
      <div class="page-head">
        <div class="page-head__text">
          <h1>Все рецепты</h1>
          <p>${count(ctx.catalog.cocktails.length, ['коктейль', 'коктейля', 'коктейлей'])}: классика IBA, современные хиты и пара безалкогольных. Ищи по названию или ингредиенту.</p>
        </div>
      </div>
      <div class="toolbar">
        <label class="search">
          <span class="visually-hidden">Поиск коктейля</span>
          ${icons.search}
          <input id="all-search" type="search" placeholder="Негрони, мята, Кампари…" value="${esc(ctx.ui.allQuery || '')}" autocomplete="off">
        </label>
        ${sortSelect(allSort, 'allSort')}
      </div>
      <div class="toolbar">${segmented('allBase', baseOptions(ctx), allBase)}</div>
      <div class="toolbar">${segmented('allStrength', STRENGTH_FILTER, allStrength)}</div>
      <div id="all-results">${renderResults(ctx)}</div>`;
  },

  bind(root, ctx) {
    const input = root.querySelector('#all-search');
    input?.addEventListener('input', () => {
      ctx.ui.allQuery = input.value;
      root.querySelector('#all-results').innerHTML = renderResults(ctx);
    });
  },
};
