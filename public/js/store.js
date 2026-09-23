// Состояние приложения с сохранением в localStorage.

const KEY = 'cocktail-mixer:v1';

const DEFAULTS = {
  bar: [],
  quiz: { answers: {}, step: 0, done: false },
  prefs: {
    sort: 'combo', strength: 'all',
    tierMode: 'combo', weight: 0.5, tierScope: 'all',
    allBase: 'all', allStrength: 'all', allSort: 'combo',
  },
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const data = JSON.parse(raw);
    return {
      bar: Array.isArray(data.bar) ? data.bar : [],
      quiz: { ...DEFAULTS.quiz, ...(data.quiz || {}) },
      prefs: { ...DEFAULTS.prefs, ...(data.prefs || {}) },
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function createStore(validIds) {
  const data = load();
  let bar = new Set(data.bar.filter((id) => validIds.has(id)));
  const listeners = new Set();

  const persist = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ bar: [...bar], quiz: data.quiz, prefs: data.prefs }));
    } catch { /* приватный режим или переполнение: работаем без сохранения */ }
  };
  const emit = (what) => { persist(); listeners.forEach((fn) => fn(what)); };

  return {
    get bar() { return bar; },
    has: (id) => bar.has(id),
    toggle(id) {
      if (bar.has(id)) bar.delete(id); else bar.add(id);
      bar = new Set(bar);
      emit('bar');
    },
    add(ids) {
      bar = new Set([...bar, ...ids.filter((id) => validIds.has(id))]);
      emit('bar');
    },
    setBar(ids) {
      bar = new Set(ids.filter((id) => validIds.has(id)));
      emit('bar');
    },
    clear() { bar = new Set(); emit('bar'); },

    get quiz() { return data.quiz; },
    setQuiz(patch) { data.quiz = { ...data.quiz, ...patch }; emit('quiz'); },
    resetQuiz() { data.quiz = structuredClone(DEFAULTS.quiz); emit('quiz'); },

    get prefs() { return data.prefs; },
    /** silent: сохранить без перерисовки (например, после перетаскивания ползунка). */
    setPref(key, value, { silent = false } = {}) {
      data.prefs = { ...data.prefs, [key]: value };
      if (silent) persist(); else emit('prefs');
    },

    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
