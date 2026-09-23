// «Мой бар»: выбор ингредиентов.

import { esc, icons } from '../dom.js';
import { count } from '../../core/format.js';

export const PRESETS = [
  {
    id: 'kitchen', label: 'Кухня',
    title: 'Что обычно и так есть дома',
    ids: ['sugar', 'salt', 'pepper', 'honey', 'lemon', 'coffee', 'cinnamon', 'cloves', 'milk', 'egg', 'vanilla'],
  },
  {
    id: 'party', label: 'Вечеринка',
    title: 'Водка, соки и газировка',
    ids: ['vodka', 'orange_juice', 'cranberry_juice', 'tomato_juice', 'cola', 'lemonade', 'soda', 'lemon', 'sugar', 'salt', 'pepper'],
  },
  {
    id: 'home', label: 'Домашний бар',
    title: 'Базовый набор, из которого делается половина классики',
    ids: [
      'vodka', 'gin', 'rum_white', 'tequila', 'bourbon', 'triple_sec', 'sweet_vermouth', 'campari',
      'tonic', 'soda', 'cola', 'ginger_beer', 'orange_juice', 'lime', 'lemon', 'mint', 'sugar', 'angostura',
    ],
  },
  {
    id: 'tiki', label: 'Тики',
    title: 'Тропический набор',
    ids: ['rum_white', 'rum_gold', 'rum_dark', 'lime', 'pineapple_juice', 'orange_juice', 'coconut_cream', 'orgeat', 'triple_sec', 'grenadine', 'sugar', 'mint', 'angostura'],
  },
];

function matches(ing, q) {
  if (!q) return true;
  return `${ing.name} ${ing.hint || ''}`.toLowerCase().includes(q);
}

function renderCats(ctx) {
  const { catalog, store, ui } = ctx;
  const q = (ui.barQuery || '').trim().toLowerCase();
  let shown = 0;
  const html = catalog.categories.map((cat) => {
    const items = catalog.ingredients.filter((i) => i.cat === cat.id && !i.hidden && matches(i, q));
    if (!items.length) return '';
    shown += items.length;
    const selected = catalog.ingredients.filter((i) => i.cat === cat.id && store.has(i.id)).length;
    // Популярные ингредиенты первыми: так быстрее отметить главное
    items.sort((a, b) => (catalog.usage[b.id] || 0) - (catalog.usage[a.id] || 0));
    const chips = items.map((ing) => {
      const on = store.has(ing.id);
      const uses = catalog.usage[ing.id] || 0;
      const title = [ing.hint, uses ? `встречается в ${count(uses, ['коктейле', 'коктейлях', 'коктейлях'])}` : ''].filter(Boolean).join(' · ');
      return `<button type="button" class="chip" data-action="toggle" data-id="${ing.id}" aria-pressed="${on}" title="${esc(title)}">${icons.check}${esc(ing.name)}${uses ? `<span class="chip__meta">${uses}</span>` : ''}</button>`;
    }).join('');
    return `
      <section class="cat" aria-labelledby="cat-${cat.id}">
        <div class="cat__head">
          <span class="cat__icon" aria-hidden="true">${cat.icon}</span>
          <h2 id="cat-${cat.id}">${esc(cat.name)}</h2>
          <span class="cat__count">${selected ? `${selected} отмечено` : ''}</span>
        </div>
        <div class="chips">${chips}</div>
      </section>`;
  }).join('');
  return shown ? html : `<p class="muted" style="margin-top:20px">Ничего не нашлось по запросу «${esc(q)}».</p>`;
}

export default {
  id: 'bar',
  title: 'Мой бар',

  render(ctx) {
    const { store, groups } = ctx;
    const g = groups();
    const presets = PRESETS.map((p) => `<button type="button" class="btn btn--sm" data-action="preset" data-id="${p.id}" title="${esc(p.title)}">${icons.plus}${esc(p.label)}</button>`).join('');
    const dock = store.bar.size
      ? `<div class="dock">
          <div class="dock__text">Можно сделать: <b>${g.ready.length}</b> · без одного ингредиента: <b>${g.one.length}</b></div>
          <a class="btn btn--primary" href="#/mix">Что смешать ${icons.arrow}</a>
        </div>`
      : '';
    return `
      <div class="page-head">
        <div class="page-head__text">
          <h1>Мой бар</h1>
          <p>Отметь, что есть дома. Цифра рядом с названием: в скольких коктейлях встречается. Всё сохраняется в этом браузере.</p>
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn--sm" data-action="share" ${store.bar.size ? '' : 'disabled'}>${icons.share}Поделиться</button>
          <button type="button" class="btn btn--sm btn--ghost" data-action="clear" ${store.bar.size ? '' : 'disabled'}>${icons.reset}Очистить</button>
        </div>
      </div>
      <div class="toolbar">
        <label class="search">
          <span class="visually-hidden">Поиск ингредиента</span>
          ${icons.search}
          <input id="bar-search" type="search" placeholder="Найти: джин, лайм, Kahlúa…" value="${esc(ctx.ui.barQuery || '')}" autocomplete="off">
        </label>
      </div>
      <div class="presets"><span class="presets__label">Быстро добавить:</span>${presets}</div>
      <div id="bar-cats">${renderCats(ctx)}</div>
      ${dock}`;
  },

  bind(root, ctx) {
    const input = root.querySelector('#bar-search');
    input?.addEventListener('input', () => {
      ctx.ui.barQuery = input.value;
      root.querySelector('#bar-cats').innerHTML = renderCats(ctx);
    });
  },

  onAction(action, el, ctx) {
    if (action === 'preset') {
      const preset = PRESETS.find((p) => p.id === el.dataset.id);
      const before = ctx.store.bar.size;
      ctx.store.add(preset.ids);
      const added = ctx.store.bar.size - before;
      ctx.toast(added ? `Добавлено: ${count(added, ['ингредиент', 'ингредиента', 'ингредиентов'])}` : 'Всё это уже есть в баре');
      return true;
    }
    return false;
  },
};
