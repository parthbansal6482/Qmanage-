# Qmanage • Full-Stack Food Ordering Platform

Qmanage has evolved from a static site into a full-stack Node.js + Express application with EJS templating, MongoDB persistence, and rich, data-driven interactivity on the frontend.

## 🍽️ Highlights

- **Server-rendered EJS views** with reusable layout and partials
- **Node.js + Express + MongoDB** backend with clean */routes · /controllers · /models* architecture
- **Full CRUD APIs** for Outlets, Menu Items, and Orders
- **Admin console** (EJS + vanilla JS) for managing outlets, menu inventory, and live orders
- **Dynamic pages powered by JSON & APIs** for menu and outlets listings
- **Rich frontend OOP** (Cart, FoodItem, Outlet classes) with filters, modals, and animations
- **Nodemon-powered DX** and environment-driven Mongo connection

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18+
- MongoDB instance (local or hosted)

#### MongoDB Setup (Windows)

If you're running MongoDB locally on Windows, you need to create the data directory:

```powershell
# Create the default MongoDB data directory
New-Item -ItemType Directory -Force -Path "C:\data\db"
```

Alternatively, you can start MongoDB with a custom data path:

```powershell
mongod --dbpath "C:\path\to\your\data\directory"
```

### 2. Install & Run

```bash
git clone https://github.com/parthbansal6482/Qmanage-.git
cd Qmanage-
npm install

# development (nodemon)
npm run dev

# production
npm start
```

Create a `.env` (optional) to override defaults:

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/qmanage
```

## 🗂️ Project Structure

```
Qmanage-/
├── server.js
├── config/
│   └── database.js
├── controllers/
│   ├── menuController.js
│   ├── orderController.js
│   ├── outletController.js
│   └── pageController.js
├── models/
│   ├── MenuItem.js
│   ├── Order.js
│   └── Outlet.js
├── routes/
│   ├── webRoutes.js
│   └── api/
│       ├── index.js
│       ├── menuRoutes.js
│       ├── orderRoutes.js
│       └── outletRoutes.js
├── views/
│   ├── layout.ejs
│   ├── partials/
│   ├── admin/
│   └── *.ejs
├── public/
│   ├── css/
│   ├── js/
│   ├── json/
│   └── img/
└── README.md
```

## 🔌 API Overview

| Method | Endpoint                 | Description                  |
|--------|--------------------------|------------------------------|
| GET    | `/api/outlets`           | List outlets                 |
| POST   | `/api/outlets`           | Create outlet                |
| PUT    | `/api/outlets/:id`       | Update outlet                |
| DELETE | `/api/outlets/:id`       | Remove outlet (cascades menu)|
| GET    | `/api/menu-items`        | List menu items (filters)    |
| POST   | `/api/menu-items`        | Create menu item             |
| PUT    | `/api/menu-items/:id`    | Update menu item             |
| DELETE | `/api/menu-items/:id`    | Delete menu item             |
| GET    | `/api/orders`            | List orders (filters)        |
| POST   | `/api/orders`            | Create order                 |
| PUT    | `/api/orders/:id`        | Update order body            |
| PATCH  | `/api/orders/:id/status` | Update status only           |
| DELETE | `/api/orders/:id`        | Delete order                 |

## 🖥️ Views & Pages

- `home.ejs` — hero, category slider, best/featured products
- `menu.ejs` — powered by JSON + API with search, filters, sorting
- `outlets.ejs` — outlet cards, modal info, chip filters
- `orders.ejs` — outlet selection wizard, category chips, cart integration
- `contact.ejs` — interactive form validation + newsletter
- `cart.ejs` — persistent cart summary powered by Cart class events
- `admin/*` — dashboard, outlets, menu items, orders management consoles

## 🧠 Frontend Architecture

- `public/js/main.js` — Cart class (localStorage sync, custom events)
- `public/js/home.js` — `FoodItem`, `OutletCategory`, slider controller
- `public/js/menu.js` — `MenuItemModel`, menu filters & rendering
- `public/js/outlets.js` — `OutletModel`, modal controller, filters
- `public/js/order.js` — outlet-aware menu browsing with JSON fallback
- `public/js/cart.js` — CartPage syncing with Cart events
- `public/js/admin/*.js` — fetch-based CRUD dashboards
- `public/js/data-loader.js` — JSON loader with caching
- `public/js/utils.js` — dropdowns, animations, notifications, validators

## 🧱 Data Sources

Static JSON lives under `public/json/` for bootstrapping and offline demo:

- `restaurants.json`
- `menu-items.json`
- `best-selling.json`
- `featured-products.json`

The frontend attempts API fetch first and gracefully falls back to these JSON assets.

## ✅ Feature Checklist

- [x] EJS layout + partials (`layout.ejs`, `header`, `footer`, `navbar`)
- [x] Node.js backend with Express router/controller layers
- [x] MongoDB models (Outlets, MenuItems, Orders) with full CRUD
- [x] Admin panel (EJS + vanilla JS) for managing data
- [x] JSON-driven menu & outlets pages
- [x] Rich front-end interactivity (filters, search, modals, cart animations)
- [x] Nodemon dev workflow (`npm run dev`)

## 🤝 Contributing

Issues, ideas, and PRs are welcome. Please raise an issue before large changes so we can collaborate on direction.

## 📄 License

MIT © Parth Bansal
