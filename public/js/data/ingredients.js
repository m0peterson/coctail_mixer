// Каталог ингредиентов.
//
// Поля:
//   id, name   — идентификатор и название для рецепта
//   cat        — категория (см. CATEGORIES)
//   hint       — примеры марок / пояснение для выбора в баре
//   abv        — крепость, % (для оценки крепости коктейля)
//   family     — семейство алкоголя (для «основы» и опросника)
//   rarity     — 1: любой супермаркет, 2: хороший алкомаркет, 3: редкость / интернет
//   subs       — допустимые замены: id или массив id (нужны все сразу)
//   make       — можно сделать самому: { from: [...], how: '...' }
//   juiceName  — как называть в рецепте, если нужен сок (лайм → «сок лайма»)
//   solid      — твёрдое (сахар, соль): не добавляет объёма
//   mlPerPcs   — объём одной штуки (белок ≈ 30 мл)
//   effort     — доп. возня при приготовлении (домашние сиропы)
//   always     — всегда есть (вода)
//   hidden     — не показывать в выборе бара

export const CATEGORIES = [
  { id: 'spirits', name: 'Крепкий алкоголь', icon: '🥃' },
  { id: 'liqueurs', name: 'Ликёры', icon: '🍯' },
  { id: 'aperitifs', name: 'Вермуты и аперитивы', icon: '🍷' },
  { id: 'wine', name: 'Вино, игристое, пиво', icon: '🍾' },
  { id: 'mixers', name: 'Газировки и кофе', icon: '🫧' },
  { id: 'juices', name: 'Соки', icon: '🧃' },
  { id: 'fresh', name: 'Фрукты и зелень', icon: '🍋' },
  { id: 'sweet', name: 'Сиропы и сладкое', icon: '🍬' },
  { id: 'bitters', name: 'Биттеры', icon: '💧' },
  { id: 'dairy', name: 'Молочное и яйца', icon: '🥚' },
  { id: 'pantry', name: 'Специи и соусы', icon: '🧂' },
];

export const FAMILIES = [
  { id: 'vodka', name: 'Водка' },
  { id: 'gin', name: 'Джин' },
  { id: 'rum', name: 'Ром и кашаса' },
  { id: 'tequila', name: 'Текила и мескаль' },
  { id: 'whiskey', name: 'Виски' },
  { id: 'brandy', name: 'Коньяк, бренди, писко' },
  { id: 'aperitif', name: 'Аперитивы и вермуты' },
  { id: 'wine', name: 'Вино и игристое' },
  { id: 'liqueur', name: 'Ликёры' },
  { id: 'beer', name: 'Пиво' },
  { id: 'anise', name: 'Абсент' },
];

// Семейства, которые считаются «крепкой основой» коктейля.
export const STRONG_FAMILIES = ['vodka', 'gin', 'rum', 'tequila', 'whiskey', 'brandy', 'anise'];

export const INGREDIENTS = [
  // ── Крепкий алкоголь ─────────────────────────────────────────
  { id: 'vodka', name: 'Водка', cat: 'spirits', abv: 40, family: 'vodka', rarity: 1 },
  { id: 'gin', name: 'Джин', cat: 'spirits', abv: 40, family: 'gin', rarity: 1, hint: 'Beefeater, Gordon’s, Bombay' },
  { id: 'rum_white', name: 'Белый ром', cat: 'spirits', abv: 40, family: 'rum', rarity: 1, hint: 'Bacardi Carta Blanca, Havana 3', subs: ['rum_gold'] },
  { id: 'rum_gold', name: 'Золотой ром', cat: 'spirits', abv: 40, family: 'rum', rarity: 1, hint: 'выдержанный: Bacardi Oro, Havana 7', subs: ['rum_dark', 'rum_white'] },
  { id: 'rum_dark', name: 'Тёмный ром', cat: 'spirits', abv: 40, family: 'rum', rarity: 2, hint: 'Myers’s, Captain Morgan Dark, Gosling’s', subs: ['rum_gold'] },
  { id: 'rum_overproof', name: 'Крепкий ром (от 57%)', cat: 'spirits', abv: 63, family: 'rum', rarity: 3, hint: 'Wray & Nephew, Plantation OFTD', subs: ['rum_dark'] },
  { id: 'cachaca', name: 'Кашаса', cat: 'spirits', abv: 40, family: 'rum', rarity: 2, hint: 'бразильский тростниковый спирт' },
  { id: 'tequila', name: 'Текила', cat: 'spirits', abv: 40, family: 'tequila', rarity: 1, hint: 'бланко или репосадо, 100% агава', subs: ['mezcal'] },
  { id: 'mezcal', name: 'Мескаль', cat: 'spirits', abv: 42, family: 'tequila', rarity: 2, hint: 'дымный агавовый', subs: ['tequila'] },
  { id: 'bourbon', name: 'Бурбон', cat: 'spirits', abv: 43, family: 'whiskey', rarity: 1, hint: 'Jim Beam, Maker’s Mark, Jack Daniel’s', subs: ['rye'] },
  { id: 'rye', name: 'Ржаной виски', cat: 'spirits', abv: 45, family: 'whiskey', rarity: 2, hint: 'рай: Rittenhouse, Bulleit Rye', subs: ['bourbon'] },
  { id: 'scotch', name: 'Шотландский виски', cat: 'spirits', abv: 40, family: 'whiskey', rarity: 1, hint: 'купажированный: Johnnie Walker, Chivas', subs: ['irish'] },
  { id: 'scotch_islay', name: 'Дымный скотч (Айла)', cat: 'spirits', abv: 43, family: 'whiskey', rarity: 2, hint: 'Laphroaig, Ardbeg, Lagavulin' },
  { id: 'irish', name: 'Ирландский виски', cat: 'spirits', abv: 40, family: 'whiskey', rarity: 1, hint: 'Jameson, Bushmills', subs: ['scotch'] },
  { id: 'cognac', name: 'Коньяк / бренди', cat: 'spirits', abv: 40, family: 'brandy', rarity: 1 },
  { id: 'pisco', name: 'Писко', cat: 'spirits', abv: 40, family: 'brandy', rarity: 3, hint: 'перуанский или чилийский виноградный бренди' },
  { id: 'absinthe', name: 'Абсент', cat: 'spirits', abv: 60, family: 'anise', rarity: 2 },

  // ── Ликёры ───────────────────────────────────────────────────
  { id: 'triple_sec', name: 'Апельсиновый ликёр', cat: 'liqueurs', abv: 40, family: 'liqueur', rarity: 1, hint: 'трипл-сек: Cointreau, Grand Marnier, De Kuyper' },
  { id: 'blue_curacao', name: 'Блю кюрасао', cat: 'liqueurs', abv: 24, family: 'liqueur', rarity: 2, subs: ['triple_sec'] },
  { id: 'coffee_liqueur', name: 'Кофейный ликёр', cat: 'liqueurs', abv: 20, family: 'liqueur', rarity: 1, hint: 'Kahlúa, Tia Maria' },
  { id: 'amaretto', name: 'Амаретто', cat: 'liqueurs', abv: 28, family: 'liqueur', rarity: 1, hint: 'Disaronno' },
  { id: 'baileys', name: 'Сливочный ликёр', cat: 'liqueurs', abv: 17, family: 'liqueur', rarity: 1, hint: 'Baileys, Sheridan’s' },
  { id: 'maraschino', name: 'Мараскино', cat: 'liqueurs', abv: 32, family: 'liqueur', rarity: 3, hint: 'Luxardo Maraschino: прозрачный вишнёвый' },
  { id: 'chartreuse_green', name: 'Шартрёз зелёный', cat: 'liqueurs', abv: 55, family: 'liqueur', rarity: 3 },
  { id: 'chartreuse_yellow', name: 'Шартрёз жёлтый', cat: 'liqueurs', abv: 43, family: 'liqueur', rarity: 3 },
  { id: 'cassis', name: 'Смородиновый ликёр', cat: 'liqueurs', abv: 16, family: 'liqueur', rarity: 2, hint: 'крем де кассис' },
  { id: 'creme_de_mure', name: 'Ежевичный ликёр', cat: 'liqueurs', abv: 16, family: 'liqueur', rarity: 3, hint: 'крем де мюр', subs: ['cassis'] },
  { id: 'violette', name: 'Фиалковый ликёр', cat: 'liqueurs', abv: 16, family: 'liqueur', rarity: 3, hint: 'крем де виолет' },
  { id: 'drambuie', name: 'Драмбуи', cat: 'liqueurs', abv: 40, family: 'liqueur', rarity: 2, hint: 'медово-травяной на скотче' },
  { id: 'benedictine', name: 'Бенедиктин', cat: 'liqueurs', abv: 40, family: 'liqueur', rarity: 3 },
  { id: 'elderflower_liqueur', name: 'Ликёр бузины', cat: 'liqueurs', abv: 20, family: 'liqueur', rarity: 3, hint: 'St-Germain', subs: ['elderflower_syrup'] },
  { id: 'peach_schnapps', name: 'Персиковый ликёр', cat: 'liqueurs', abv: 20, family: 'liqueur', rarity: 2, hint: 'персиковый шнапс' },
  { id: 'creme_de_cacao', name: 'Какао-ликёр', cat: 'liqueurs', abv: 24, family: 'liqueur', rarity: 2, hint: 'крем де какао' },
  { id: 'creme_de_menthe', name: 'Мятный ликёр', cat: 'liqueurs', abv: 24, family: 'liqueur', rarity: 3, hint: 'крем де мент, зелёный' },
  { id: 'passoa', name: 'Ликёр маракуйи', cat: 'liqueurs', abv: 17, family: 'liqueur', rarity: 2, hint: 'Passoã' },
  { id: 'cherry_liqueur', name: 'Вишнёвый ликёр', cat: 'liqueurs', abv: 24, family: 'liqueur', rarity: 2, hint: 'Cherry Heering' },
  { id: 'falernum', name: 'Фалернум', cat: 'liqueurs', abv: 11, family: 'liqueur', rarity: 3, hint: 'пряный тики-ликёр' },

  // ── Вермуты и аперитивы ──────────────────────────────────────
  { id: 'campari', name: 'Кампари', cat: 'aperitifs', abv: 25, family: 'aperitif', rarity: 1 },
  { id: 'aperol', name: 'Апероль', cat: 'aperitifs', abv: 11, family: 'aperitif', rarity: 1 },
  { id: 'sweet_vermouth', name: 'Красный вермут', cat: 'aperitifs', abv: 16, family: 'aperitif', rarity: 1, hint: 'россо: Martini Rosso, Cinzano' },
  { id: 'dry_vermouth', name: 'Сухой вермут', cat: 'aperitifs', abv: 17, family: 'aperitif', rarity: 2, hint: 'Martini Extra Dry, Noilly Prat' },
  { id: 'bianco_vermouth', name: 'Белый вермут', cat: 'aperitifs', abv: 15, family: 'aperitif', rarity: 1, hint: 'бьянко: Martini Bianco' },
  { id: 'lillet', name: 'Лилле Блан', cat: 'aperitifs', abv: 17, family: 'aperitif', rarity: 3, hint: 'или Cocchi Americano' },
  { id: 'fernet', name: 'Фернет', cat: 'aperitifs', abv: 39, family: 'aperitif', rarity: 2, hint: 'Fernet-Branca' },
  { id: 'amaro', name: 'Амаро', cat: 'aperitifs', abv: 30, family: 'aperitif', rarity: 3, hint: 'Nonino, Montenegro, Averna' },
  { id: 'pimms', name: 'Pimm’s No.1', cat: 'aperitifs', abv: 25, family: 'aperitif', rarity: 3 },

  // ── Вино, игристое, пиво ─────────────────────────────────────
  { id: 'sparkling', name: 'Игристое вино', cat: 'wine', abv: 11, family: 'wine', rarity: 1, hint: 'просекко, брют, кава' },
  { id: 'wine_red', name: 'Красное сухое вино', cat: 'wine', abv: 13, family: 'wine', rarity: 1 },
  { id: 'wine_white', name: 'Белое сухое вино', cat: 'wine', abv: 12, family: 'wine', rarity: 1 },
  { id: 'beer', name: 'Светлое пиво', cat: 'wine', abv: 5, family: 'beer', rarity: 1, hint: 'лагер' },

  // ── Газировки и кофе ─────────────────────────────────────────
  { id: 'tonic', name: 'Тоник', cat: 'mixers', rarity: 1 },
  { id: 'soda', name: 'Содовая', cat: 'mixers', rarity: 1, hint: 'или газированная минералка' },
  { id: 'cola', name: 'Кола', cat: 'mixers', rarity: 1 },
  { id: 'ginger_beer', name: 'Имбирное пиво', cat: 'mixers', rarity: 2, hint: 'безалкогольное, острее эля', subs: ['ginger_ale'] },
  { id: 'ginger_ale', name: 'Имбирный эль', cat: 'mixers', rarity: 2, subs: ['ginger_beer'] },
  { id: 'lemonade', name: 'Спрайт / лимонад', cat: 'mixers', rarity: 1, hint: 'Sprite, 7Up', subs: [['soda', 'syrup', 'lemon']] },
  { id: 'grapefruit_soda', name: 'Грейпфрутовая газировка', cat: 'mixers', rarity: 2, hint: 'Schweppes Pink Grapefruit', subs: [['grapefruit_juice', 'soda']] },
  { id: 'coffee', name: 'Кофе (эспрессо)', cat: 'mixers', rarity: 1, hint: 'свежесваренный' },

  // ── Соки ─────────────────────────────────────────────────────
  { id: 'orange_juice', name: 'Апельсиновый сок', cat: 'juices', rarity: 1, hint: 'или свежие апельсины' },
  { id: 'cranberry_juice', name: 'Клюквенный сок', cat: 'juices', rarity: 1, hint: 'или клюквенный морс' },
  { id: 'pineapple_juice', name: 'Ананасовый сок', cat: 'juices', rarity: 1 },
  { id: 'grapefruit_juice', name: 'Грейпфрутовый сок', cat: 'juices', rarity: 1, hint: 'или свежий грейпфрут' },
  { id: 'tomato_juice', name: 'Томатный сок', cat: 'juices', rarity: 1 },
  { id: 'pomegranate_juice', name: 'Гранатовый сок', cat: 'juices', rarity: 1 },
  { id: 'peach_puree', name: 'Персиковое пюре', cat: 'juices', rarity: 1, hint: 'или персиковый нектар' },
  { id: 'passion_fruit', name: 'Маракуйя', cat: 'juices', rarity: 3, hint: 'свежая или пюре', effort: 0.2 },

  // ── Фрукты и зелень ──────────────────────────────────────────
  { id: 'lime', name: 'Лайм', juiceName: 'Сок лайма', cat: 'fresh', rarity: 1 },
  { id: 'lemon', name: 'Лимон', juiceName: 'Сок лимона', cat: 'fresh', rarity: 1 },
  { id: 'mint', name: 'Мята', cat: 'fresh', rarity: 1 },
  { id: 'basil', name: 'Базилик', cat: 'fresh', rarity: 1 },
  { id: 'cucumber', name: 'Огурец', cat: 'fresh', rarity: 1 },
  { id: 'raspberry', name: 'Малина', cat: 'fresh', rarity: 1, hint: 'можно замороженную' },
  { id: 'ginger', name: 'Имбирь (корень)', cat: 'fresh', rarity: 1 },

  // ── Сиропы и сладкое ─────────────────────────────────────────
  { id: 'sugar', name: 'Сахар', cat: 'sweet', rarity: 1, solid: true },
  {
    id: 'syrup', name: 'Сахарный сироп', cat: 'sweet', rarity: 1,
    make: { from: ['sugar'], how: 'Сахар и горячая вода 1:1 по объёму, размешай до растворения. В холодильнике живёт 2 недели.' },
  },
  { id: 'honey', name: 'Мёд', cat: 'sweet', rarity: 1 },
  {
    id: 'honey_syrup', name: 'Медовый сироп', cat: 'sweet', rarity: 1, effort: 0.2,
    make: { from: ['honey'], how: 'Мёд и горячая вода 1:1, размешай. Густой мёд без разбавления в холодном шейкере не растворится.' },
  },
  {
    id: 'honey_ginger_syrup', name: 'Медово-имбирный сироп', cat: 'sweet', rarity: 3, effort: 0.6,
    make: { from: ['honey', 'ginger'], how: 'Мёд и горячая вода 1:1, добавь столовую ложку тёртого имбиря на 100 мл, настой 20–30 минут и процеди.' },
  },
  { id: 'agave', name: 'Сироп агавы', cat: 'sweet', rarity: 2, subs: ['honey_syrup', 'syrup'] },
  {
    id: 'grenadine', name: 'Гренадин', cat: 'sweet', rarity: 1, hint: 'гранатовый сироп',
    make: { from: ['pomegranate_juice', 'sugar'], how: 'Гранатовый сок и сахар 1:1, прогрей до растворения сахара, не кипяти, остуди.' },
  },
  { id: 'orgeat', name: 'Оршад (миндальный сироп)', cat: 'sweet', rarity: 2, hint: 'Monin, Barinoff' },
  {
    id: 'raspberry_syrup', name: 'Малиновый сироп', cat: 'sweet', rarity: 1,
    make: { from: ['raspberry', 'sugar'], how: 'Малина, сахар и вода 1:1:1, прогрей 5 минут, разомни и процеди.' },
  },
  { id: 'elderflower_syrup', name: 'Сироп бузины', cat: 'sweet', rarity: 2, subs: ['elderflower_liqueur'] },
  {
    id: 'vanilla_syrup', name: 'Ванильный сироп', cat: 'sweet', rarity: 1,
    make: { from: ['sugar', 'vanilla'], how: 'Сахарный сироп 1:1 плюс ванильный сахар или разрезанный стручок ванили, настой пару часов.' },
  },
  {
    id: 'cinnamon_syrup', name: 'Коричный сироп', cat: 'sweet', rarity: 2,
    make: { from: ['sugar', 'cinnamon'], how: 'Сахарный сироп 1:1, прогрей с 2–3 палочками корицы 10 минут, настой ночь, процеди.' },
  },
  { id: 'coconut_cream', name: 'Кокосовые сливки', cat: 'sweet', rarity: 2, hint: 'сладкие, типа Coco López; или кокосовое молоко + сироп' },

  // ── Биттеры ──────────────────────────────────────────────────
  { id: 'angostura', name: 'Ангостура', cat: 'bitters', abv: 45, rarity: 2 },
  { id: 'peychauds', name: 'Биттер Пейшо', cat: 'bitters', abv: 35, rarity: 3, hint: 'Peychaud’s', subs: ['angostura'] },
  { id: 'orange_bitters', name: 'Апельсиновый биттер', cat: 'bitters', abv: 28, rarity: 3, subs: ['angostura'] },

  // ── Молочное и яйца ──────────────────────────────────────────
  { id: 'cream', name: 'Сливки', cat: 'dairy', rarity: 1, hint: '20–33%', subs: ['milk'] },
  { id: 'milk', name: 'Молоко', cat: 'dairy', rarity: 1 },
  { id: 'egg', name: 'Яичный белок', cat: 'dairy', rarity: 1, hint: 'свежие яйца или аквафаба', mlPerPcs: 30 },

  // ── Специи и соусы ───────────────────────────────────────────
  { id: 'salt', name: 'Соль', cat: 'pantry', rarity: 1, solid: true },
  { id: 'pepper', name: 'Чёрный перец', cat: 'pantry', rarity: 1, solid: true },
  { id: 'tabasco', name: 'Табаско', cat: 'pantry', rarity: 1, hint: 'или другой острый соус' },
  { id: 'worcestershire', name: 'Вустерширский соус', cat: 'pantry', rarity: 2 },
  { id: 'nutmeg', name: 'Мускатный орех', cat: 'pantry', rarity: 1, solid: true },
  { id: 'cinnamon', name: 'Корица', cat: 'pantry', rarity: 1, solid: true, hint: 'лучше палочки' },
  { id: 'cloves', name: 'Гвоздика', cat: 'pantry', rarity: 1, solid: true },
  { id: 'vanilla', name: 'Ваниль', cat: 'pantry', rarity: 1, solid: true, hint: 'стручок или ванильный сахар' },
  { id: 'orange_flower_water', name: 'Флёрдоранжевая вода', cat: 'pantry', rarity: 3, hint: 'апельсиновая цветочная вода' },

  // ── Всегда есть ──────────────────────────────────────────────
  { id: 'water', name: 'Вода', cat: 'pantry', always: true, hidden: true },
];
