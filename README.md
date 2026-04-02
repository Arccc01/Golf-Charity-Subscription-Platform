# GolfGives — Golf Charity Subscription Platform

A full-stack MERN web application combining golf performance tracking, monthly prize draws, and charitable giving. Built as part of the Digital Heroes Full-Stack Development Trainee Selection Process.

---

## Live Demo

https://golf-charity-subscription-platform-six-taupe.vercel.app/

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Draw Engine](#draw-engine)
- [Payment Flow](#payment-flow)
- [Deployment](#deployment)

---

## Overview

GolfGives lets golfers subscribe to a platform where they:

- Enter their latest Stableford golf scores (rolling 5-score system)
- Participate in monthly prize draws based on their scores
- Support a charity of their choice with a portion of their subscription fee
- Win prizes matched on 3, 4, or 5 numbers from the monthly draw

The platform is designed to feel emotionally engaging and modern — leading with charitable impact, not sport.

---

## Features

### Subscriber
- Register and login with JWT authentication
- Monthly or yearly subscription via Razorpay
- Enter and manage last 5 Stableford scores (1–45 range)
- Select a charity and set contribution percentage (min 10%)
- View monthly draw results and personal win history
- Upload proof screenshots for prize verification
- Full payment history with charity contribution breakdown

### Admin
- Analytics dashboard — users, revenue, prize pool, charity totals
- User management — view, edit, manage subscriptions
- Draw management — simulate draws (random or weighted), publish results
- Winner verification — approve or reject proof submissions, mark payouts
- Charity management — add, edit, feature, deactivate charities

### Draw Engine
- **Random mode** — pure lottery, every number 1–45 has equal probability
- **Weighted mode** — numbers weighted by frequency across all user scores
- Jackpot rolls over to next month if no 5-number match
- Prize pool splits: 40% jackpot / 35% four-match / 25% three-match
- Admin can simulate before publishing officially

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT (JSON Web Tokens), bcryptjs |
| Payments | Razorpay (orders, webhooks, subscriptions) |
| File Uploads | Multer |
| Fonts | Playfair Display, DM Sans (Google Fonts) |
| Dev Tools | Vite, Nodemon |

---

## Project Structure

```
golf-platform/
├── backend/
│   ├── controllers/
│   │   └── admin.controller.js
│   │   |── auth.controller.js
│   │   |── charity.controller.js
│   │   |── draw.controller.js
│   │   |── score.controller.js
│   │   |── winner.controller.js
│   │   |── subscription.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── draw.model.js
│   │   ├── payment.model.js
│   │   ├── score.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── charity.routes.js
│   │   ├── draw.routes.js
│   │   ├── score.routes.js
│   │   ├── subscription.routes.js
│   │   └── winner.routes.js
│   ├── utils/
│   │   ├── drawEngine.js
│   │   ├── prizePool.js
│   │   └── upload.js
│   ├── uploads/           ← winner proof screenshots (gitignored)
│   └── server.js
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/
    │   │    └── axios.jsx
    │   ├── components/
    │   │   └── Navbar.jsx
    │   ├── hooks/
    │   │   └── useSmartRedirect.js
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── SubscribePage.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── CharitiesPage.jsx
    │   │   ├── DrawResults.jsx
    │   │   └── AdminPage.jsx
    │   ├── routes/
    │   │    └── Mainroutes.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    └── vite.config.js
```

---

## Getting Started

### Prerequisites

- Node.js v18 or above
- MongoDB Atlas account (free tier works)
- Razorpay account (test keys are free)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/golf-platform.git
cd golf-platform
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Set up environment variables

Create `server/.env` — see [Environment Variables](#environment-variables) section below.


### 5. Run the backend

```bash
cd server
npx nodemon index.js
```

Server runs on `http://localhost:5000`

### 6. Run the frontend

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Environment Variables

Create a `.env` file inside the `server/` directory:

```env
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/golf-platform

# JWT
JWT_SECRET=your_long_random_secret_string_here

# Razorpay
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYYYYYYYYYY
RAZORPAY_WEBHOOK_SECRET=whsec_ZZZZZZZZZZZZZZZZZZZZZZZZ

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

### Getting your Razorpay keys

1. Create a free account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Go to **Settings → API Keys**
3. Generate test keys — they start with `rzp_test_`
4. For the webhook secret, go to **Settings → Webhooks → Add Webhook**

### Testing payments

Use these test card details in the Razorpay popup:

```
Card number : 4111 1111 1111 1111
Expiry      : Any future date
CVV         : Any 3 digits
OTP         : 1234
```

---

## API Reference

### Auth
```
POST   /api/auth/register         Register a new user
POST   /api/auth/login            Login and receive JWT
GET    /api/auth/me               Get current user profile (auth required)
```

### Subscription
```
POST   /api/subscription/create-order     Create Razorpay order (auth required)
POST   /api/subscription/verify-payment  Verify and activate subscription (auth required)
POST   /api/subscription/webhook         Razorpay webhook (raw body)
GET    /api/subscription/my-payments     Get payment history (auth required)
```

### Scores
```
GET    /api/scores                Get my scores (subscriber required)
POST   /api/scores                Add a new score (subscriber required)
PUT    /api/scores/:scoreId       Edit a score (subscriber required)
DELETE /api/scores/:scoreId       Delete a score (subscriber required)
```

### Charities
```
GET    /api/charities             List all charities (public)
GET    /api/charities/featured    Get featured charity (public)
GET    /api/charities/:id         Get single charity (public)
POST   /api/charities/select      Select a charity (subscriber required)
POST   /api/charities/donate      Make a donation (auth required)
POST   /api/charities             Create charity (admin only)
PUT    /api/charities/:id         Update charity (admin only)
DELETE /api/charities/:id         Deactivate charity (admin only)
POST   /api/charities/:id/events  Add event to charity (admin only)
```

### Draws
```
GET    /api/draws                        All published draws (public)
GET    /api/draws/:month                 Single draw result (public)
GET    /api/draws/my-result/:month       My result for a draw (auth required)
POST   /api/draws/simulate               Simulate draw (admin only)
POST   /api/draws/publish/:month         Publish draw (admin only)
GET    /api/draws/admin/all              All draws including simulated (admin only)
```

### Winners
```
GET    /api/winners/my-wins                              My win history (auth required)
POST   /api/winners/upload-proof/:drawMonth/:winnerId    Upload proof screenshot (auth required)
GET    /api/winners/admin/pending                        Pending verifications (admin only)
GET    /api/winners/admin/all                            All winners (admin only)
PATCH  /api/winners/admin/verify/:drawMonth/:winnerId    Approve or reject (admin only)
PATCH  /api/winners/admin/mark-paid/:drawMonth/:winnerId Mark payout done (admin only)
```

### Admin
```
GET    /api/admin/analytics                          Full analytics dashboard
GET    /api/admin/users                              All users (paginated, searchable)
GET    /api/admin/users/:userId                      Single user full profile
PUT    /api/admin/users/:userId                      Edit user
PATCH  /api/admin/users/:userId/subscription         Change subscription status
DELETE /api/admin/users/:userId                      Deactivate user
GET    /api/admin/users/:userId/scores               View user scores
PUT    /api/admin/users/:userId/scores/:scoreId      Edit user score
DELETE /api/admin/users/:userId/scores/:scoreId      Delete user score
GET    /api/admin/payments                           All payments (filterable)
```

---

## Draw Engine

The draw engine runs once per month and supports two modes:

### Random mode
A pure lottery — 5 unique numbers are selected from 1–45 with equal probability for each number.

### Weighted mode
Numbers are weighted by their frequency across all active subscriber scores. A number that appears more often in user scores has a higher probability of being drawn. Every number still has a baseline chance to keep things fair.

### Prize pool split

| Match | Pool share | Rollover? |
|---|---|---|
| 5 numbers | 40% | Yes — jackpot carries to next month |
| 4 numbers | 35% | No |
| 3 numbers | 25% | No |

If multiple users match the same tier, the prize is split equally among them.

### Admin workflow

1. Admin clicks **Simulate** — results are calculated and previewed but not published
2. Admin reviews the winning numbers, prize pool breakdown, and winner list
3. Admin clicks **Publish** — results go live and users can see them

---

## Payment Flow

```
User clicks Subscribe
       ↓
Frontend calls POST /api/subscription/create-order
       ↓
Backend creates Razorpay order + Payment record (status: created)
       ↓
Frontend opens Razorpay popup
       ↓
User pays inside popup
       ↓
Razorpay returns payment_id, order_id, signature to frontend
       ↓
Frontend calls POST /api/subscription/verify-payment
       ↓
Backend verifies HMAC signature
       ↓
Payment record updated (status: paid)
User subscription activated (status: active)
       ↓
User redirected to dashboard
```

Recurring renewals and cancellations are handled automatically via Razorpay webhooks at `POST /api/subscription/webhook`.

---

## Deployment

### MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user
3. Whitelist all IPs (`0.0.0.0/0`) or your server IP
4. Copy the connection string into `MONGO_URI` in your `.env`

### Backend ( Render)
1. Push your code to GitHub
2. Connect your repo on [railway.app](https://railway.app) or [render.com](https://render.com)
3. Set all environment variables from your `.env`
4. Set the start command to `node index.js`
5. Deploy — copy the live URL

### Frontend (Vercel)
1. Update `client/vite.config.js` proxy target to your deployed backend URL
2. Push to GitHub
3. Import the repo on [vercel.com](https://vercel.com)
4. Set the root directory to `client`
5. Deploy

### Razorpay webhook (production)
After deploying your backend, go to **Razorpay Dashboard → Settings → Webhooks** and add:
```
https://your-backend-url.com/api/subscription/webhook
```
Select events: `subscription.charged`, `subscription.cancelled`, `subscription.halted`, `payment.captured`, `refund.processed`

---


## .gitignore

Make sure your `.gitignore` includes:

```
# Dependencies
node_modules/

# Environment variables — never commit these
server/.env

# Uploaded files
server/uploads/

# Build output
client/dist/

# OS files
.DS_Store
Thumbs.db
```

---

## License

This project was built as a sample assignment for the Digital Heroes Full-Stack Development Trainee Selection Process.

---

