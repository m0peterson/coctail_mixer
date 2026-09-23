// Русские склонения, числа и единицы измерения.

/** plural(5, ['коктейль', 'коктейля', 'коктейлей']) → 'коктейлей' */
export function plural(n, forms) {
  const abs = Math.abs(n);
  if (!Number.isInteger(abs)) return forms[1];
  const n10 = abs % 10;
  const n100 = abs % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1];
  return forms[2];
}

/** «5 коктейлей» */
export function count(n, forms) {
  return `${n} ${plural(n, forms)}`;
}

const FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

/** Число по-русски: 7.5 → «7,5», 0.5 → «½», 1.5 → «1½» (для штук). */
export function num(x, { fractions = false } = {}) {
  if (fractions) {
    const whole = Math.floor(x);
    const frac = Math.round((x - whole) * 100) / 100;
    if (FRACTIONS[frac]) return `${whole || ''}${FRACTIONS[frac]}`;
  }
  const rounded = Math.round(x * 10) / 10;
  return String(rounded).replace('.', ',');
}

// Формы единиц: [1, 2–4, 5+]
const UNITS = {
  ml: { forms: ['мл', 'мл', 'мл'] },
  dash: { forms: ['дэш', 'дэша', 'дэшей'] },
  drop: { forms: ['капля', 'капли', 'капель'] },
  bsp: { forms: ['бар. ложка', 'бар. ложки', 'бар. ложек'], fractions: true },
  tsp: { forms: ['ч. л.', 'ч. л.', 'ч. л.'], fractions: true },
  tbsp: { forms: ['ст. л.', 'ст. л.', 'ст. л.'], fractions: true },
  pcs: { forms: ['шт.', 'шт.', 'шт.'], fractions: true },
  leaf: { forms: ['лист', 'листа', 'листьев'] },
  wedge: { forms: ['долька', 'дольки', 'долек'], fractions: true },
  slice: { forms: ['ломтик', 'ломтика', 'ломтиков'], fractions: true },
  stick: { forms: ['палочка', 'палочки', 'палочек'], fractions: true },
  pinch: { forms: ['щепотка', 'щепотки', 'щепоток'] },
};

/** Текст количества для строки рецепта с учётом числа порций. */
export function formatAmount(amount, unit = 'ml', servings = 1) {
  if (unit === 'rinse') return 'ополоснуть бокал';
  if (unit === 'top') return `долить ~${num(amount * servings)} мл`;
  const spec = UNITS[unit] || UNITS.ml;
  const value = amount * servings;
  // Щепотки и капли округляем до целых, остальное оставляем как есть
  const shown = unit === 'pinch' || unit === 'drop' || unit === 'leaf' ? Math.max(1, Math.round(value)) : value;
  const isWhole = Number.isInteger(shown);
  const form = isWhole ? plural(shown, spec.forms) : spec.forms[1];
  return `${num(shown, { fractions: spec.fractions })} ${form}`;
}

/** 0.186 → «19%» */
export function percent(fraction) {
  return `${Math.round(fraction * 100)}%`;
}
