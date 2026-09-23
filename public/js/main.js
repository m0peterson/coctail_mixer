// Точка входа: роутинг по hash, перерисовка, модальное окно рецепта.

import { buildCatalog } from './core/catalog.js';
import { evaluate, groupByMissing } from './core/matching.js';
import { count } from './core/format.js';
import { createStore } from './store.js';
import { renderRecipe } from './ui/recipe.js';
import barView from './ui/views/bar.js';
import mixView from './ui/views/mix.js';
import tiersView from './ui/views/tiers.js';
import quizView from './ui/views/quiz.js';
import allView from './ui/views/all.js';

const VIEWS = { bar: barView, mix: mixView, tiers: tiersView, quiz: quizView, all: allView };
const APP_TITLE = 'Коктейльный миксер';

const catalog = buildCatalog();
const store = createStore(new Set(catalog.ingredients.map((i) => i.id)));

const $view = document.getElementById('view');
const $dialog = document.getElementById('recipe');
const $toast = document.getElementById('toast');
const $count = document.getElementById('bar-count');

// ── Кэш оценок: пересчитывается только при изменении бара ──
let evalCache = null;
let groupCache = null;
const evaluations = () => {
  evalCache ??= new Map(catalog.cocktails.map((c) => [c.id, evaluate(c, store.bar, catalog.byId)]));
  return evalCache;
};

// ── Маршрут ──
function parseHash() {
  const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [path, query = ''] = raw.split('?');
  const params = new URLSearchParams(query);
  const name = VIEWS[path] ? path : (store.bar.size ? 'mix' : 'bar');
  return { name, params, known: !!VIEWS[path] };
}

let route = parseHash();

const ctx = {
  catalog,
  store,
  ui: { barQuery: '', allQuery: '', weight: null },
  ev: (c) => evaluations().get(c.id),
  groups: () => {
    groupCache ??= groupByMissing(catalog.cocktails, store.bar, catalog.byId);
    return groupCache;
  },
  link: (id) => `#/${route.name}?c=${encodeURIComponent(id)}`,
  toast,
};

// ── Отрисовка ──
function renderView({ keepFocus = false } = {}) {
  const view = VIEWS[route.name];
  const focusKey = keepFocus ? focusSignature(document.activeElement) : null;

  $view.innerHTML = view.render(ctx);
  view.bind?.($view, ctx);

  document.querySelectorAll('.tab').forEach((t) => {
    if (t.dataset.route === route.name) t.setAttribute('aria-current', 'page');
    else t.removeAttribute('aria-current');
  });
  $count.textContent = store.bar.size;
  if (focusKey) restoreFocus(focusKey);
  updateTitle();
}

function focusSignature(el) {
  if (!el || el === document.body || !$view.contains(el) && !$dialog.contains(el)) return null;
  if (el.id) return { id: el.id, sel: el.selectionStart };
  const d = el.dataset || {};
  const keys = ['action', 'id', 'seg', 'val', 'q', 'family', 'delta'].filter((k) => d[k] != null);
  return keys.length ? { attrs: keys.map((k) => [k, d[k]]) } : null;
}

function restoreFocus(sig) {
  let el = null;
  if (sig.id) el = document.getElementById(sig.id);
  else {
    const selector = sig.attrs.map(([k, v]) => `[data-${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}="${CSS.escape(v)}"]`).join('');
    el = $dialog.open ? $dialog.querySelector(selector) || $view.querySelector(selector) : $view.querySelector(selector);
  }
  if (!el) return;
  el.focus({ preventScroll: true });
  if (sig.sel != null && el.setSelectionRange) el.setSelectionRange(sig.sel, sig.sel);
}

function updateTitle() {
  const id = route.params.get('c');
  const c = id && catalog.cocktailById[id];
  document.title = c ? `${c.name} · ${APP_TITLE}` : `${VIEWS[route.name].title} · ${APP_TITLE}`;
}

// ── Модальное окно рецепта ──
let servings = 1;
let modalPushed = false;

function syncModal() {
  const id = route.params.get('c');
  const c = id && catalog.cocktailById[id];
  if (c) {
    if ($dialog.dataset.id !== id) servings = 1;
    $dialog.dataset.id = id;
    $dialog.innerHTML = renderRecipe(c, ctx, servings);
    if (!$dialog.open) {
      $dialog.showModal();
      $dialog.scrollTop = 0;
    }
  } else if ($dialog.open) {
    $dialog.dataset.id = '';
    $dialog.close();
  }
  updateTitle();
}

function closeRecipe() {
  if (!route.params.get('c')) return;
  if (modalPushed) {
    modalPushed = false;
    history.back();
  } else {
    route.params.delete('c');
    history.replaceState(null, '', `#/${route.name}`);
    syncModal();
  }
}

$dialog.addEventListener('close', () => {
  if (route.params.get('c')) closeRecipe();
});
// Клик по затемнению вокруг окна закрывает его
$dialog.addEventListener('click', (e) => {
  if (e.target === $dialog) $dialog.close();
});

// ── Импорт бара по ссылке ──
function importSharedBar() {
  const shared = route.params.get('i');
  if (!shared) return false;
  const ids = shared.split(',').filter((id) => catalog.byId[id]);
  if (ids.length) {
    const same = ids.length === store.bar.size && ids.every((id) => store.has(id));
    if (!same && (!store.bar.size || window.confirm(`Заменить твой бар на присланный (${count(ids.length, ['ингредиент', 'ингредиента', 'ингредиентов'])})?`))) {
      store.setBar(ids);
      toast('Бар загружен из ссылки');
    }
  }
  history.replaceState(null, '', '#/bar');
  route = parseHash();
  return true;
}

async function shareBar() {
  const url = `${location.origin}${location.pathname}#/bar?i=${[...store.bar].join(',')}`;
  const text = `Мой бар: ${count(store.bar.size, ['ингредиент', 'ингредиента', 'ингредиентов'])}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: APP_TITLE, text, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast('Ссылка на бар скопирована');
  } catch (err) {
    if (err?.name !== 'AbortError') window.prompt('Скопируй ссылку:', url);
  }
}

// ── Уведомление ──
let toastTimer;
function toast(message) {
  $toast.textContent = message;
  $toast.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.classList.remove('is-on'), 2200);
}

// ── События ──
window.addEventListener('hashchange', () => {
  const prev = route;
  route = parseHash();
  if (importSharedBar()) { renderView(); return; }
  const pathChanged = prev.name !== route.name;
  const opened = !prev.params.get('c') && route.params.get('c');
  if (opened && !pathChanged) modalPushed = true;
  if (!route.params.get('c')) modalPushed = false;
  if (pathChanged) {
    ctx.ui.weight = null;
    renderView();
    window.scrollTo({ top: 0 });
    $view.focus({ preventScroll: true });
  }
  syncModal();
});

store.subscribe((what) => {
  if (what === 'bar') { evalCache = null; groupCache = null; }
  renderView({ keepFocus: true });
  if ($dialog.open) {
    const scroll = $dialog.scrollTop;
    syncModal();
    $dialog.scrollTop = scroll;
  }
});

document.addEventListener('click', (e) => {
  // Переход к похожему коктейлю внутри окна заменяет рецепт, а не копит историю
  const link = e.target.closest('a[href^="#"]');
  if (link && $dialog.contains(link)) {
    e.preventDefault();
    history.replaceState(null, '', link.getAttribute('href'));
    route = parseHash();
    syncModal();
    $dialog.scrollTop = 0;
    return;
  }

  const el = e.target.closest('[data-action], [data-seg]');
  if (!el) return;

  if (el.dataset.seg) {
    store.setPref(el.dataset.seg, el.dataset.val);
    return;
  }

  const { action } = el.dataset;
  switch (action) {
    case 'toggle':
      store.toggle(el.dataset.id);
      return;
    case 'clear':
      if (window.confirm('Очистить бар полностью?')) store.clear();
      return;
    case 'share':
      shareBar();
      return;
    case 'close-recipe':
      $dialog.close();
      return;
    case 'servings': {
      servings = Math.min(20, Math.max(1, servings + Number(el.dataset.delta)));
      const scroll = $dialog.scrollTop;
      syncModal();
      $dialog.scrollTop = scroll;
      restoreFocus({ attrs: [['action', 'servings'], ['delta', el.dataset.delta]] });
      return;
    }
    case 'scroll':
      document.getElementById(el.dataset.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    default:
      VIEWS[route.name].onAction?.(action, el, ctx);
  }
});

document.addEventListener('change', (e) => {
  const el = e.target.closest('select[data-pref]');
  if (el) store.setPref(el.dataset.pref, el.value);
});

// ── Старт ──
if (!route.known) history.replaceState(null, '', `#/${route.name}${location.hash.includes('?') ? `?${route.params}` : ''}`);
importSharedBar();
renderView();
syncModal();

if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !['localhost', '127.0.0.1'].includes(location.hostname)) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
