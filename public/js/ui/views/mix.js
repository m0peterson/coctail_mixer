// «Что смешать»: готовые коктейли, почти готовые и что докупить.

import { esc, icons } from '../dom.js';
import { count, plural } from '../../core/format.js';
import { suggestPurchases, shoppingBasket } from '../../core/matching.js';
import {
  cardGrid, emptyState, sortSelect, sortItems, segmented, STRENGTH_FILTER, RARITY,
} from '../components.js';

const COCKTAIL_FORMS = ['коктейль', 'коктейля', 'коктейлей'];

function filterStrength(items, strength) {
  return strength === 'all' ? items : items.filter((i) => i.cocktail.strength.id === strength);
}

function cocktailLinks(list, ctx, max = 6) {
  const shown = list.slice(0, max).map((c) => `<a href="${ctx.link(c.id)}">${esc(c.name)}</a>`).join(', ');
  const rest = list.length - max;
  return rest > 0 ? `${shown} и ещё ${rest}` : shown;
}

function renderBuy(ctx) {
  const { catalog, store } = ctx;
  const suggestions = suggestPurchases(catalog, store.bar, { limit: 6 });
  if (!suggestions.length) {
    return '<p class="muted">Похоже, у тебя есть почти всё. Докупать нечего, иди смешивай.</p>';
  }
  const items = suggestions.map(({ ingredient, unlocks, closer }) => {
    const plus = unlocks.length
      ? `<div class="buy__plus">+${unlocks.length}<small>${plural(unlocks.length, COCKTAIL_FORMS)}</small></div>`
      : `<div class="buy__plus buy__plus--closer">${closer.length}<small>ближе</small></div>`;
    const list = unlocks.length
      ? `Откроет: ${cocktailLinks(unlocks, ctx)}`
      : `Останется докупить одно для: ${cocktailLinks(closer, ctx, 4)}`;
    return `
      <div class="buy__item">
        ${plus}
        <div class="buy__body">
          <div class="buy__name">${esc(ingredient.name)}</div>
          <div class="buy__rarity">${esc(RARITY[ingredient.rarity || 1])}</div>
          <div class="buy__list">${list}</div>
        </div>
        <button type="button" class="btn btn--sm buy__add" data-action="toggle" data-id="${ingredient.id}" title="Отметить, что уже есть">${icons.plus}Есть</button>
      </div>`;
  }).join('');

  const basket = shoppingBasket(catalog, store.bar, 3);
  const total = basket.reduce((sum, s) => sum + s.unlocks.length, 0);
  const basketHtml = basket.length > 1
    ? `<div class="basket">
        <b>Список покупок на ${count(basket.length, ['позицию', 'позиции', 'позиций'])}: +${count(total, COCKTAIL_FORMS)}</b>
        <ol>${basket.map((s) => `<li><b>${esc(s.ingredient.name)}</b> <span class="muted">+${s.unlocks.length}: ${cocktailLinks(s.unlocks, ctx, 4)}</span></li>`).join('')}</ol>
      </div>`
    : '';
  return `<div class="buy">${items}</div>${basketHtml}`;
}

export default {
  id: 'mix',
  title: 'Что смешать',

  render(ctx) {
    const { store, groups } = ctx;
    if (!store.bar.size) {
      return `
        <div class="page-head"><div class="page-head__text"><h1>Что смешать</h1></div></div>
        ${emptyState({
          icon: '🍸',
          title: 'Бар пока пустой',
          text: 'Отметь, какие бутылки, соки и фрукты есть дома, и здесь появится всё, что из них получится. Или начни с подбора по вкусу.',
          actions: `<a class="btn btn--primary" href="#/bar">Заполнить бар</a><a class="btn" href="#/quiz">Подбор по вкусу</a><a class="btn btn--ghost" href="#/all">Все рецепты</a>`,
        })}`;
    }

    const { sort, strength } = store.prefs;
    const g = groups();
    const prep = (items) => sortItems(filterStrength(items, strength), sort);
    const ready = prep(g.ready);
    const one = prep(g.one);
    const two = prep(g.two);

    const readyHtml = ready.length
      ? cardGrid(ready, ctx)
      : `<p class="muted">${g.ready.length ? 'Под выбранную крепость ничего нет.' : 'Из того, что есть, пока ничего не собирается целиком. Ниже видно, чего не хватает.'}</p>`;

    return `
      <div class="page-head">
        <div class="page-head__text">
          <h1>Что смешать</h1>
          <p>Из ${count(store.bar.size, ['ингредиента', 'ингредиентов', 'ингредиентов'])} в баре. Звёздочка у ингредиента значит, что используется замена.</p>
        </div>
      </div>

      <div class="stats">
        <button type="button" class="stat stat--good" data-action="scroll" data-target="sec-ready"><div class="stat__num">${g.ready.length}</div><div class="stat__label">можно сделать</div></button>
        <button type="button" class="stat stat--warn" data-action="scroll" data-target="sec-one"><div class="stat__num">${g.one.length}</div><div class="stat__label">без одного</div></button>
        <button type="button" class="stat" data-action="scroll" data-target="sec-two"><div class="stat__num">${g.two.length}</div><div class="stat__label">без двух</div></button>
      </div>

      <div class="toolbar" style="margin-top:14px">
        ${sortSelect(sort)}
        ${segmented('strength', STRENGTH_FILTER, strength)}
      </div>

      <section class="section" id="sec-ready">
        <div class="section__head"><h2>Можно сделать прямо сейчас<span class="count-badge">${ready.length}</span></h2></div>
        ${readyHtml}
      </section>

      <section class="section" id="sec-buy">
        <div class="section__head">
          <h2>Что докупить</h2>
          <p>Покупки, которые откроют больше всего новых коктейлей</p>
        </div>
        ${renderBuy(ctx)}
      </section>

      <section class="section" id="sec-one">
        <div class="section__head"><h2>Не хватает одного<span class="count-badge">${one.length}</span></h2></div>
        ${one.length ? cardGrid(one, ctx) : '<p class="muted">Таких нет.</p>'}
      </section>

      <section class="section" id="sec-two">
        <details class="more"${two.length && two.length <= 6 ? ' open' : ''}>
          <summary>Не хватает двух<span class="count-badge">${two.length}</span></summary>
          ${two.length ? cardGrid(two, ctx) : '<p class="muted">Таких нет.</p>'}
        </details>
      </section>`;
  },
};
