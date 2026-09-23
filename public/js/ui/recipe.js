// Карточка рецепта в модальном окне.

import { esc, icons } from './dom.js';
import { formatAmount, num, count, plural } from '../core/format.js';
import { fixOptions } from '../core/matching.js';
import { METHODS, GLASSES, TAGS, TECHNIQUES, TECHNIQUE_NAMES, toolsFor } from '../core/labels.js';
import { strengthPill, drinkDots, tierBadge, sneakyPill, lineName, RARITY } from './components.js';

const shots = (x) => {
  const v = Math.max(0.1, Math.round(x * 10) / 10);
  return `${num(v)} ${plural(v, ['стопка', 'стопки', 'стопок'])}`;
};

const STATUS_ICON = { have: '✓', make: '⚒', sub: '↺', missing: '✕', optional: '○' };

function ingredientRow(r, ctx, servings) {
  const { byId } = ctx.catalog;
  const { line } = r;
  const ing = byId[line.id];
  const barEmpty = !ctx.store.bar.size;
  const status = line.optional && r.status === 'missing' ? 'optional' : r.status;
  const notes = [];

  if (line.optional) notes.push('по желанию');
  if (line.note) notes.push(esc(line.note));

  if (r.status === 'make') {
    notes.push(`<span class="ings__note--warn">сделай сам: ${esc(ing.make.how)}</span>`);
  } else if (r.status === 'sub') {
    const via = r.via.map((id) => {
      const made = !ctx.store.has(id) && byId[id].make;
      return made ? `${byId[id].name} (сделай из: ${made.from.map((x) => byId[x].name.toLowerCase()).join(' + ')})` : byId[id].name;
    }).join(' + ');
    notes.push(`<span class="ings__note--warn">замена: ${esc(via)}${line.altNote ? `, ${esc(line.altNote)}` : ''}</span>`);
  } else if (r.status === 'missing' && !line.optional && !barEmpty) {
    const others = fixOptions(line, byId).filter((id) => id !== line.id).map((id) => byId[id].name);
    const how = ing.make ? `, или сделай из: ${ing.make.from.map((id) => byId[id].name.toLowerCase()).join(' + ')}` : '';
    notes.push(`<span class="ings__note--bad">нет в баре${others.length ? `; подойдёт и ${esc(others.join(', '))}` : ''}${esc(how)} · ${esc(RARITY[ing.rarity || 1])}</span>`);
  } else if (line.altNote && r.status !== 'sub') {
    notes.push(esc(line.altNote));
  }

  const add = r.status === 'missing' && !ing.always
    ? `<button type="button" class="btn btn--sm btn--ghost" data-action="toggle" data-id="${ing.id}" title="Отметить, что есть в баре">${icons.plus}есть</button>`
    : '';
  // Если бар пустой, статусы «нет» бессмысленны: показываем нейтральные точки
  const iconStatus = barEmpty && !ing.always ? 'optional' : status;
  const iconChar = barEmpty && !ing.always ? '•' : STATUS_ICON[status];

  return `
    <li>
      <span class="ings__icon ings__icon--${iconStatus}" aria-hidden="true">${iconChar}</span>
      <div>
        <div class="ings__name">${esc(lineName(line, ing))}</div>
        ${notes.length ? `<div class="ings__note">${notes.join(' · ')}</div>` : ''}
        ${barEmpty ? '' : add}
      </div>
      <span class="ings__amount">${esc(formatAmount(line.amount, line.unit, servings))}</span>
    </li>`;
}

function tasteRow(label, value) {
  return `<div class="taste__row"><span>${label}</span><div class="taste__bar" role="img" aria-label="${label}: ${value} из 3">${[1, 2, 3].map((i) => `<i class="${i <= value ? 'on' : ''}"></i>`).join('')}</div></div>`;
}

function similar(c, ctx) {
  const mine = new Set(c.requiredIds);
  return ctx.catalog.cocktails
    .filter((o) => o.id !== c.id)
    .map((o) => {
      const other = new Set(o.requiredIds);
      const inter = [...mine].filter((id) => other.has(id)).length;
      return { o, score: inter / (mine.size + other.size - inter) };
    })
    .filter((x) => x.score >= 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ o }) => `<a class="tchip" href="${ctx.link(o.id)}"><span class="tchip__dot" style="background:var(--st-${o.strength.id})"></span>${esc(o.name)}</a>`)
    .join('');
}

export function renderRecipe(c, ctx, servings = 1) {
  const ev = ctx.ev(c);
  const { familyById } = ctx.catalog;
  const techniques = [c.method, ...c.flags].filter((t) => TECHNIQUES[t]);
  const tags = c.tags.map((t) => TAGS[t]).filter(Boolean);
  const sim = similar(c, ctx);
  const barLine = !ctx.store.bar.size
    ? ''
    : ev.ready
      ? '<span class="pill pill--ready">✓ всё есть в баре</span>'
      : `<span class="pill" style="color:var(--bad)">не хватает: ${ev.missingCount}</span>`;

  return `
    <article class="recipe">
      <div class="recipe__head">
        <div>
          <h2 id="recipe-title">${esc(c.name)}</h2>
          <div class="recipe__en">${esc(c.en)}${c.classic ? ' · классика' : ''}</div>
        </div>
        <button type="button" class="recipe__close" data-action="close-recipe" aria-label="Закрыть">${icons.close}</button>
      </div>
      <p class="recipe__desc">${esc(c.desc)}</p>
      <div class="card__meta" style="margin-top:12px">${barLine}${c.sneaky ? sneakyPill() : ''}${tags.map((t) => `<span class="pill">${esc(t)}</span>`).join('')}</div>

      <div class="facts">
        <div class="fact">
          <div class="fact__label">Крепость</div>
          <div class="fact__value">${strengthPill(c, { long: true })}</div>
          <div class="fact__sub">${c.ethanolMl ? `по спирту ≈ ${shots(c.shots)} водки по 50 мл` : 'без алкоголя'}</div>
        </div>
        <div class="fact">
          <div class="fact__label">Питкость</div>
          <div class="fact__value">${drinkDots(c.drink)}</div>
          <div class="fact__sub">${['', 'для ценителей', 'на любителя', 'нормально заходит', 'пьётся легко', 'как сок'][c.drink]}</div>
        </div>
        <div class="fact">
          <div class="fact__label">Лёгкость</div>
          <div class="fact__value">${tierBadge(c.easeTier)} ${num(c.ease)} из 5</div>
          <div class="fact__sub">${esc(METHODS[c.method].name)} · ${count(c.requiredIds.length, ['ингредиент', 'ингредиента', 'ингредиентов'])}</div>
        </div>
        <div class="fact">
          <div class="fact__label">Круто и необычно</div>
          <div class="fact__value">${tierBadge(c.wowTier)} ${c.wow} из 5</div>
          <div class="fact__sub">основа: ${esc(c.base === 'none' ? 'без алкоголя' : familyById[c.base].name.toLowerCase())}</div>
        </div>
      </div>

      <div class="taste" style="margin-top:14px">
        ${tasteRow('Сладость', c.sweet)}
        ${tasteRow('Кислинка', c.sour)}
        ${tasteRow('Горчинка', c.bitter)}
      </div>

      <h3>
        Ингредиенты
        <span class="stepper" aria-label="Количество порций">
          <button type="button" data-action="servings" data-delta="-1" aria-label="Меньше порций">−</button>
          <span>${count(servings, ['порция', 'порции', 'порций'])}</span>
          <button type="button" data-action="servings" data-delta="1" aria-label="Больше порций">+</button>
        </span>
      </h3>
      <ul class="ings">${ev.lines.map((r) => ingredientRow(r, ctx, servings)).join('')}</ul>

      <h3>Как приготовить</h3>
      <ol class="steps">${c.steps.map((s) => `<li><span>${esc(s)}</span></li>`).join('')}</ol>

      <h3>Подача</h3>
      <div class="kv">
        <div><b>Бокал</b><span>${esc(GLASSES[c.glass] || c.glass)}</span></div>
        <div><b>Украшение</b><span>${esc(c.garnish)}</span></div>
        <div><b>Инструменты</b><span>${esc(toolsFor(c).join(', '))}</span></div>
      </div>

      ${techniques.length ? `<h3>Техника</h3>${techniques.map((t) => `<details class="tech"><summary>${esc(TECHNIQUE_NAMES[t])}</summary><p>${esc(TECHNIQUES[t])}</p></details>`).join('')}` : ''}
      ${sim ? `<h3>Похожие</h3><div class="similar">${sim}</div>` : ''}
    </article>`;
}
