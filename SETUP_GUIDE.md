# Electryonz 2026 — Complete Setup & Deployment Guide

---

## PROJECT STRUCTURE

```
electryonz-2026/
├── index.html          ← Registration page (frontend)
├── style.css           ← All styles
├── app.js              ← Frontend logic (events, form, modals)
├── qr-code.png         ← ⚠️ YOUR GOOGLE PAY QR (you add this)
├── api/
│   └── register.js     ← Serverless backend (Supabase + Nodemailer)
├── vercel.json         ← Vercel routing config
├── package.json        ← Dependencies
├── .env.example        ← Environment variable template
└── .gitignore
```

---

## FLOW OVERVIEW

```
User fills form
     ↓
Selects events → Total calculated
     ↓
Clicks "Proceed to Payment"
     ↓
QR Modal opens → User pays via Google Pay
     ↓
User enters Transaction ID → Clicks "Confirm"
     ↓
Frontend calls POST /api/register
     ↓
Backend: Saves to Supabase → Sends email to user + organizer
     ↓
Success modal shown to user
```

---

## STEP 1 — ADD YOUR GOOGLE PAY QR CODE

1. Open Google Pay on your phone
2. Go to your profile → "Receive" or "QR Code"
3. Take a screenshot / download the QR
4. Save it as `qr-code.png` inside the project folder
5. Make sure the UPI ID in `index.html` matches yours:
   ```html
   UPI: <strong>altranz2026@okaxis</strong>
   ```
   Change `altranz2026@okaxis` to your actual UPI ID.

---

## STEP 2 — SET UP SUPABASE (Free Database)

### 2a. Create Account & Project
1. Go to https://supabase.com
2. Sign up (free)
3. Click **"New Project"**
4. Name: `electryonz-2026` | Region: Southeast Asia (Singapore)
5. Set a strong database password → **Save it!**
6. Click **Create Project** (takes ~2 minutes)

### 2b. Create the Registrations Table
1. In Supabase → Click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Paste and run this SQL:

```sql
CREATE TABLE registrations (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name        TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL,
  college          TEXT NOT NULL,
  department       TEXT NOT NULL,
  year_of_study    TEXT NOT NULL,
  events           TEXT[] NOT NULL,
  total_amount     INTEGER NOT NULL,
  transaction_id   TEXT NOT NULL,
  payment_status   TEXT DEFAULT 'pending_verification',
  registered_at    TIMESTAMPTZ DEFAULT NOW()
);
```

4. Click **Run** ✓

### 2c. Get Your API Keys
1. Go to **Project Settings** (gear icon, left sidebar)
2. Click **"API"**
3. Copy:
   - **Project URL** → This is your `SUPABASE_URL`
   - **service_role** key (click reveal) → This is your `SUPABASE_SERVICE_KEY`

---

## STEP 3 — SET UP GMAIL APP PASSWORD

> Your real Gmail password won't work. You need an **App Password**.

1. Go to https://myaccount.google.com
2. Click **Security** → Enable **2-Step Verification** (if not done)
3. After enabling → Go to **Security** → scroll to **"App passwords"**
4. Select app: **Mail** | Select device: **Other** → Type "Electryonz"
5. Click **Generate**
6. Copy the **16-character password** (e.g. `abcd efgh ijkl mnop`)
7. This is your `MAIL_PASS` — save it!

---

## STEP 4 — DEPLOY TO VERCEL

### 4a. Push code to GitHub
1. Create a GitHub account at https://github.com (if you don't have one)
2. Create a **new repository** → name it `electryonz-2026` → Public or Private
3. On your computer, open terminal/command prompt in the project folder:

```bash
# If git not installed: https://git-scm.com/downloads

git init
git add .
git commit -m "Initial commit - Electryonz 2026 registration"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/electryonz-2026.git
git push -u origin main
```

### 4b. Deploy on Vercel
1. Go to https://vercel.com → Sign up with GitHub
2. Click **"Add New Project"**
3. Import your `electryonz-2026` repository
4. Framework preset: **Other** (leave default)
5. **DO NOT click Deploy yet** — add environment variables first

### 4c. Add Environment Variables in Vercel
1. In the deployment screen → scroll to **"Environment Variables"**
2. Add these one by one:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Your service_role key |
| `MAIL_USER` | `altranz2026@gmail.com` |
| `MAIL_PASS` | Your 16-char Gmail App Password |

3. Click **Deploy** 🚀
4. Wait ~1 minute → You'll get a live URL like:
   `https://electryonz-2026.vercel.app`

---

## STEP 5 — TEST THE FULL FLOW

1. Open your Vercel URL
2. Fill in the registration form completely
3. Select at least one event
4. Click **"Proceed to Payment"** → QR modal opens
5. (For testing) Enter any dummy Transaction ID like `TEST123`
6. Click **"Confirm Registration"**
7. Check:
   - ✅ Success modal appears on screen
   - ✅ Supabase → Table Editor → see your registration row
   - ✅ Email sent to the test email address
   - ✅ Organizer notification email to `altranz2026@gmail.com`

---

## STEP 6 — VIEW REGISTRATIONS IN SUPABASE

1. Go to https://supabase.com → Your project
2. Click **"Table Editor"** (left sidebar)
3. Click **"registrations"** table
4. All registrations appear here with all details
5. You can **export as CSV** → Table Editor → Download button

To **verify payments** manually:
- Check the `transaction_id` column against your Google Pay history
- Update `payment_status` from `pending_verification` to `confirmed`

---

## STEP 7 — CUSTOM DOMAIN (Optional)

1. In Vercel → Your project → **"Settings"** → **"Domains"**
2. Add your domain (e.g. `electryonz2026.com`)
3. Follow DNS instructions Vercel provides

---

## ADDING MORE EVENTS

Open `app.js` and add to the `EVENTS` array:

```javascript
{ id: 'your-event-id', name: 'EVENT NAME', category: 'technical', fee: 200, feeLabel: '₹200' },
```

Categories: `'technical'` | `'non-technical'` | `'workshop'`

---

## TROUBLESHOOTING

| Problem | Fix |
|---------|-----|
| QR image not showing | Make sure `qr-code.png` is in root folder and pushed to GitHub |
| Email not sending | Check Gmail App Password is correct, not your real password |
| Supabase error | Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct |
| Page not loading | Check Vercel deployment logs for errors |
| Form submits but no DB entry | Check browser console for API errors |

---

## QUICK CHECKLIST BEFORE GOING LIVE

- [ ] Real Google Pay QR added as `qr-code.png`
- [ ] UPI ID updated in `index.html`
- [ ] Supabase table created with correct SQL
- [ ] Environment variables added in Vercel
- [ ] Test registration done end-to-end
- [ ] Confirmation email received
- [ ] Organizer email received at `altranz2026@gmail.com`

---

*Electryonz 2026 Registration System — Built for Vercel + Supabase + Nodemailer*
