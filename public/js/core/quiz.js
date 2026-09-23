// Опросник: вопросы и подсчёт совпадения коктейля с ответами.

export const QUIZ_SPIRITS = ['vodka', 'gin', 'rum', 'tequila', 'whiskey', 'brandy', 'aperitif', 'wine', 'liqueur'];

export const QUESTIONS = [
  {
    id: 'mood', type: 'single', title: 'Какое настроение?',
    options: [
      { id: 'refresh', label: 'Освежиться', hint: 'холодное, лёгкое, с пузырьками' },
      { id: 'chill', label: 'Посмаковать вечером', hint: 'медленно, крепко, со вкусом' },
      { id: 'party', label: 'Вечеринка', hint: 'чтобы легко заходило' },
      { id: 'dessert', label: 'Сладкое вместо десерта', hint: 'сливки, кофе, шоколад' },
      { id: 'impress', label: 'Удивить себя или гостей', hint: 'необычные сочетания' },
      { id: 'any', label: 'Без разницы' },
    ],
  },
  {
    id: 'strength', type: 'single', title: 'Насколько крепко?',
    options: [
      { id: 'zero', label: 'Без алкоголя' },
      { id: 'light', label: 'Легонько', hint: 'до 9%, как пиво или сидр' },
      { id: 'medium', label: 'Средне', hint: '9–16%, как вино' },
      { id: 'strong', label: 'Крепко', hint: 'от 16% и выше' },
      { id: 'any', label: 'Без разницы' },
    ],
  },
  {
    id: 'likes', type: 'multi', title: 'Какие вкусы нравятся?', subtitle: 'Можно выбрать несколько или пропустить',
    options: [
      { id: 'sour', label: 'Кислое' },
      { id: 'sweet', label: 'Сладкое' },
      { id: 'bitter', label: 'Горькое' },
      { id: 'fruity', label: 'Фрукты и ягоды' },
      { id: 'citrus', label: 'Цитрусы' },
      { id: 'herbal', label: 'Травы и мята' },
      { id: 'spicy', label: 'Пряное и острое' },
      { id: 'creamy', label: 'Сливочное' },
      { id: 'coffee', label: 'Кофе и шоколад' },
      { id: 'smoky', label: 'Дымное' },
      { id: 'fizzy', label: 'С пузырьками' },
    ],
  },
  {
    id: 'dislikes', type: 'multi', title: 'Что точно не надо?', subtitle: 'Такие коктейли уберём из выдачи',
    options: [
      { id: 'bitter', label: 'Горечь' },
      { id: 'sweet', label: 'Приторность' },
      { id: 'sour', label: 'Сильная кислота' },
      { id: 'fizzy', label: 'Газировка' },
      { id: 'dairy', label: 'Сливки и молоко' },
      { id: 'egg', label: 'Сырой белок' },
      { id: 'coffee', label: 'Кофе' },
      { id: 'mint', label: 'Мята' },
      { id: 'anise', label: 'Анис и абсент' },
      { id: 'smoky', label: 'Дым' },
      { id: 'savory', label: 'Томат и острое' },
    ],
  },
  {
    id: 'spirits', type: 'spirits', title: 'Как ты к этому относишься?', subtitle: 'Отметь любимое и то, что не пьёшь',
    families: QUIZ_SPIRITS,
  },
  {
    id: 'effort', type: 'single', title: 'Сколько готов возиться?',
    options: [
      { id: 'lazy', label: 'Налил и смешал', hint: 'без шейкера и заготовок' },
      { id: 'shaker', label: 'Шейкер не пугает', hint: 'но без фанатизма' },
      { id: 'pro', label: 'Готов на всё ради вкуса', hint: 'белок, слои, домашние сиропы' },
    ],
  },
  {
    id: 'bar', type: 'single', title: 'Учитывать твой бар?',
    options: [
      { id: 'have', label: 'Только из того, что есть' },
      { id: 'buy', label: 'Можно докупить 1–2 штуки' },
      { id: 'any', label: 'Неважно, покажи лучшее' },
    ],
  },
  {
    id: 'vibe', type: 'single', title: 'Классика или эксперимент?',
    options: [
      { id: 'classic', label: 'Проверенная классика' },
      { id: 'new', label: 'Хочу необычного' },
      { id: 'any', label: 'Без разницы' },
    ],
  },
];

const hasTag = (c, ...tags) => tags.some((t) => c.tags.includes(t));
const uses = (c, ...ids) => ids.some((id) => c.requiredIds.includes(id));

const LIKE_MATCH = {
  sour: (c) => c.sour >= 2,
  sweet: (c) => c.sweet >= 2,
  bitter: (c) => c.bitter >= 2,
  fruity: (c) => hasTag(c, 'fruity', 'berry', 'tropical'),
  citrus: (c) => hasTag(c, 'citrus'),
  herbal: (c) => hasTag(c, 'herbal', 'mint', 'floral'),
  spicy: (c) => hasTag(c, 'spicy', 'savory'),
  creamy: (c) => hasTag(c, 'creamy', 'silky'),
  coffee: (c) => hasTag(c, 'coffee', 'chocolate'),
  smoky: (c) => hasTag(c, 'smoky'),
  fizzy: (c) => hasTag(c, 'fizzy'),
};

// Возвращает 'exclude', штраф (отрицательное число) или 0
const DISLIKE_RULES = {
  bitter: (c) => (c.bitter >= 2 ? 'exclude' : c.bitter === 1 ? -1 : 0),
  sweet: (c) => (c.sweet >= 3 ? 'exclude' : 0),
  sour: (c) => (c.sour >= 3 ? 'exclude' : c.sour === 2 ? -1 : 0),
  fizzy: (c) => (hasTag(c, 'fizzy') ? 'exclude' : 0),
  dairy: (c) => (uses(c, 'cream', 'milk', 'baileys') ? 'exclude' : 0),
  egg: (c) => (uses(c, 'egg') ? 'exclude' : 0),
  coffee: (c) => (hasTag(c, 'coffee') || uses(c, 'coffee', 'coffee_liqueur') ? 'exclude' : 0),
  mint: (c) => (hasTag(c, 'mint') || uses(c, 'mint', 'creme_de_menthe') ? 'exclude' : 0),
  anise: (c) => (hasTag(c, 'anise') || uses(c, 'absinthe') ? 'exclude' : 0),
  smoky: (c) => (hasTag(c, 'smoky') ? 'exclude' : 0),
  savory: (c) => (hasTag(c, 'savory') || uses(c, 'tomato_juice', 'tabasco') ? 'exclude' : 0),
};

const STRENGTH_TARGET = { zero: [0], light: [1], medium: [2], strong: [3, 4] };

export function isQuizEmpty(answers) {
  if (!answers) return true;
  return QUESTIONS.every((q) => {
    const a = answers[q.id];
    if (q.type === 'multi') return !a || a.length === 0;
    if (q.type === 'spirits') return !a || Object.values(a).every((v) => v === 'ok');
    return !a || a === 'any';
  });
}

/**
 * Оценивает коктейль по ответам.
 * ctx: { missing(c) → число недостающих, familyName(id) → название }
 * Возвращает { excluded, score, max, reasons }.
 */
export function scoreCocktail(c, answers, ctx) {
  let score = 0;
  let max = 0;
  const reasons = [];

  // ── Жёсткие фильтры ──
  for (const d of answers.dislikes || []) {
    const r = DISLIKE_RULES[d]?.(c);
    if (r === 'exclude') return { excluded: true };
    if (r) score += r;
  }
  const spirits = answers.spirits || {};
  for (const [fam, attitude] of Object.entries(spirits)) {
    if (attitude === 'no' && (c.familyVolumes[fam] || 0) >= 5) return { excluded: true };
  }
  if (answers.strength === 'zero' && c.strength.id !== 'zero') return { excluded: true };

  const missing = ctx.missing(c);
  if (answers.bar === 'have' && missing > 0) return { excluded: true };
  if (answers.bar === 'buy' && missing > 2) return { excluded: true };

  // ── Крепость ──
  const target = STRENGTH_TARGET[answers.strength];
  if (target) {
    max += 3;
    const dist = Math.min(...target.map((t) => Math.abs(t - c.strength.index)));
    if (dist === 0) { score += 3; reasons.push(`крепость: ${c.strength.name.toLowerCase()}`); }
    else if (dist === 1) score += 1;
    else if (dist === 2) score -= 2;
    else score -= 4;
  }

  // ── Любимые вкусы ──
  const likes = answers.likes || [];
  if (likes.length) {
    const matched = likes.filter((l) => LIKE_MATCH[l]?.(c));
    const cap = Math.min(likes.length, 3);
    max += cap * 2;
    if (matched.length) {
      score += Math.min(matched.length, cap) * 2;
      const labels = QUESTIONS.find((q) => q.id === 'likes').options;
      reasons.push(matched.map((m) => labels.find((o) => o.id === m).label.toLowerCase()).join(', '));
    } else {
      score -= 2;
    }
  }

  // ── Любимый алкоголь ──
  const loved = Object.entries(spirits).filter(([, a]) => a === 'love').map(([f]) => f);
  if (loved.length) {
    max += 3;
    if (loved.includes(c.base)) { score += 3; reasons.push(`на основе: ${ctx.familyName(c.base).toLowerCase()}`); }
    else if (loved.some((f) => (c.familyVolumes[f] || 0) >= 10)) score += 1;
  }

  // ── Настроение ──
  switch (answers.mood) {
    case 'refresh':
      max += 2;
      if (hasTag(c, 'fizzy', 'refreshing')) { score += 2; reasons.push('освежает'); }
      if (c.strength.index >= 3) score -= 1;
      if (hasTag(c, 'hot')) score -= 3;
      break;
    case 'chill':
      max += 2;
      if (hasTag(c, 'boozy') || c.method === 'stir') { score += 2; reasons.push('для неспешного вечера'); }
      break;
    case 'party':
      max += 3;
      if (c.drink >= 4) { score += 2; reasons.push('легко пьётся'); }
      if (c.ease >= 3.5) score += 1;
      break;
    case 'dessert':
      max += 3;
      if (hasTag(c, 'dessert', 'creamy', 'coffee', 'chocolate')) { score += 3; reasons.push('десертный'); }
      else if (c.sweet >= 3) score += 1;
      break;
    case 'impress':
      max += 3;
      if (c.wow >= 4) { score += 3; reasons.push('удивит'); }
      else if (c.wow === 3) score += 1;
      break;
    default:
  }

  // ── Возня ──
  switch (answers.effort) {
    case 'lazy':
      max += 2;
      if (c.ease >= 4) { score += 2; reasons.push('готовится за минуту'); }
      else if (c.ease < 3) score -= 3;
      break;
    case 'shaker':
      max += 1;
      if (c.ease >= 2.5) score += 1;
      else if (c.ease < 2) score -= 2;
      break;
    case 'pro':
      max += 1;
      if (c.wow >= 4) score += 1;
      break;
    default:
  }

  // ── Бар ──
  if (answers.bar === 'have') { max += 2; score += 2; reasons.push('всё есть в баре'); }
  else if (answers.bar === 'buy') {
    max += 2;
    if (missing === 0) { score += 2; reasons.push('всё есть в баре'); }
    else if (missing === 1) { score += 1; reasons.push('докупить одно'); }
  } else if (answers.bar === 'any' && missing === 0) { max += 1; score += 1; reasons.push('всё есть в баре'); }

  // ── Классика или новое ──
  if (answers.vibe === 'classic') {
    max += 2;
    if (c.classic) { score += 2; reasons.push('классика'); }
    else if (c.wow >= 5) score -= 1;
  } else if (answers.vibe === 'new') {
    max += 2;
    if (c.wow >= 4) { score += 2; reasons.push('необычный'); }
    else if (c.wow <= 2) score -= 2;
  }

  // Мягкий тай-брейк: питкость, а для вечера со смаком — необычность
  const tiebreak = answers.mood === 'chill' ? (c.wow - 3) * 0.3 : (c.drink - 3) * 0.3;

  return { excluded: false, score: score + tiebreak, max, reasons };
}

/** Ранжирует коктейли по ответам. */
export function rankByQuiz(cocktails, answers, ctx, limit = 12) {
  const scored = [];
  for (const c of cocktails) {
    const r = scoreCocktail(c, answers, ctx);
    if (r.excluded) continue;
    const match = r.max > 0 ? Math.max(0, Math.min(1, r.score / r.max)) : null;
    scored.push({ cocktail: c, ...r, match });
  }
  scored.sort((a, b) => b.score - a.score || b.cocktail.drink - a.cocktail.drink);
  return { results: scored.slice(0, limit), total: scored.length };
}
