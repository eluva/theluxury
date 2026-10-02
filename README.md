# LUXURY — Telegram Mini App (магазин обуви)

Онлайн-витрина бренда **LUXURY Uzbekistan** ([@theluxuryuzbekistan](https://www.instagram.com/theluxuryuzbekistan/)) для запуска внутри Telegram.
Работает и как обычный сайт в браузере.

```
web/     — Mini App (React + Vite + TypeScript)
server/  — API (Node + Express): каталог из BILLZ, приём заказов, уведомления в Telegram
```

## Что умеет

- Главная: hero, категории, новинки, Premium, скидки, блок бутика (адрес, часы, Telegram, маршрут)
- Каталог: поиск, категории, Premium / скидки, фильтр по размеру, сортировка
- Карточка товара: галерея, выбор размера с остатками («последняя пара»), похожие модели
- Избранное, корзина, оформление заказа (самовывоз / курьер), экран «Спасибо»
- Языки RU / UZ (автоматически по языку Telegram)
- Интеграция с Telegram: нативная кнопка «Назад», вибро-отклик, данные пользователя, проверка подписи `initData`
- Заказы приходят менеджерам в Telegram-чат; клиенту бот присылает подтверждение

## Запуск локально

```bash
# 1. сервер (демо-каталог)
cd server
cp .env.example .env
npm install
npm run dev            # http://localhost:8080

# 2. фронтенд
cd web
npm install
npm run dev            # http://localhost:5173  (запросы /api проксируются на сервер)
```

Без сервера фронтенд тоже работает: если `VITE_API_URL` не задан, берётся встроенный демо-каталог (`web/src/data/catalog.json`), а заказ имитируется.

## Сборка и деплой

```bash
cd web && VITE_API_URL=/api npm run build   # → web/dist
cd server && npm start                       # отдаёт и API, и web/dist с одного домена
```

Нужен HTTPS-домен (например, VPS + nginx/Caddy, Railway, Render). Фронтенд можно отдельно выложить на Vercel/Netlify, тогда `VITE_API_URL=https://api.ваш-домен.uz/api`.

## Подключение к Telegram

1. В [@BotFather](https://t.me/BotFather): `/newbot` → получить `BOT_TOKEN`.
2. `/mybots` → бот → **Bot Settings → Menu Button** → указать URL сайта (или **Configure Mini App**).
3. Создать группу менеджеров, добавить туда бота, узнать её id (например, через @getidsbot) → `MANAGER_CHAT_ID`.
4. Заполнить `server/.env`. Для боевого режима включить `REQUIRE_TELEGRAM=1`, тогда заказы принимаются только из Telegram.

## Интеграция BILLZ

Код уже готов: [server/src/billz.js](server/src/billz.js).

1. Получить API-ключ (secret token) в BILLZ: админ-панель → Настройки → Интеграции, или через поддержку BILLZ.
2. В `server/.env`:
   ```
   DATA_SOURCE=billz
   BILLZ_SECRET_TOKEN=...
   BILLZ_SHOP_ID=...        # id магазина, чьи цены и остатки показывать
   ```
3. Проверить маппинг на реальных данных:
   ```bash
   cd server && npm run billz:dump
   ```
   Появятся `billz-sample.json` (сырые товары) и `billz-catalog.json` (как их видит витрина). Если названия полей в вашем аккаунте отличаются, поправьте функции `attr / priceOf / stockOf / imagesOf` в `billz.js`.

Как устроен маппинг:
- каждый размер в BILLZ — отдельный товар (вариация); по `parent_id` или названию они объединяются в одну карточку с таблицей размеров;
- размер берётся из атрибута «Размер» (настраивается через `BILLZ_SIZE_ATTRIBUTE`), цвет и материал — из атрибутов;
- цена — `retail_price`, если есть `promo_price`, показывается скидка;
- остаток — `active_measurement_value` по выбранному магазину;
- категории — из категорий BILLZ; товары без цены или фото скрываются;
- каталог кешируется на 5 минут (`CATALOG_CACHE_SECONDS`).

**Заказы в BILLZ.** Сейчас заказ проверяется по актуальным остаткам и ценам BILLZ и отправляется менеджеру в Telegram, в сообщении есть SKU каждого размера. Автоматически создавать заказ в BILLZ можно, если у вашего тарифа есть API для заказов: место для этого отмечено `TODO(BILLZ)` в [server/src/index.js](server/src/index.js).

## Где что менять

| Что | Файл |
|---|---|
| Контакты, Telegram, карта, фото на главной | [web/src/brand.ts](web/src/brand.ts) |
| Цвета, шрифты, отступы | [web/src/styles.css](web/src/styles.css) (блок `:root`) |
| Тексты RU / UZ | [web/src/lib/i18n.ts](web/src/lib/i18n.ts) |
| Демо-товары | [web/src/data/catalog.json](web/src/data/catalog.json) |

> Фото в демо-каталоге взяты с Unsplash как заглушки. После подключения BILLZ будут показываться фото из карточек BILLZ.

## Демо на GitHub Pages

Демо-версия (без сервера, заказы имитируются): https://eluva.github.io/theluxury/

Pages отдаёт корень ветки `main`, поэтому собранные файлы (`index.html`, `assets/`, `favicon.svg`, `.nojekyll`) лежат в корне. Обновить демо:

```bash
cd web && npm run build:pages
git add -A && git commit -m "Update demo" && git push
```
