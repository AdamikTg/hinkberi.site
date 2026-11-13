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
  - «Будильник» (300 мл, 300 ₽) убран из меню по просьбе владельца 05.10.2026;
  - фото Бургера куриного и Бургера говядина заменены на присланные владельцем 05.10.2026 (на белом фоне,
    файлы burger-chicken-2 и burger-beef-2);
  - часы работы 10:00-20:00 назвал владелец 02.10.2026;
  - бонусы работают по-настоящему с 06.10.2026: аккаунты и баллы на сервере в Yandex Cloud (loyalty.api ниже),
    кассир начисляет и списывает баллы на странице кассир.html;
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
    rating: '4,8',
    mapsOrg: 'https://yandex.ru/maps/org/169433331462/',
    mapsReviews: 'https://yandex.ru/maps/org/169433331462/reviews/',
    mapsRoute: 'https://yandex.ru/maps/?rtext=~55.570706,37.578046',
    mapWidget: 'https://yandex.ru/map-widget/v1/?ll=37.578046%2C55.570706&z=17&pt=37.578046%2C55.570706%2Cpm2grm'
  },

  menu: [
    {
      id: 'бургеры', title: 'Бургеры',
      items: [
        { name: 'Бургер куриный', desc: 'Куриная котлета, салат, томат, сыр, огурчики, сырный соус', photo: 'burger-chicken-2', price: 350 },
        { name: 'Бургер говядина', desc: 'Говяжья котлета, салат, томат, сыр, огурчики, соус', photo: 'burger-beef-2', price: 490 }
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
          { name: 'Шот', desc: '30 мл', photo: 'shot', price: 380, verify: true }
        ] }
      ]
    },
    {
      id: 'чуду', title: 'Чуду', soon: true,
      note: 'Дагестанские чуду скоро появятся в меню.'
    }
  ],

  /* Бонусы (правила от владельца, 04-06.10.2026): 10 баллов за каждые 100 ₽, считается пропорционально,
     то есть 1 балл за каждые полные 10 ₽ (250 ₽ = 25 баллов); 1 балл = 1 ₽ скидки. Баллы начисляются на часть
     чека, оплаченную деньгами. Баллы считает сервер (папка «сервер/бонусы»), здесь числа только для текстов
     и для подсказки кассиру. api: адрес сервера бонусов в Yandex Cloud, где лежат аккаунты и баллы.
     qr: начало строки в QR-коде карты, дальше шесть цифр номера («HINKBERI:465480»); с 07.10.2026 у каждого
     гостя свой код в окне «Ваши баллы», касса читает его камерой. Только заглавные латинские буквы, цифры и «:». */
  loyalty: { spend: 100, points: 10, rub: 1, api: 'https://functions.yandexcloud.net/d4e0nj5itggf5hdcs0hp', qr: 'HINKBERI:' },

  reviews: [
    { name: 'Сепиева Эвелина', text: 'Теперь мы всегда будем приходить сюда за шикарным кофе. Персонал очень добрый и отзывчивый.' },
    { name: 'Залина З.', text: 'Очень уютное место, а главное, очень вкусно. Крылышки просто объедение.' },
    { name: 'Мадина', text: 'Тихо, спокойно, можно посидеть и поработать, заодно халяльные бургеры покушать.' }
  ]
};

/* menu-yandex-20261113: новые позиции и цены из меню Яндекс Карт; прежние позиции сохранены. */
(function () {
  var added = {
  "snacks": [
    {
      "name": "Креветки в кляре",
      "photo": "shrimp-batter-20261113",
      "price": 350,
      "desc": "75 г"
    },
    {
      "name": "Луковые кольца",
      "photo": "onion-rings-20261113",
      "price": 330,
      "desc": "60 г"
    },
    {
      "name": "Рыбные палочки",
      "photo": "fish-sticks-20261113",
      "price": 320,
      "desc": "90 г"
    }
  ],
  "bakery": [
    {
      "name": "Ватрушка с творогом",
      "photo": "vatrushka-20261113",
      "price": 300,
      "desc": "120 г"
    },
    {
      "name": "Круассан миндальный",
      "photo": "croissant-almond-20261113",
      "price": 300,
      "desc": "120 г"
    },
    {
      "name": "Круассан с Nutella",
      "photo": "croissant-nutella-20261113",
      "price": 300,
      "desc": "130 г"
    },
    {
      "name": "Круассан с фисташкой",
      "photo": "croissant-pistachio-20261113",
      "price": 300,
      "desc": "120 г"
    },
    {
      "name": "Круассан с шоколадом",
      "photo": "croissant-chocolate-20261113",
      "price": 300,
      "desc": "120 г"
    },
    {
      "name": "Орешки со сгущёнкой",
      "photo": "nuts-condensed-milk-20261113",
      "price": 300,
      "desc": "130 г"
    },
    {
      "name": "Печенье лимонное",
      "photo": "cookie-lemon-20261113",
      "price": 300,
      "desc": "85 г"
    },
    {
      "name": "Печенье овсяное",
      "photo": "cookie-oat-20261113",
      "price": 300,
      "desc": "85 г"
    },
    {
      "name": "Сочник с творогом",
      "photo": "sochnik-20261113",
      "price": 300,
      "desc": "120 г"
    },
    {
      "name": "Улитка с изюмом",
      "photo": "raisin-swirl-20261113",
      "price": 300,
      "desc": "120 г"
    },
    {
      "name": "Улитка с корицей",
      "photo": "cinnamon-swirl-20261113",
      "price": 100,
      "desc": "130 г"
    },
    {
      "name": "Маковая булочка",
      "photo": "poppy-bun-20261113",
      "price": 300,
      "desc": "120 г"
    }
  ],
  "chudu": [
    {
      "name": "Чуду ботишал",
      "photo": "chudu-botishal-20261113",
      "price": 400,
      "desc": "200 г"
    },
    {
      "name": "Чуду даргинское с курицей и картошкой",
      "photo": "chudu-chicken-potato-20261113",
      "price": 800,
      "desc": "1 кг"
    },
    {
      "name": "Чуду даргинское с мясом и картошкой",
      "photo": "chudu-meat-potato-20261113",
      "price": 890,
      "desc": "1 кг"
    },
    {
      "name": "Чуду даргинское с творогом",
      "photo": "chudu-dargin-curd-20261113",
      "price": 950,
      "desc": "1 кг"
    },
    {
      "name": "Чуду с зеленью",
      "photo": "chudu-greens-20261113",
      "price": 420,
      "desc": "200 г"
    },
    {
      "name": "Чуду с мясом",
      "photo": "chudu-meat-20261113",
      "price": 450,
      "desc": "200 г"
    },
    {
      "name": "Чуду с творогом",
      "photo": "chudu-curd-20261113",
      "price": 390,
      "desc": "200 г"
    }
  ],
  "desserts": [
    {
      "name": "Медовик",
      "photo": "medovik-20261113",
      "price": 400,
      "desc": "150 г"
    },
    {
      "name": "Меренговый десерт",
      "photo": "meringue-dessert-20261113",
      "price": 280,
      "desc": "150 г"
    },
    {
      "name": "Трайфл Сникерс",
      "photo": "trifle-snickers-20261113",
      "price": 400,
      "desc": "150 г"
    },
    {
      "name": "Трайфл с вишней",
      "photo": "trifle-cherry-20261113",
      "price": 450,
      "desc": "150 г"
    }
  ],
  "breakfast": [
    {
      "name": "Блины с варёной сгущёнкой",
      "photo": "blini-condensed-milk-20261113",
      "price": 380,
      "desc": "220 г"
    },
    {
      "name": "Блины с курицей и грибами",
      "photo": "blini-chicken-mushroom-20261113",
      "price": 450,
      "desc": "220 г"
    },
    {
      "name": "Блины с мясом",
      "photo": "blini-meat-20261113",
      "price": 470,
      "desc": "220 г"
    },
    {
      "name": "Сырники",
      "photo": "syrniki-20261113",
      "price": 300,
      "desc": "180 г"
    }
  ],
  "sauces": [
    {
      "name": "Соус Барбекю",
      "photo": "sauce-bbq-20261113",
      "price": 30,
      "desc": "25 г"
    },
    {
      "name": "Соус Кетчуп",
      "photo": "sauce-ketchup-20261113",
      "price": 30,
      "desc": "25 г"
    },
    {
      "name": "Соус Кисло-Сладкий",
      "photo": "sauce-sweet-sour-20261113",
      "price": 55,
      "desc": "25 г"
    },
    {
      "name": "Соус Сырный",
      "photo": "sauce-cheese-20261113",
      "price": 30,
      "desc": "25 г"
    }
  ],
  "coffee": [
    {
      "name": "Бамбл с гранатом",
      "photo": "bumble-pomegranate-20261113",
      "price": 200,
      "desc": "300 мл"
    },
    {
      "name": "Колд брю с гранатом",
      "photo": "cold-brew-pomegranate-20261113",
      "price": 200,
      "desc": "300 мл"
    },
    {
      "name": "Колд брю с кизилом",
      "photo": "cold-brew-dogwood-20261113",
      "price": 200,
      "desc": "300 мл"
    },
    {
      "name": "Колд брю с малиной",
      "photo": "cold-brew-raspberry-20261113",
      "price": 300,
      "desc": "300 мл"
    },
    {
      "name": "Колд брю с черникой",
      "photo": "cold-brew-blueberry-20261113",
      "price": 300,
      "desc": "300 мл"
    }
  ],
  "drinks": [
    {
      "name": "RC кола",
      "photo": "rc-cola-20261113",
      "price": 250,
      "desc": "1 л"
    },
    {
      "name": "Кока-кола",
      "photo": "coca-cola-250-20261113",
      "price": 170,
      "desc": "250 мл"
    },
    {
      "name": "Менди персик",
      "photo": "mendi-peach-20261113",
      "price": 220
    },
    {
      "name": "Могох абрикосовый натуральный сок",
      "photo": "mogokh-apricot-20261113",
      "price": 270,
      "desc": "1 л"
    },
    {
      "name": "Могох персиковый натуральный сок",
      "photo": "mogokh-peach-20261113",
      "price": 270,
      "desc": "500 мл"
    },
    {
      "name": "Могох сливовый натуральный сок",
      "photo": "mogokh-plum-20261113",
      "price": 270,
      "desc": "1 л"
    },
    {
      "name": "Могох яблочный натуральный сок",
      "photo": "mogokh-apple-20261113",
      "price": 270,
      "desc": "1 л"
    },
    {
      "name": "Мохито Гранатовый",
      "photo": "mojito-pomegranate-20261113",
      "price": 180,
      "desc": "450 мл"
    },
    {
      "name": "Напиток Кинза Апельсин",
      "photo": "kinza-orange-20261113",
      "price": 180,
      "desc": "320 мл"
    },
    {
      "name": "Напиток Кинза Кола",
      "photo": "kinza-cola-20261113",
      "price": 180,
      "desc": "320 мл"
    },
    {
      "name": "Напиток Кинза Спрайт",
      "photo": "kinza-sprite-20261113",
      "price": 180,
      "desc": "320 мл"
    },
    {
      "name": "Напиток Кинза кола без сахара",
      "photo": "kinza-cola-zero-20261113",
      "price": 180,
      "desc": "320 мл"
    },
    {
      "name": "Напиток кинза виноград",
      "photo": "kinza-grape-20261113",
      "price": 180,
      "desc": "320 мл"
    },
    {
      "name": "Напиток кинза гранат",
      "photo": "kinza-pomegranate-20261113",
      "price": 180,
      "desc": "320 мл"
    },
    {
      "name": "Сок Рич Персик",
      "photo": "rich-peach-20261113",
      "price": 150,
      "desc": "200 мл"
    },
    {
      "name": "Сок Рич Яблоко",
      "photo": "rich-apple-20261113",
      "price": 150,
      "desc": "200 мл"
    }
  ]
};
  function category(id) { return window.HB.menu.find(function(c) { return c.id === id; }); }
  category('закуски').items.push.apply(category('закуски').items, added.snacks);
  var drinks = category('напитки');
  var mojito = added.drinks.find(function(i) { return i.photo === 'mojito-pomegranate-20261113'; });
  drinks.groups.find(function(g) { return g.title === 'Лимонады'; }).items.push(mojito);
  drinks.groups.push({title:'Напитки в бутылках и банках', items:added.drinks.filter(function(i) { return i !== mojito; })});
  var cold = category('кофе').groups.find(function(g) { return g.title === 'Холодный'; });
  cold.items.push.apply(cold.items, added.coffee);
  var chudu = category('чуду'); delete chudu.soon; delete chudu.note; chudu.items = added.chudu;
  window.HB.menu.push(
    {id:'выпечка',title:'Выпечка',items:added.bakery},
    {id:'завтраки',title:'Завтраки',items:added.breakfast},
    {id:'десерты',title:'Десерты',items:added.desserts},
    {id:'соусы',title:'Соусы',items:added.sauces}
  );
})();

/* menu-mint-20261113: все прежние фото меню в едином стиле на зелёных карточках. */
(function () {
  var photos = {
  "burger-chicken-2": "burger-chicken-2-mint-20261113",
  "burger-beef-2": "burger-beef-2-mint-20261113",
  "caesar-roll": "caesar-roll-mint-20261113",
  "strips-roll": "strips-roll-mint-20261113",
  "shawarma-chicken": "shawarma-chicken-mint-20261113",
  "shaverma": "shaverma-mint-20261113",
  "sandwich-ham-turkey": "sandwich-ham-turkey-mint-20261113",
  "wings": "wings-mint-20261113",
  "wings-10": "wings-10-mint-20261113",
  "wings-15": "wings-15-mint-20261113",
  "strips-3": "strips-3-mint-20261113",
  "strips-5": "strips-5-mint-20261113",
  "strips-7": "strips-7-mint-20261113",
  "nuggets-4": "nuggets-4-mint-20261113",
  "nuggets-6": "nuggets-6-mint-20261113",
  "nuggets-12": "nuggets-12-mint-20261113",
  "cheese-sticks-3": "cheese-sticks-3-mint-20261113",
  "cheese-sticks-6": "cheese-sticks-6-mint-20261113",
  "cheese-sticks-12": "cheese-sticks-12-mint-20261113",
  "fries-medium": "fries-medium-mint-20261113",
  "fries-large": "fries-large-mint-20261113",
  "wedges-box": "wedges-box-mint-20261113",
  "wedges-tray": "wedges-tray-mint-20261113",
  "mojito": "mojito-mint-20261113",
  "mojito-strawberry": "mojito-strawberry-mint-20261113",
  "lemonade-mango": "lemonade-mango-mint-20261113",
  "lemonade-red-mary": "lemonade-red-mary-mint-20261113",
  "natakhtari-tarkhun": "natakhtari-tarkhun-mint-20261113",
  "natakhtari-pear": "natakhtari-pear-mint-20261113",
  "milkshake": "milkshake-mint-20261113",
  "espresso": "espresso-mint-20261113",
  "americano": "americano-mint-20261113",
  "americano-300": "americano-300-mint-20261113",
  "cappuccino": "cappuccino-mint-20261113",
  "cappuccino-300": "cappuccino-300-mint-20261113",
  "latte": "latte-mint-20261113",
  "flat-white": "flat-white-mint-20261113",
  "cocoa": "cocoa-mint-20261113",
  "cocoa-300": "cocoa-300-mint-20261113",
  "iced-latte": "iced-latte-mint-20261113",
  "iced-urbech": "iced-urbech-mint-20261113",
  "cold-brew": "cold-brew-mint-20261113",
  "bumble": "bumble-mint-20261113",
  "raf": "raf-mint-20261113",
  "raf-urbech": "raf-urbech-mint-20261113",
  "shot": "shot-mint-20261113"
};
  window.HB.menu.forEach(function (category) {
    var items = category.items || category.groups.reduce(function (all, group) { return all.concat(group.items); }, []);
    items.forEach(function (item) {
      if (photos[item.photo]) item.photo = photos[item.photo];
      (item.options || []).forEach(function (option) { if (photos[option.photo]) option.photo = photos[option.photo]; });
    });
  });
})();

/* Вспомогательные функции, общие для всех вариантов. */
window.HBU = {
  price: function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; },
  photo: function (id) { return id ? 'assets/img/menu/' + id + '.webp' : null; },
  /* Запрос к серверу бонусов. Тело text/plain, чтобы браузер не делал лишний предварительный запрос.
     Ошибка приходит как Error с полем code: credentials, exists, locked, auth, too_much, not_found,
     not_last, too_late, bad, server, network (нет связи или сервер не ответил за 25 секунд). */
  api: function (body) {
    function fail(code) { var e = new Error(code); e.code = code; return e; }
    if (!window.fetch) return Promise.reject(fail('old'));
    var ctl = window.AbortController ? new AbortController() : null;
    var stop = ctl && setTimeout(function () { ctl.abort(); }, 25000);
    return fetch(HB.loyalty.api, {
      method: 'POST', cache: 'no-store', signal: ctl ? ctl.signal : undefined,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (d) {
        clearTimeout(stop);
        if (!r.ok) throw fail((d && d.error) || 'server');
        if (!d) throw fail('network');   // ответ оборвался на середине
        return d;
      });
    }, function () { clearTimeout(stop); throw fail('network'); });
  },
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
