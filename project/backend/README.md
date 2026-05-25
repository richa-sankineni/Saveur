# 🍽️ Smart Food Ordering & Restaurant Management System

A production-ready Node.js + Express REST API with real-time Socket.io support, built with SQLite (via sql.js — zero native dependencies).

---

## 🚀 Quick Start

```bash
npm install
npm run seed      # Populate DB with users, tables, and menu items
npm start         # Start server on port 5000
```

---

## 🔐 Seed Credentials

| Role     | Email                      | Password   |
|----------|----------------------------|------------|
| Admin    | admin@restaurant.com       | admin123   |
| Chef     | chef@restaurant.com        | chef123    |
| Waiter   | waiter@restaurant.com      | waiter123  |
| Customer | alice@email.com            | alice123   |
| Customer | bob@email.com              | bob123     |

---

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                  # sql.js SQLite wrapper (singleton)
├── models/                    # Schema documentation
│   └── User.js, Menu.js, Order.js, OrderItem.js, Table.js, Reservation.js, Bill.js
├── controllers/
│   ├── authController.js      # Register, login, profile
│   ├── menuController.js      # CRUD menu items
│   ├── orderController.js     # Order lifecycle
│   ├── reservationController.js
│   ├── billController.js
│   ├── dashboardController.js # Analytics
│   └── tableController.js
├── routes/
│   ├── authRoutes.js
│   ├── menuRoutes.js
│   ├── orderRoutes.js
│   ├── reservationRoutes.js
│   ├── billRoutes.js
│   ├── dashboardRoutes.js
│   └── tableRoutes.js
├── middleware/
│   ├── authMiddleware.js      # JWT verification
│   ├── roleMiddleware.js      # Role-based access control
│   ├── errorMiddleware.js     # Centralized error handling
│   └── validationMiddleware.js
├── validators/
│   ├── menuValidator.js
│   ├── orderValidator.js
│   └── reservationValidator.js
├── services/
│   ├── orderService.js        # Order creation (with transactions), status flow
│   └── billService.js         # Bill generation and payment
├── socket/
│   └── socket.js              # Socket.io with JWT auth + kitchen room
├── utils/
│   └── responseHandler.js     # Standardized API responses
├── seed/
│   └── seedData.js
├── .env
├── app.js
└── server.js
```

---

## 📡 API Reference

All responses follow this format:
```json
{ "success": true, "message": "...", "data": {} }
```
Paginated responses include:
```json
{ "pagination": { "total": 20, "page": 1, "limit": 10, "totalPages": 2 } }
```

### Auth
| Method | Endpoint              | Access  | Description        |
|--------|-----------------------|---------|--------------------|
| POST   | /api/auth/register    | Public  | Register user      |
| POST   | /api/auth/login       | Public  | Login + get JWT    |
| GET    | /api/auth/profile     | All     | Get own profile    |

### Menu
| Method | Endpoint          | Access  | Description               |
|--------|-------------------|---------|---------------------------|
| GET    | /api/menu         | Public  | List (filter + paginate)  |
| GET    | /api/menu/:id     | Public  | Get single item           |
| POST   | /api/menu         | Admin   | Create item               |
| PUT    | /api/menu/:id     | Admin   | Update item               |
| DELETE | /api/menu/:id     | Admin   | Delete item               |

**Query params:** `?category=Starter`, `?available=true`, `?page=1&limit=10`

### Orders
| Method | Endpoint                       | Access                  | Description          |
|--------|--------------------------------|-------------------------|----------------------|
| POST   | /api/orders                    | Customer/Waiter/Admin   | Create order         |
| GET    | /api/orders                    | All (role-filtered)     | List orders          |
| GET    | /api/orders/:id                | All (role-filtered)     | Get order + items    |
| PUT    | /api/orders/:id/status         | Chef/Waiter/Admin       | Update status        |
| PUT    | /api/orders/:id/assign-waiter  | Admin/Waiter            | Assign waiter        |
| DELETE | /api/orders/:id                | Admin                   | Delete (received only)|

**Query params:** `?status=received`, `?tableNumber=3`, `?page=1&limit=10`

**Status flow:** `received → preparing → ready → completed`  
- Bill is **auto-generated** when order reaches `completed`
- Table is **auto-freed** when order completes

### Tables
| Method | Endpoint         | Access        | Description   |
|--------|------------------|---------------|---------------|
| POST   | /api/tables      | Admin         | Create table  |
| GET    | /api/tables      | Authenticated | List tables   |
| PUT    | /api/tables/:id  | Admin/Waiter  | Update table  |

### Reservations
| Method | Endpoint                        | Access              | Description     |
|--------|---------------------------------|---------------------|-----------------|
| POST   | /api/reservations               | Customer/Admin      | Make reservation|
| GET    | /api/reservations               | All (role-filtered) | List            |
| PUT    | /api/reservations/:id/status    | Admin/Waiter        | Confirm/Cancel  |

### Bills
| Method | Endpoint               | Access        | Description         |
|--------|------------------------|---------------|---------------------|
| GET    | /api/bills             | Admin/Waiter  | List all bills      |
| GET    | /api/bills/:orderId    | Authenticated | Get bill for order  |
| PUT    | /api/bills/:orderId/pay| Admin/Waiter  | Mark bill paid      |

### Dashboard
| Method | Endpoint                | Access              | Description          |
|--------|-------------------------|---------------------|----------------------|
| GET    | /api/dashboard/summary  | Admin/Chef/Waiter   | Analytics overview   |

Dashboard returns: totalOrders, revenue, activeTables, kitchenLoad, totalCustomers, pendingReservations, ordersByStatus, topSellingItems, revenueByDay

---

## 🔌 Socket.io Events

Connect with: `{ auth: { token: "<JWT>" } }`

### Server → Client
| Event                  | Data                        | Description               |
|------------------------|-----------------------------|---------------------------|
| `new_order`            | `{ order }`                 | Emitted to `kitchen` room |
| `order_status_updated` | `{ orderId, status, order }`| Broadcast to all          |
| `order_acknowledged`   | `{ orderId, by }`           | Chef ACK                  |
| `kitchen_update`       | `{ ...data, updatedBy }`    | Kitchen broadcast         |

### Client → Server
| Event                | Data          | Description           |
|----------------------|---------------|-----------------------|
| `join_room`          | `"kitchen"`   | Join a room           |
| `order_acknowledged` | `{ orderId }` | Chef ACKs new order   |
| `kitchen_update`     | `{ ... }`     | Custom kitchen update |

**Rooms:** `kitchen` (chef + admin auto-join), `chef`, `waiter`, `admin`, `customer`

---

## ⚙️ Environment Variables (.env)

```
PORT=5000
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
DB_PATH=./database.sqlite
NODE_ENV=development
```

---

## 🏗️ Architecture Notes

- **Database:** sql.js (WebAssembly SQLite) — no native build required, saves to `database.sqlite` file automatically after each write
- **Transactions:** Order creation wraps insert + order_items + table status update in a single atomic transaction with rollback on failure
- **Auth:** JWT Bearer tokens, bcrypt password hashing (salt rounds: 12)
- **Validation:** express-validator on all mutating endpoints
- **Error handling:** Centralized via Express error middleware — all controllers use `next(err)`
- **Pagination:** All list endpoints support `?page=N&limit=N`
