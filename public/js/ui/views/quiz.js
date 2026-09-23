// «Подбор»: опросник по вкусам и выдача с процентом совпадения.

import { esc, icons } from '../dom.js';
import { count } from '../../core/format.js';
import { QUESTIONS, rankByQuiz, isQuizEmpty } from '../../core/quiz.js';
import { cardGrid, emptyState } from '../components.js';

const ATTITUDES = [['love', '♥ люблю'], ['ok', 'норм'], ['no', '✕ не пью']];

function renderQuestion(q, answers, ctx) {
  const a = answers[q.id];
  if (q.type === 'spirits') {
    const cur = a || {};
    return `<div class="spirits">${q.families.map((f) => {
      const val = cur[f] || 'ok';
      const buttons = ATTITUDES.map(([v, label]) => `<button type="button" data-action="spirit" data-family="${f}" data-val="${v}" aria-pressed="${val === v}">${label}</button>`).join('');
      return `<div class="spirit"><span class="spirit__name">${esc(ctx.catalog.familyById[f].name)}</span><div class="seg" role="group" aria-label="${esc(ctx.catalog.familyById[f].name)}">${buttons}</div></div>`;
    }).join('')}</div>`;
  }
  const selected = q.type === 'multi' ? new Set(a || []) : new Set(a ? [a] : []);
  return `<div class="options">${q.options.map((o) => `
    <button type="button" class="option" data-action="answer" data-q="${q.id}" data-val="${o.id}" aria-pressed="${selected.has(o.id)}">
      ${esc(o.label)}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}
    </button>`).join('')}</div>`;
}

function profileChips(answers, ctx) {
  const chips = [];
  for (const q of QUESTIONS) {
    const a = answers[q.id];
    if (!a) continue;
    if (q.type === 'spirits') {
      for (const [f, v] of Object.entries(a)) {
        if (v === 'love') chips.push(`♥ ${ctx.catalog.familyById[f].name}`);
        if (v === 'no') chips.push(`без: ${ctx.catalog.familyById[f].name.toLowerCase()}`);
      }
    } else if (q.type === 'multi') {
      const labels = a.map((id) => q.options.find((o) => o.id === id)?.label.toLowerCase()).filter(Boolean);
      if (labels.length) chips.push(q.id === 'dislikes' ? `не надо: ${labels.join(', ')}` : `нравится: ${labels.join(', ')}`);
    } else if (a !== 'any') {
      chips.push(q.options.find((o) => o.id === a)?.label);
    }
  }
  return chips.map((c) => `<span class="reason">${esc(c)}</span>`).join('');
}

function renderResults(ctx) {
  const { answers } = ctx.store.quiz;
  const { results, total } = rankByQuiz(ctx.catalog.cocktails, answers, {
    missing: (c) => ctx.ev(c).missingCount,
    familyName: (id) => ctx.catalog.familyById[id]?.name || id,
  });
  const barNote = answers.bar === 'have' && !ctx.store.bar.size
    ? emptyState({
      icon: '🧺',
      title: 'Бар пустой',
      text: 'Ты попросил подбирать только из того, что есть, а в баре ничего не отмечено.',
      actions: '<a class="btn btn--primary" href="#/bar">Заполнить бар</a><button type="button" class="btn" data-action="quiz-bar-any">Искать без учёта бара</button>',
    })
    : '';
  const list = results.length
    ? cardGrid(results.map((r) => ({ cocktail: r.cocktail, ev: ctx.ev(r.cocktail), match: r.match, reasons: r.reasons })), ctx)
    : barNote || emptyState({
      icon: '🤷',
      title: 'Под такие условия ничего нет',
      text: 'Фильтры получились слишком строгими. Убери пару пунктов из «точно не надо» или разреши докупить ингредиенты.',
      actions: '<button type="button" class="btn btn--primary" data-action="quiz-edit">Изменить ответы</button>',
    });
  return `
    <div class="page-head">
      <div class="page-head__text">
        <h1>Тебе подойдёт</h1>
        <p>${total ? `Подходит ${count(total, ['коктейль', 'коктейля', 'коктейлей'])}, вот лучшие. Процент — насколько совпало с ответами.` : ''}</p>
        <div class="profile">${profileChips(answers, ctx)}</div>
      </div>
      <div class="btn-row">
        <button type="button" class="btn btn--sm" data-action="quiz-edit">Изменить ответы</button>
        <button type="button" class="btn btn--sm btn--ghost" data-action="quiz-reset">${icons.reset}Заново</button>
      </div>
    </div>
    ${list}`;
}

export default {
  id: 'quiz',
  title: 'Подбор',

  render(ctx) {
    const { answers, step, done } = ctx.store.quiz;
    if (done) return renderResults(ctx);

    const i = Math.min(step, QUESTIONS.length - 1);
    const q = QUESTIONS[i];
    const last = i === QUESTIONS.length - 1;
    const progress = Math.round((i / QUESTIONS.length) * 100);
    const needsNext = q.type !== 'single';
    return `
      <div class="quiz">
        <div class="page-head"><div class="page-head__text">
          <h1>Подбор по вкусу</h1>
          <p>${QUESTIONS.length} коротких вопросов. Любой можно пропустить.</p>
        </div></div>
        <div class="quiz__step"><span>Вопрос ${i + 1} из ${QUESTIONS.length}</span>${isQuizEmpty(answers) ? '' : '<button type="button" class="btn btn--sm btn--ghost" data-action="quiz-finish">Показать результат</button>'}</div>
        <div class="quiz__progress" aria-hidden="true"><i style="width:${progress}%"></i></div>
        <div class="quiz__card">
          <h2>${esc(q.title)}</h2>
          ${q.subtitle ? `<p>${esc(q.subtitle)}</p>` : ''}
          ${renderQuestion(q, answers, ctx)}
          <div class="quiz__nav">
            <button type="button" class="btn btn--ghost" data-action="quiz-back" ${i === 0 ? 'disabled' : ''}>${icons.back}Назад</button>
            <div class="btn-row">
              ${!last ? `<button type="button" class="btn btn--ghost" data-action="quiz-skip">Пропустить</button>` : ''}
              ${needsNext || last ? `<button type="button" class="btn btn--primary" data-action="${last ? 'quiz-finish' : 'quiz-next'}">${last ? 'Показать результат' : 'Дальше'} ${icons.arrow}</button>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  },

  onAction(action, el, ctx) {
    const { store } = ctx;
    const quiz = store.quiz;
    const step = Math.min(quiz.step, QUESTIONS.length - 1);
    const go = (patch) => { store.setQuiz(patch); window.scrollTo({ top: 0 }); };

    switch (action) {
      case 'answer': {
        const q = QUESTIONS.find((x) => x.id === el.dataset.q);
        const val = el.dataset.val;
        if (q.type === 'multi') {
          const cur = new Set(quiz.answers[q.id] || []);
          if (cur.has(val)) cur.delete(val); else cur.add(val);
          store.setQuiz({ answers: { ...quiz.answers, [q.id]: [...cur] } });
        } else {
          const answers = { ...quiz.answers, [q.id]: val };
          const last = step === QUESTIONS.length - 1;
          go(last ? { answers } : { answers, step: step + 1 });
        }
        return true;
      }
      case 'spirit': {
        const spirits = { ...(quiz.answers.spirits || {}), [el.dataset.family]: el.dataset.val };
        store.setQuiz({ answers: { ...quiz.answers, spirits } });
        return true;
      }
      case 'quiz-next':
      case 'quiz-skip':
        go({ step: Math.min(step + 1, QUESTIONS.length - 1) });
        return true;
      case 'quiz-back':
        go({ step: Math.max(0, step - 1) });
        return true;
      case 'quiz-finish':
        go({ done: true });
        return true;
      case 'quiz-edit':
        go({ done: false, step: 0 });
        return true;
      case 'quiz-reset':
        store.resetQuiz();
        window.scrollTo({ top: 0 });
        return true;
      case 'quiz-bar-any':
        store.setQuiz({ answers: { ...quiz.answers, bar: 'any' } });
        return true;
      default:
        return false;
    }
  },
};
