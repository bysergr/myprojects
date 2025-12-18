# MyProjects - Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Firebase account
- Git

---

## 1. Clone & Install

```bash
cd projects-nodi
npm install
```

---

## 2. Firebase Setup

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable **Email/Password**
   - Enable **Google** provider

### Get Client Credentials

1. Go to Project Settings → General
2. Under "Your apps", select Web app (or create one)
3. Copy the config values

### Get Admin SDK Credentials

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract values for `.env`

### Configure Firebase Storage CORS

To fix CORS errors when uploading files from localhost, you need to configure CORS for your Firebase Storage bucket.

**Option 1: Using gsutil (Recommended)**

1. Install Google Cloud SDK:
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. Apply CORS configuration:
   ```bash
   gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET
   ```
   
   Replace `YOUR_STORAGE_BUCKET` with your bucket name (e.g., `projects-479002.firebasestorage.app`)

**Option 2: Using Google Cloud Console**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **Cloud Storage** → **Buckets**
4. Click on your storage bucket
5. Go to **Configuration** tab
6. Scroll to **CORS configuration**
7. Click **Edit CORS configuration**
8. Paste the content from `cors.json` in this project
9. Click **Save**

**Option 3: Using Firebase Console (Limited)**

Note: Firebase Console doesn't directly support CORS configuration. You'll need to use one of the methods above.

**Important:** 
- Replace `https://yourdomain.com` in `cors.json` with your production domain
- The CORS configuration allows requests from `localhost:3000` for development
- After configuring CORS, it may take a few minutes to take effect

---

## 3. PostgreSQL Setup

### Create Database

```bash
# Using psql
psql -U postgres
CREATE DATABASE projects_nodi;
\q
```

Or use a hosted service like:
- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)

---

## 4. Environment Configuration

Create `.env` in the project root:

```bash
# ===== FIREBASE CLIENT =====
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456:web:abc123"

# ===== FIREBASE ADMIN SDK =====
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
# Important: Keep the \n characters in the private key
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# ===== DATABASE =====
DATABASE_URL="postgresql://user:password@localhost:5432/projects_nodi?schema=public"
```

### Notes:
- `FIREBASE_PRIVATE_KEY`: Keep the literal `\n` characters (don't replace with actual newlines)
- Get all Firebase values from the downloaded Service Account JSON

---

## 5. Database Migration

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

---

## 6. Run Development Server

```bash
npm run dev
```

Visit:
- **English:** http://localhost:3000/en
- **Spanish:** http://localhost:3000/es

---

## 7. Test the Application

### Create an Account
1. Navigate to `/en/signup`
2. Sign up with email/password or Google
3. Complete profile setup with username

### Add a Project
1. Go to `/en/dashboard/projects`
2. Click "Add Project"
3. Fill in project details
4. Save

### View Public Profile
1. Navigate to `/en/[your-username]`
2. See your public portfolio

---

## Common Issues

### Firebase Auth Error
```
Error: Firebase: Error (auth/invalid-api-key)
```
**Solution:** Check that all Firebase env vars are set correctly in `.env`

### Prisma Connection Error
```
Error: Can't reach database server
```
**Solution:** Verify `DATABASE_URL` is correct and PostgreSQL is running

### Username Type Errors
If you see TypeScript errors about `username` not existing:
```bash
# Regenerate Prisma Client
npx prisma generate
```

### CORS Error in Firebase Storage
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution:** Configure CORS for your Firebase Storage bucket (see section 2 above). Make sure you've:
1. Created and applied the `cors.json` configuration
2. Replaced `YOUR_STORAGE_BUCKET` with your actual bucket name
3. Waited a few minutes for changes to propagate

---

## Build for Production

```bash
# Create optimized build
npm run build

# Start production server
npm start
```

---

## Next Steps

After setup, you can:
- Add avatar/badge upload (requires Firebase Storage)
- Implement project detail pages
- Add analytics tracking
- Enable social features (likes, comments)
- Set up SEO and Open Graph images
