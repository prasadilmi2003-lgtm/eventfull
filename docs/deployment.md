# Deploying EventEase (free tier)

Three services, in this order: **MongoDB Atlas** (database) -> **Render** (Express API) -> **Vercel** (React site).
The Vercel site forwards `/api/*` to Render (see `client/vercel.json`), so the browser only ever talks to one
domain and the HTTP-only login cookie is first-party (works in Safari and incognito too).

## 0. Before you start
1. Commit and push everything to GitHub (`git add . && git commit -m "Prepare deployment" && git push`).
2. Make sure `server/.env` is NOT in the repo (it is git-ignored). Secrets go into each host's dashboard, never into files.

## 1. MongoDB Atlas
1. Sign up at mongodb.com/atlas and create a free **M0** cluster.
2. **Database Access** -> add a database user (username + password; avoid special characters in the password).
3. **Network Access** -> add IP `0.0.0.0/0` (Render's free tier has no fixed IP).
4. **Connect -> Drivers** -> copy the connection string and add the database name before the `?`:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/eventease?retryWrites=true&w=majority`
5. Load the demo data once, from your computer (PowerShell, in the `server` folder). **This wipes the collections it seeds, so only run it against the new empty Atlas database:**
   ```powershell
   cd server
   $env:MONGODB_URI = "PASTE-THE-ATLAS-STRING-HERE"
   npm run seed
   ```

## 2. Render (backend)
1. render.com -> **New -> Web Service** -> connect the GitHub repo.
2. Settings: **Root Directory** `server`, **Build Command** `npm install`, **Start Command** `npm start`, **Health Check Path** `/api/health`, instance type Free.
3. **Environment** variables:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | the Atlas string from step 1 |
   | `JWT_SECRET` | a long random string, e.g. run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `CLIENT_URL` | your Vercel URL (add it after step 3, e.g. `https://eventease.vercel.app`) |
   | `GEMINI_API_KEY` | your Gemini key (only needed for the chatbot) |
   | `GEMINI_MODEL` | same value as in `server/.env` |

4. Deploy. Open `https://YOUR-API-NAME.onrender.com/api/health`; it should return `{"status":"ok",...}`.
5. Free instances sleep after ~15 minutes idle, so the first request can take about a minute. Open the site once before a demo or viva.

## 3. Vercel (frontend)
1. In `client/vercel.json` replace `YOUR-API-NAME` with your real Render service name, commit and push.
2. vercel.com -> **Add New -> Project** -> import the repo.
3. Settings: **Root Directory** `client`, framework **Vite** (build `npm run build`, output `dist`).
4. **Environment variable:** `VITE_USE_MOCK` = `false`. Leave `VITE_API_URL` empty.
5. Deploy, then copy the Vercel URL into Render's `CLIENT_URL` (Render redeploys automatically).

## 4. Check it works
- `https://YOUR-SITE.vercel.app` loads and shows events.
- `https://YOUR-SITE.vercel.app/api/health` returns ok (proves the rewrite to Render works).
- Log in with `attendee@demo.com` / `Demo@1234`, book a ticket, open My Tickets.
- Refresh on a deep link such as `/attendee/tickets` (it should not 404).

## Troubleshooting
| Symptom | Cause |
|---|---|
| Site shows demo data only / data vanishes | `VITE_USE_MOCK` is `true` (the mock server is active). Set it to `false` and redeploy |
| `/api/...` returns 404 from Vercel | `client/vercel.json` still has the placeholder API name |
| Login works then logs out on refresh | `NODE_ENV` is not `production` on Render, or `CLIENT_URL` does not exactly match the Vercel URL (no trailing slash) |
| "Not allowed by CORS" in Render logs | `CLIENT_URL` is wrong |
| First load takes ~1 minute | Render free instance was asleep |
| Server crashes on start | `MONGODB_URI` wrong, or Atlas Network Access does not allow `0.0.0.0/0` |
