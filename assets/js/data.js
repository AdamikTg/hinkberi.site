/*
  ДАННЫЕ САЙТА ХИНКБЕРИ
  Здесь лежит всё содержимое, общее для всех вариантов: контакты, меню, отзывы.
  Чтобы поменять цену или добавить блюдо, правьте только этот файл.

  Источники:
  - меню: фото доски меню от владельца (27.09.2026), цены крыльев уточнены владельцем;
  - добавлено владельцем 01.10.2026, вместе с фотографиями: Натахтари Тархун и Груша (150 ₽, 0,5 л)
    и сэндвич «Ветчина Индейка» (250 ₽). Состав сэндвича владелец пока не назвал, поэтому описания нет;
  - фотографии Стрипс ролла, Шавермы, Колд брю, Рафа с урбечом и Шота тоже присланы владельцем 01-02.10.2026
    (на фото Колд брю три бутылки с надписью «УССУ» по 250 мл: кизил, малина, черника);
  - фотографии Мохито клубничного, Манго-маракуйи, Кровавой Мэри, классического мохито, молочного коктейля, какао, бамбла, айс кофе с урбечом, эспрессо, латте, флэт уайта, айс латте, рафа, шаурмы с курицей и цезарь ролла заменены на присланные владельцем (01-02.10.2026);
  - «Лимонад мохито» по просьбе владельца переименован в «Мохито Классический»;
  - у Капучино, Американо и Какао своё фото на каждый размер (200 и 300 мл), прислал владелец 02.10.2026.
    Обе чашки сняты в одном масштабе, поэтому при выборе 300 мл чашка становится больше;
  - у Острых крыльев своё фото на 5, 10 и 15 шт (владелец, 02.10.2026). Крылья на всех трёх одного размера,
    поэтому коробка растёт вместе с порцией;
  - у Стрипсов своё фото на 3, 5 и 7 шт (владелец, 04.10.2026). Стрипсы на всех трёх одного размера,
    поэтому коробка растёт вместе с порцией. У фото 7 шт крышка была обрезана краем кадра, её срезали по сгибу;
  - у Наггетсов своё фото на 4, 6 и 12 шт (владелец, 04.10.2026), наггетсы на всех трёх одного размера;
  - у Сырных палочек своё фото на 3, 6 и 12 шт (владелец, 05.10.2026), палочки одной толщины; коробка на 3 шт
    чуть крупнее строгого масштаба, чтобы карточка не была пустой. На фото «12 шт» видно 8 палочек;
  - у Картофеля фри своё фото на «Средний» и «Большой» (владелец, 05.10.2026; владелец назвал первый «маленькой»,
    подпись осталась как на доске меню), оба в одном масштабе на общей нижней линии;
  - у Картофеля по-деревенски своё фото на «Средний» и «Большой» (владелец, 05.10.2026): квадратная коробка
    «Средний» (wedges-box), длинный лоток «Большой» (wedges-tray), так подтвердил владелец. Фото вписаны в карточку
    каждое отдельно, без общего масштаба;
  - часы работы 10:00-20:00 назвал владелец 02.10.2026;
  - рейтинг и отзывы: пробный сайт hink-beri.vercel.app и Яндекс Карты.
  Пункты с пометкой verify: true прочитаны с мелкой фотографии, их стоит сверить.
*/
window.HB = {
  info: {
    name: 'ХинкБери',
    address: 'Старокачаловская ул., вл5А, Москва',
    addressShort: 'Старокачаловская, 5А',
    hours: 'Каждый день с 10:00 до 20:00',
    hoursShort: '10:00-20:00',
    slogan: 'Вкусно. Сытно. Для тебя.',
    rating: '4,7',
    mapsOrg: 'https://yandex.ru/maps/org/169433331462/',
    mapsReviews: 'https://yandex.ru/maps/org/169433331462/reviews/',
    mapsRoute: 'https://yandex.ru/maps/?rtext=~55.570706,37.578046',
    mapWidget: 'https://yandex.ru/map-widget/v1/?ll=37.578046%2C55.570706&z=17&pt=37.578046%2C55.570706%2Cpm2grm'
  },

  menu: [
    {
      id: 'бургеры', title: 'Бургеры',
      items: [
        { name: 'Бургер куриный', desc: 'Куриная котлета, салат, томат, сыр, огурчики, сырный соус', photo: 'burger-chicken', price: 350 },
        { name: 'Бургер говядина', desc: 'Говяжья котлета, салат, томат, сыр, огурчики, соус', photo: 'burger-beef', price: 490 }
      ]
    },
    {
      id: 'роллы', title: 'Роллы и шаурма',
      items: [
        { name: 'Цезарь ролл', desc: 'Курица, салат, томат, сыр и соус цезарь в лаваше', photo: 'caesar-roll', price: 290 },
        { name: 'Стрипс ролл', desc: 'Куриные стрипсы, салат, томат, сыр, сырный соус', photo: 'strips-roll', price: 300 },
        { name: 'Шаурма с курицей', desc: 'Курица, капуста, томат, огурец, лук, соус', photo: 'shawarma-chicken', price: 300 },
        { name: 'Шаверма', desc: 'Курица, капуста, овощи, сыр, картофель фри, соус', photo: 'shaverma', price: 350 }
      ]
    },
    {
      id: 'сэндвичи', title: 'Сэндвичи',
      items: [
        { name: 'Сэндвич «Ветчина Индейка»', photo: 'sandwich-ham-turkey', price: 250 }
      ]
    },
    {
      id: 'закуски', title: 'Закуски',
      items: [
        { name: 'Острые крылья', desc: 'Хрустящие, в остром маринаде', photo: 'wings',
          options: [{ label: 'S, 5 шт', price: 210, photo: 'wings' }, { label: 'M, 10 шт', price: 370, photo: 'wings-10' },
                    { label: 'L, 15 шт', price: 450, photo: 'wings-15' }] },
        { name: 'Стрипсы', desc: 'Куриное филе в хрустящей панировке', photo: 'strips-3', verify: true,
          options: [{ label: '3 шт', price: 210, photo: 'strips-3' }, { label: '5 шт', price: 310, photo: 'strips-5' },
                    { label: '7 шт', price: 450, photo: 'strips-7' }] },
        { name: 'Наггетсы', desc: 'Нежная курица в панировке', photo: 'nuggets-4', verify: true,
          options: [{ label: '4 шт', price: 120, photo: 'nuggets-4' }, { label: '6 шт', price: 150, photo: 'nuggets-6' },
                    { label: '12 шт', price: 290, photo: 'nuggets-12' }] },
        { name: 'Сырные палочки', desc: 'Тянущийся сыр в хрустящей корочке', photo: 'cheese-sticks-3',
          options: [{ label: '3 шт', price: 170, photo: 'cheese-sticks-3' }, { label: '6 шт', price: 330, photo: 'cheese-sticks-6' },
                    { label: '12 шт', price: 660, photo: 'cheese-sticks-12' }] },
        { name: 'Картофель фри', desc: 'Горячий и хрустящий', photo: 'fries-medium',
          options: [{ label: 'Средний', price: 170, photo: 'fries-medium' }, { label: 'Большой', price: 250, photo: 'fries-large' }] },
        { name: 'Картофель по-деревенски', desc: 'Дольки со специями', photo: 'wedges-box',
          options: [{ label: 'Средний', price: 210, photo: 'wedges-box' }, { label: 'Большой', price: 270, photo: 'wedges-tray' }] }
      ]
    },
    {
      id: 'напитки', title: 'Напитки',
      groups: [
        { title: 'Газировка и чай', compact: true, items: [
          { name: 'Кока-кола', options: [{ label: '0,4 л', price: 145 }, { label: '0,5 л', price: 160 }] },
          { name: 'Фрустайл лимон-лайм', options: [{ label: '0,4 л', price: 145 }, { label: '0,5 л', price: 160 }] },
          { name: 'Фрустайл апельсин', options: [{ label: '0,4 л', price: 145 }, { label: '0,5 л', price: 160 }] },
          { name: 'Липтон лимон', options: [{ label: '0,4 л', price: 145 }, { label: '0,5 л', price: 160 }] },
          { name: 'Липтон зелёный', options: [{ label: '0,4 л', price: 145 }, { label: '0,5 л', price: 160 }] }
        ] },
        { title: 'Лимонады', items: [
          { name: 'Мохито Классический', desc: '0,5 л', photo: 'mojito', price: 200 },
          { name: 'Мохито клубничный', desc: '0,5 л', photo: 'mojito-strawberry', price: 220 },
          { name: 'Манго-маракуйя', desc: '0,5 л', photo: 'lemonade-mango', price: 220 },
          { name: 'Кровавая Мэри', desc: 'Ягодный лимонад, 0,5 л', photo: 'lemonade-red-mary', price: 220 },
          { name: 'Натахтари Тархун', desc: 'Грузинский лимонад, 0,5 л', photo: 'natakhtari-tarkhun', price: 150 },
          { name: 'Натахтари Груша', desc: 'Грузинский лимонад, 0,5 л', photo: 'natakhtari-pear', price: 150 }
        ] },
        { title: 'Молочные коктейли', items: [
          { name: 'Молочный коктейль', desc: 'Клубнично-черничный, клубничный, бананово-клубничный, ванильный или шоколадный, 0,5 л', photo: 'milkshake', price: 300 }
        ] }
      ]
    },
    {
      id: 'кофе', title: 'Кофе',
      note: 'Молоко можно заменить на растительное, +50 ₽',
      groups: [
        { title: 'Классический', items: [
          { name: 'Эспрессо', desc: '30 мл', photo: 'espresso', price: 150 },
          { name: 'Американо', photo: 'americano', options: [{ label: '200 мл', price: 150, photo: 'americano' }, { label: '300 мл', price: 180, photo: 'americano-300' }] },
          { name: 'Капучино', photo: 'cappuccino', options: [{ label: '200 мл', price: 150, photo: 'cappuccino' }, { label: '300 мл', price: 210, photo: 'cappuccino-300' }] },
          { name: 'Латте', desc: '300 мл', photo: 'latte', price: 230 },
          { name: 'Флэт уайт', desc: '200 мл', photo: 'flat-white', price: 200 },
          { name: 'Какао', photo: 'cocoa', options: [{ label: '200 мл', price: 150, photo: 'cocoa' }, { label: '300 мл', price: 210, photo: 'cocoa-300' }] }
        ] },
        { title: 'Холодный', items: [
          { name: 'Айс латте', desc: '300 мл', photo: 'iced-latte', price: 250 },
          { name: 'Айс кофе с урбечом', desc: 'Наш фирменный, 300 мл', photo: 'iced-urbech', price: 350, star: true },
          { name: 'Колд брю', desc: '250 мл', photo: 'cold-brew', price: 250 },
          { name: 'Бамбл', desc: 'Эспрессо и апельсиновый сок, 300 мл', photo: 'bumble', price: 320 }
        ] },
        { title: 'Авторский', items: [
          { name: 'Раф', desc: '300 мл', photo: 'raf', price: 250 },
          { name: 'Раф с урбечом', desc: '300 мл', photo: 'raf-urbech', price: 300, star: true },
          { name: 'Будильник', desc: '300 мл', photo: 'budilnik', price: 300 },
          { name: 'Шот', desc: '30 мл', photo: 'shot', price: 380, verify: true }
        ] }
      ]
    },
    {
      id: 'чуду', title: 'Чуду', soon: true,
      note: 'Дагестанские чуду скоро появятся в меню.'
    }
  ],

  /* Карта лояльности (правила от владельца, 04.10.2026): 10 баллов за каждые 100 ₽ покупки,
     1 балл = 1 ₽ скидки. Ещё не уточнено: сколько баллов за сумму не кратную 100 (250 ₽: 20 или 25)
     и какую часть заказа можно оплатить баллами. Показывается пока только на странице проверки. */
  loyalty: { spend: 100, points: 10, rub: 1 },

  reviews: [
    { name: 'Сепиева Эвелина', text: 'Теперь мы всегда будем приходить сюда за шикарным кофе. Персонал очень добрый и отзывчивый.' },
    { name: 'Залина З.', text: 'Очень уютное место, а главное, очень вкусно. Крылышки просто объедение.' },
    { name: 'Мадина', text: 'Тихо, спокойно, можно посидеть и поработать, заодно халяльные бургеры покушать.' }
  ]
};

/* Вспомогательные функции, общие для всех вариантов. */
window.HBU = {
  price: function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; },
  photo: function (id) { return id ? 'assets/img/menu/' + id + '.webp' : null; },
  esc: function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  },
  /* Все позиции категории, включая сгруппированные. */
  items: function (cat) {
    if (cat.items) return cat.items;
    return (cat.groups || []).reduce(function (a, g) { return a.concat(g.items); }, []);
  },
  /* Кнопки порций: у каждой data-price, первая активна.
     Если у порции своё фото (photo в options), кнопка хранит его в data-photo. */
  options: function (item, cls) {
    if (!item.options) return '';
    return '<div class="' + (cls || 'opts') + '" role="group" aria-label="Размер порции">' +
      item.options.map(function (o, i) {
        return '<button type="button" class="opt' + (i === 0 ? ' is-on' : '') + '" aria-pressed="' + (i === 0) +
          '" data-price="' + o.price + '"' + (o.photo ? ' data-photo="' + HBU.photo(o.photo) + '"' : '') + '>' +
          HBU.esc(o.label) + '</button>';
      }).join('') + '</div>';
  },
  firstPrice: function (item) { return item.options ? item.options[0].price : item.price; }
};
