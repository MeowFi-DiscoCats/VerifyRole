# Express API for Discord NFT Role Management

> Node.js/Express service handling Discord OAuth, NFT ownership checks, and auto role assignment.

---

## 🚀 Core Flow

1. **Discord OAuth2**

   - `GET /api/auth/discord` → Discord login
   - Callback: `/api/auth/discord/callback` → store/update user in MongoDB, issue JWT

2. **NFT Verification**

   - `POST /api/verify` (JWT)
     ```json
     {
       "address": "<wallet>",
       "signature": "<sig>",
       "nftAddress": "<contract>",
       "nftName": "<collection>",
       "guildId": "<guild>"
     }
     ```
   - Verify signature → link wallet → check NFT balance (`ethers.js`)
   - Map to role via `ROLE_MAP` → assign role (`discord.js`) → record in DB

3. **Background Sync**
   - Periodic `checkAndRemoveRoles` → re-verify ownership → remove expired roles

---

## 📂 Project Structure

```text
.
├── dist/                   # Compiled output
├── src/
│   ├── index.ts            # Server + middleware
│   ├── models/user.ts      # Mongoose schema
│   ├── routes/
│   │   ├── index.ts        # `/api` router
│   │   ├── auth.ts         # Discord OAuth + JWT
│   │   └── verify.ts       # NFT check + role assign
│   ├── setup/
│   │   ├── discord.ts      # Bot + ROLE_MAP + sync
│   │   ├── mongoose.ts     # DB connection
│   │   ├── passport.ts     # Discord/JWT strategies
│   │   └── upload.ts       # (opt.) file uploads
│   └── utils/
│       ├── asyncWrapper.ts
│       └── errorMiddleware.ts
├── .env.example
├── Dockerfile
├── eslint.config.js
├── package.json
├── tsconfig.json
└── vercel.json
```

---

## 🔧 Tech Stack

- **Node.js**, **Express**, **TypeScript**
- **MongoDB** + Mongoose
- **Passport.js** (Discord OAuth2, JWT)
- **Ethers.js** (blockchain)
- **discord.js** (bot)
- **Zod** (validation)
- **Docker**, **Vercel**

---

## 🎯 API Endpoints

| Method | Path                         | Description                      |
| ------ | ---------------------------- | -------------------------------- |
| GET    | `/api/auth/discord`          | Start Discord OAuth2             |
| GET    | `/api/auth/discord/callback` | OAuth callback → JWT             |
| POST   | `/api/verify` (auth)         | Verify NFT & assign Discord role |

---

## 🛠️ Setup

1. Clone & install

   ```bash
   git clone <repo>
   cd backend
   npm install
   ```

2. `.env` ← copy `.env.example` + fill:

   - `PORT`, `DB_CONNECTION_URL`, `JWT_SECRET`
   - Discord: `CLIENT_ID`, `CLIENT_SECRET`, `CALLBACK_URL`, `TOKEN`
   - `REDIRECT_URL`, `RPC_URL`, admin creds (opt.), `UPLOADTHING_TOKEN`

3. Update `src/setup/discord.ts` → `ROLE_MAP`
4. Dev / Prod

   ```bash
   npm run dev
   npm run build && npm run start
   ```

---

## 🚀 Deployment

- **Vercel**: uses `vercel.json` → entry `dist/index.js`
- **Docker**: multi-stage → exposes `PORT`

---

## ✅ Quality

- `npm run lint`
- `npm run prettier:check` / `npm run prettier:write`
